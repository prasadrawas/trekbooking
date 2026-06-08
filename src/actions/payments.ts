"use server";

import crypto from "crypto";
import { requireAuth } from "@/lib/auth";
import { createPaymentService } from "@/lib/services";
import { BookingRepository, PaymentRepository } from "@/lib/repositories";
import { createAdminClient } from "@/lib/supabase/admin";
import { razorpay } from "@/lib/razorpay";

// ─── createRazorpayOrder ──────────────────────────────────────────────────────

export async function createRazorpayOrder(
  bookingId: string,
  amount: number, // in paise
): Promise<{ success: true; orderId: string; amount: number } | { error: string }> {
  try {
    const { supabase, user } = await requireAuth();
    const bookingRepo = new BookingRepository(supabase);
    const paymentRepo = new PaymentRepository(supabase);

    // Verify booking belongs to user and is in pending state
    const booking = await bookingRepo.findById(bookingId);
    if (!booking || booking.trekker_id !== user.id) {
      return { error: "Booking not found." };
    }
    if (booking.status !== "pending") {
      return { error: "Booking is not in a payable state." };
    }

    // Check if a Razorpay order already exists for this booking
    const existingPayment = await paymentRepo.findByOrderId(
      booking.payments?.[0]?.razorpay_order_id ?? "",
    );
    if (existingPayment && existingPayment.status === "pending") {
      return {
        success: true,
        orderId: booking.payments[0].razorpay_order_id!,
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

    // Create payment record
    await paymentRepo.create({
      booking_id: bookingId,
      razorpay_order_id: order.id,
      amount: booking.total_amount,
      currency: "INR",
      status: "created",
    });

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
    const supabase = createAdminClient();
    const service = createPaymentService(supabase);

    // Verify webhook signature
    service.verifyWebhookSignature(payload, signature);

    // Parse and handle the event
    const event = JSON.parse(payload) as { event: string; payload: Record<string, unknown> };
    await service.handleWebhookEvent(event.event, event.payload as Parameters<typeof service.handleWebhookEvent>[1]);

    return { success: true };
  } catch (err) {
    console.error("[handleWebhookEvent] Error processing event:", err);
    return { error: err instanceof Error ? err.message : "Webhook processing failed." };
  }
}
