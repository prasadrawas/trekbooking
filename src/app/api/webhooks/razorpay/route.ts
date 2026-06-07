/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

type RazorpayEventType =
  | "payment.captured"
  | "payment.failed"
  | "refund.processed";

interface RazorpayWebhookEvent {
  event: RazorpayEventType;
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        status: string;
        amount: number;
        email?: string;
        contact?: string;
      };
    };
    refund?: {
      entity: {
        id: string;
        payment_id: string;
        amount: number;
        status: string;
        notes?: Record<string, string>;
      };
    };
  };
}

// ─── Helper: decrement booked_seats directly ──────────────────────────────────

async function releaseSeats(
  supabase: any,
  eventId: string,
  numPersons: number
): Promise<void> {
  const { data: evtRaw } = await supabase
    .from("trek_events")
    .select("booked_seats")
    .eq("id", eventId)
    .single();

  if (evtRaw) {
    const current = (evtRaw as { booked_seats: number }).booked_seats;
    await supabase
      .from("trek_events")
      .update({ booked_seats: Math.max(0, current - numPersons) })
      .eq("id", eventId);
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    // Read raw body — critical for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("[razorpay-webhook] Signature mismatch — possible spoofed request");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse event payload
    let event: RazorpayWebhookEvent;
    try {
      event = JSON.parse(rawBody) as RazorpayWebhookEvent;
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const supabase = createAdminClient();

    switch (event.event) {
      // ── payment.captured ─────────────────────────────────────────────────────
      case "payment.captured": {
        const paymentEntity = event.payload.payment?.entity;
        if (!paymentEntity) break;

        console.log("[razorpay-webhook] payment.captured:", paymentEntity.id, "order:", paymentEntity.order_id);

        const { data: paymentRaw, error: fetchError } = await (supabase as any)
          .from("payments")
          .select("id, booking_id, status")
          .eq("razorpay_order_id", paymentEntity.order_id)
          .single();

        if (fetchError || !paymentRaw) {
          console.error("[razorpay-webhook] Payment not found for order:", paymentEntity.order_id);
          // Return 200 so Razorpay doesn't retry — the order may not be in our system
          return NextResponse.json({ received: true });
        }

        const payment = paymentRaw as { id: string; booking_id: string; status: string };

        if (payment.status === "captured") {
          // Already processed — idempotent response
          return NextResponse.json({ received: true });
        }

        // Update payment to captured
        const { error: paymentUpdateError } = await (supabase as any)
          .from("payments")
          .update({
            razorpay_payment_id: paymentEntity.id,
            status: "captured",
            paid_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        if (paymentUpdateError) {
          console.error("[razorpay-webhook] Failed to update payment:", paymentUpdateError.message);
          return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        // Confirm booking
        const { error: bookingUpdateError } = await (supabase as any)
          .from("bookings")
          .update({ status: "confirmed" })
          .eq("id", payment.booking_id)
          .eq("status", "pending");

        if (bookingUpdateError) {
          console.error("[razorpay-webhook] Failed to confirm booking:", bookingUpdateError.message);
          // Don't fail — payment is captured, booking update can be retried
        }

        break;
      }

      // ── payment.failed ────────────────────────────────────────────────────────
      case "payment.failed": {
        const paymentEntity = event.payload.payment?.entity;
        if (!paymentEntity) break;

        console.log("[razorpay-webhook] payment.failed:", paymentEntity.id, "order:", paymentEntity.order_id);

        const { data: paymentRaw } = await (supabase as any)
          .from("payments")
          .select("id, booking_id, status")
          .eq("razorpay_order_id", paymentEntity.order_id)
          .single();

        if (!paymentRaw) break;

        const payment = paymentRaw as { id: string; booking_id: string; status: string };
        if (payment.status === "failed") break; // idempotent

        await (supabase as any)
          .from("payments")
          .update({
            razorpay_payment_id: paymentEntity.id,
            status: "failed",
          })
          .eq("id", payment.id);

        // Fetch booking to release seats
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
              .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
              .eq("id", payment.booking_id);

            // Release reserved seats directly (no release_seats RPC)
            const totalPersons = booking.num_adults + booking.num_children;
            await releaseSeats(supabase, booking.trek_event_id, totalPersons);
          }
        }

        break;
      }

      // ── refund.processed ──────────────────────────────────────────────────────
      case "refund.processed": {
        const refundEntity = event.payload.refund?.entity;
        if (!refundEntity) break;

        console.log("[razorpay-webhook] refund.processed:", refundEntity.id, "payment:", refundEntity.payment_id);

        const { data: paymentRaw } = await (supabase as any)
          .from("payments")
          .select("id, booking_id, status")
          .eq("razorpay_payment_id", refundEntity.payment_id)
          .single();

        if (!paymentRaw) {
          console.warn("[razorpay-webhook] Payment not found for refund, payment_id:", refundEntity.payment_id);
          break;
        }

        const payment = paymentRaw as { id: string; booking_id: string; status: string };
        if (payment.status === "refunded") break; // idempotent

        await (supabase as any)
          .from("payments")
          .update({ status: "refunded" })
          .eq("id", payment.id);

        // Mark booking as refunded if not already cancelled
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

          if (booking.status !== "cancelled" && booking.status !== "refunded") {
            await (supabase as any)
              .from("bookings")
              .update({ status: "refunded", cancelled_at: new Date().toISOString() })
              .eq("id", payment.booking_id);

            // Release seats if booking was confirmed
            if (booking.status === "confirmed") {
              const totalPersons = booking.num_adults + booking.num_children;
              await releaseSeats(supabase, booking.trek_event_id, totalPersons);
            }
          }
        }

        break;
      }

      default:
        // Unknown event — log but acknowledge to prevent retries
        console.log("[razorpay-webhook] Unhandled event:", event.event);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("[razorpay-webhook] Unhandled error:", err);
    // Return 500 so Razorpay retries the delivery
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
