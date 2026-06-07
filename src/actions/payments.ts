"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { razorpay } from "@/lib/razorpay";

// ─── createRazorpayOrder ──────────────────────────────────────────────────────

export async function createRazorpayOrder(
  bookingId: string,
  amount: number, // in paise
): Promise<{ success: true; orderId: string; amount: number } | { error: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Not authenticated." };

    // Verify booking belongs to user and is in pending state
    const { data: bookingRaw, error: bookingError } = await (supabase as any)
      .from("bookings")
      .select("id, trekker_id, total_amount, status")
      .eq("id", bookingId)
      .eq("trekker_id", user.id)
      .single();

    if (bookingError || !bookingRaw) return { error: "Booking not found." };
    const booking = bookingRaw as { id: string; trekker_id: string; total_amount: number; status: string };

    if (booking.status !== "pending") return { error: "Booking is not in a payable state." };

    // Check if a Razorpay order already exists for this booking
    const { data: existingPaymentRaw } = await (supabase as any)
      .from("payments")
      .select("razorpay_order_id, status")
      .eq("booking_id", bookingId)
      .single();

    const existingPayment = existingPaymentRaw as {
      razorpay_order_id: string;
      status: string;
    } | null;

    if (existingPayment?.razorpay_order_id && existingPayment.status === "pending") {
      return {
        success: true,
        orderId: existingPayment.razorpay_order_id,
        amount,
      };
    }

    const amountPaise = amount > 100 ? amount : booking.total_amount * 100;

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `bkg_${bookingId.slice(0, 12)}`,
      notes: {
        booking_id: bookingId,
        user_id: user.id,
      },
    });

    // Upsert payment record
    const { error: upsertError } = await (supabase as any).from("payments").upsert(
      {
        booking_id: bookingId,
        razorpay_order_id: order.id,
        amount: booking.total_amount,
        currency: "INR",
        status: "created",
      },
      { onConflict: "booking_id" },
    );

    if (upsertError) return { error: upsertError.message };

    return { success: true, orderId: order.id, amount: amountPaise };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create Razorpay order.",
    };
  }
}

// ─── handleWebhookEvent ───────────────────────────────────────────────────────

export type WebhookEventType =
  | "payment.captured"
  | "payment.failed"
  | "refund.processed";

interface RazorpayWebhookPayload {
  event: WebhookEventType;
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        status: string;
        amount: number;
      };
    };
    refund?: {
      entity: {
        id: string;
        payment_id: string;
        amount: number;
        status: string;
      };
    };
  };
}

/**
 * Verify and process a Razorpay webhook event.
 * Designed to be called from the POST /api/webhooks/razorpay route.
 * Uses the admin client to bypass RLS for reliable updates.
 */
export async function handleWebhookEvent(
  payload: string,
  signature: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return { error: "Webhook secret not configured." };
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    if (expectedSignature !== signature) {
      return { error: "Invalid webhook signature." };
    }

    const event: RazorpayWebhookPayload = JSON.parse(payload);
    const supabase = createAdminClient();

    switch (event.event) {
      case "payment.captured": {
        const paymentEntity = event.payload.payment?.entity;
        if (!paymentEntity) return { error: "Missing payment entity." };

        const { data: paymentRaw } = await (supabase as any)
          .from("payments")
          .select("id, booking_id, status")
          .eq("razorpay_order_id", paymentEntity.order_id)
          .single();

        if (!paymentRaw) {
          console.error("[handleWebhookEvent] Payment not found for order:", paymentEntity.order_id);
          return { error: "Payment record not found." };
        }

        const payment = paymentRaw as { id: string; booking_id: string; status: string };
        if (payment.status === "captured") break; // idempotent

        await (supabase as any)
          .from("payments")
          .update({
            razorpay_payment_id: paymentEntity.id,
            status: "captured",
            paid_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        await (supabase as any)
          .from("bookings")
          .update({ status: "confirmed" })
          .eq("id", payment.booking_id)
          .eq("status", "pending");

        break;
      }

      case "payment.failed": {
        const paymentEntity = event.payload.payment?.entity;
        if (!paymentEntity) return { error: "Missing payment entity." };

        const { data: paymentRaw } = await (supabase as any)
          .from("payments")
          .select("id, booking_id, status")
          .eq("razorpay_order_id", paymentEntity.order_id)
          .single();

        if (paymentRaw) {
          const payment = paymentRaw as { id: string; booking_id: string; status: string };

          await (supabase as any)
            .from("payments")
            .update({
              razorpay_payment_id: paymentEntity.id,
              status: "failed",
            })
            .eq("id", payment.id);

          const { data: bookingRaw } = await (supabase as any)
            .from("bookings")
            .select("id, trek_event_id, num_adults, num_children, status")
            .eq("id", payment.booking_id)
            .single();

          if (bookingRaw) {
            const booking = bookingRaw as {
              id: string;
              trek_event_id: string;
              num_adults: number;
              num_children: number;
              status: string;
            };
            if (booking.status === "pending") {
              await (supabase as any)
                .from("bookings")
                .update({ status: "cancelled" })
                .eq("id", payment.booking_id);

              // Release seats via direct update
              const totalPersons = booking.num_adults + (booking.num_children ?? 0);
              const { data: eventCurrent } = await (supabase as any)
                .from("trek_events")
                .select("booked_seats")
                .eq("id", booking.trek_event_id)
                .single();
              if (eventCurrent) {
                const newCount = Math.max(
                  0,
                  (eventCurrent as { booked_seats: number }).booked_seats - totalPersons,
                );
                await (supabase as any)
                  .from("trek_events")
                  .update({ booked_seats: newCount })
                  .eq("id", booking.trek_event_id);
              }
            }
          }
        }
        break;
      }

      case "refund.processed": {
        const refundEntity = event.payload.refund?.entity;
        if (!refundEntity) return { error: "Missing refund entity." };

        const { data: paymentRaw } = await (supabase as any)
          .from("payments")
          .select("id, booking_id")
          .eq("razorpay_payment_id", refundEntity.payment_id)
          .single();

        if (paymentRaw) {
          const payment = paymentRaw as { id: string; booking_id: string };
          await (supabase as any)
            .from("payments")
            .update({ status: "refunded" })
            .eq("id", payment.id);

          await (supabase as any)
            .from("bookings")
            .update({ status: "refunded" })
            .eq("id", payment.booking_id);
        }
        break;
      }

      default:
        console.log("[handleWebhookEvent] Unhandled event type:", event.event);
    }

    return { success: true };
  } catch (err) {
    console.error("[handleWebhookEvent] Error processing event:", err);
    return { error: err instanceof Error ? err.message : "Webhook processing failed." };
  }
}
