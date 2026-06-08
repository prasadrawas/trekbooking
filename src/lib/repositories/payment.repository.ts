/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Payment, PaymentInsert } from "@/types/database";

// ─── Types for query results ────────────────────────────────────────────────

export interface PaymentBasic {
  id: string;
  booking_id: string;
  status: string;
}

export interface PaymentWithPaymentId {
  razorpay_payment_id: string | null;
}

export class PaymentRepository {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Fetch a payment record by its Razorpay order ID.
   * Returns id, booking_id, and status. Used during payment verification
   * and webhook processing.
   */
  async findByOrderId(razorpayOrderId: string): Promise<PaymentBasic | null> {
    const { data, error } = await (this.client as any)
      .from("payments")
      .select("id, booking_id, status")
      .eq("razorpay_order_id", razorpayOrderId)
      .single();

    if (error || !data) return null;
    return data as PaymentBasic;
  }

  /**
   * Fetch a payment record by its Razorpay payment ID.
   * Returns id, booking_id, and status. Used by refund webhook processing.
   */
  async findByPaymentId(razorpayPaymentId: string): Promise<PaymentBasic | null> {
    const { data, error } = await (this.client as any)
      .from("payments")
      .select("id, booking_id, status")
      .eq("razorpay_payment_id", razorpayPaymentId)
      .single();

    if (error || !data) return null;
    return data as PaymentBasic;
  }

  /**
   * Fetch the Razorpay payment ID for a booking's captured payment.
   * Used during cancellation to initiate a refund.
   */
  async findCapturedPaymentId(bookingId: string): Promise<string | null> {
    const { data } = await (this.client as any)
      .from("payments")
      .select("razorpay_payment_id")
      .eq("booking_id", bookingId)
      .eq("status", "captured")
      .single();

    if (!data) return null;
    return (data as PaymentWithPaymentId).razorpay_payment_id;
  }

  /**
   * Create a new payment record (e.g. after creating a Razorpay order).
   */
  async create(payment: PaymentInsert): Promise<void> {
    const { error } = await (this.client as any)
      .from("payments")
      .insert(payment);

    if (error) throw new Error(`PaymentRepository.create: ${error.message}`);
  }

  /**
   * Update a payment to "captured" status after successful verification.
   * Sets the razorpay_payment_id, razorpay_signature, and paid_at timestamp.
   */
  async markCaptured(
    paymentId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<void> {
    const { error } = await (this.client as any)
      .from("payments")
      .update({
        status: "captured",
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        paid_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (error) throw new Error(`PaymentRepository.markCaptured: ${error.message}`);
  }

  /**
   * Update a payment to "captured" status via webhook (no signature available).
   * Sets the razorpay_payment_id and paid_at timestamp.
   */
  async markCapturedFromWebhook(
    paymentId: string,
    razorpayPaymentId: string
  ): Promise<void> {
    const { error } = await (this.client as any)
      .from("payments")
      .update({
        razorpay_payment_id: razorpayPaymentId,
        status: "captured",
        paid_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (error) throw new Error(`PaymentRepository.markCapturedFromWebhook: ${error.message}`);
  }

  /**
   * Update a payment to "failed" status. Sets the razorpay_payment_id.
   */
  async markFailed(paymentId: string, razorpayPaymentId: string): Promise<void> {
    const { error } = await (this.client as any)
      .from("payments")
      .update({
        razorpay_payment_id: razorpayPaymentId,
        status: "failed",
      })
      .eq("id", paymentId);

    if (error) throw new Error(`PaymentRepository.markFailed: ${error.message}`);
  }

  /**
   * Update a payment to "refunded" status.
   */
  async markRefunded(paymentId: string): Promise<void> {
    const { error } = await (this.client as any)
      .from("payments")
      .update({ status: "refunded" })
      .eq("id", paymentId);

    if (error) throw new Error(`PaymentRepository.markRefunded: ${error.message}`);
  }
}
