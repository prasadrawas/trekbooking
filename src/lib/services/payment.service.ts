import crypto from "crypto";
import type { PaymentRepository } from "@/lib/repositories/payment.repository";
import type { BookingRepository } from "@/lib/repositories/booking.repository";
import type { TrekEventRepository } from "@/lib/repositories/trek-event.repository";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  status: string;
  amount: number;
  email?: string;
  contact?: string;
}

interface RazorpayRefundEntity {
  id: string;
  payment_id: string;
  amount: number;
  status: string;
  notes?: Record<string, string>;
}

interface RazorpayWebhookPayload {
  payment?: { entity: RazorpayPaymentEntity };
  refund?: { entity: RazorpayRefundEntity };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class PaymentService {
  constructor(
    private paymentRepo: PaymentRepository,
    private bookingRepo: BookingRepository,
    private eventRepo: TrekEventRepository,
  ) {}

  /**
   * Verify a Razorpay payment signature (client-side verification flow).
   * HMAC-SHA256 of `order_id|payment_id` against RAZORPAY_KEY_SECRET.
   * On success, marks the payment as captured and confirms the booking.
   */
  async verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): Promise<{ success: boolean; booking_id: string }> {
    if (!orderId || !paymentId || !signature) {
      throw new Error(
        "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required",
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new Error("Payment verification not configured");
    }

    // ── Step 1: Verify signature ─────────────────────────────────────────────
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      throw new Error("Invalid payment signature");
    }

    // ── Step 2: Fetch payment record ─────────────────────────────────────────
    const payment = await this.paymentRepo.findByOrderId(orderId);
    if (!payment) {
      throw new Error("Payment record not found");
    }

    // Idempotency: already captured
    if (payment.status === "captured") {
      return { success: true, booking_id: payment.booking_id };
    }

    // ── Step 3: Update payment to captured ───────────────────────────────────
    await this.paymentRepo.markCaptured(payment.id, paymentId, signature);

    // ── Step 4: Confirm booking ──────────────────────────────────────────────
    await this.bookingRepo
      .updateStatusWhere(payment.booking_id, "pending", "confirmed")
      .catch((err) => {
        console.error(
          "[PaymentService.verifyPaymentSignature] Failed to confirm booking:",
          err?.message,
        );
        // Non-fatal -- payment is captured, booking state can be reconciled via webhook
      });

    return { success: true, booking_id: payment.booking_id };
  }

  /**
   * Verify the Razorpay webhook signature.
   * HMAC-SHA256 of the raw body against RAZORPAY_WEBHOOK_SECRET.
   * Throws if the signature does not match.
   */
  verifyWebhookSignature(rawBody: string, signature: string): void {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("Webhook secret not configured");
    }

    if (!signature) {
      throw new Error("Missing signature header");
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      throw new Error("Invalid signature");
    }
  }

  /**
   * Handle a Razorpay webhook event after signature verification.
   * Supported events: payment.captured, payment.failed, refund.processed.
   */
  async handleWebhookEvent(
    eventType: string,
    payload: RazorpayWebhookPayload,
  ): Promise<void> {
    switch (eventType) {
      case "payment.captured":
        await this.handlePaymentCaptured(payload);
        break;
      case "payment.failed":
        await this.handlePaymentFailed(payload);
        break;
      case "refund.processed":
        await this.handleRefundProcessed(payload);
        break;
      default:
        console.log("[PaymentService] Unhandled webhook event:", eventType);
    }
  }

  // ─── Private handlers ──────────────────────────────────────────────────────

  private async handlePaymentCaptured(
    payload: RazorpayWebhookPayload,
  ): Promise<void> {
    const paymentEntity = payload.payment?.entity;
    if (!paymentEntity) return;

    const payment = await this.paymentRepo.findByOrderId(
      paymentEntity.order_id,
    );
    if (!payment) return; // Order may not be in our system

    // Idempotent: already processed
    if (payment.status === "captured") return;

    // Update payment to captured
    await this.paymentRepo.markCapturedFromWebhook(
      payment.id,
      paymentEntity.id,
    );

    // Confirm booking
    await this.bookingRepo
      .updateStatusWhere(payment.booking_id, "pending", "confirmed")
      .catch((err) => {
        console.error(
          "[PaymentService.handlePaymentCaptured] Failed to confirm booking:",
          err?.message,
        );
      });
  }

  private async handlePaymentFailed(
    payload: RazorpayWebhookPayload,
  ): Promise<void> {
    const paymentEntity = payload.payment?.entity;
    if (!paymentEntity) return;

    const payment = await this.paymentRepo.findByOrderId(
      paymentEntity.order_id,
    );
    if (!payment) return;

    // Idempotent
    if (payment.status === "failed") return;

    await this.paymentRepo.markFailed(payment.id, paymentEntity.id);

    // Fetch booking to release seats
    const booking = await this.bookingRepo.findByIdForWebhook(
      payment.booking_id,
    );
    if (!booking) return;

    if (booking.status === "pending") {
      await this.bookingRepo.cancelBooking(payment.booking_id);

      const totalPersons = booking.num_adults + booking.num_children;
      await this.eventRepo.releaseSeats(booking.trek_event_id, totalPersons);
    }
  }

  private async handleRefundProcessed(
    payload: RazorpayWebhookPayload,
  ): Promise<void> {
    const refundEntity = payload.refund?.entity;
    if (!refundEntity) return;

    const payment = await this.paymentRepo.findByPaymentId(
      refundEntity.payment_id,
    );
    if (!payment) return;

    // Idempotent
    if (payment.status === "refunded") return;

    await this.paymentRepo.markRefunded(payment.id);

    // Mark booking as refunded if not already cancelled
    const booking = await this.bookingRepo.findByIdForWebhook(
      payment.booking_id,
    );
    if (!booking) return;

    if (
      booking.status !== "cancelled" &&
      booking.status !== "refunded"
    ) {
      await this.bookingRepo.markRefunded(payment.booking_id);

      // Release seats if booking was confirmed
      if (booking.status === "confirmed") {
        const totalPersons = booking.num_adults + booking.num_children;
        await this.eventRepo.releaseSeats(
          booking.trek_event_id,
          totalPersons,
        );
      }
    }
  }
}
