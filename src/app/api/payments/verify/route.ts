/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

// ─── POST /api/payments/verify ────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("[POST /api/payments/verify] RAZORPAY_KEY_SECRET is not configured");
      return NextResponse.json(
        { error: "Payment verification not configured" },
        { status: 500 }
      );
    }

    // ── Step 1: Verify Razorpay signature ─────────────────────────────────────
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.warn("[POST /api/payments/verify] Signature mismatch for order:", razorpay_order_id);
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // ── Step 2a: Fetch payment record ─────────────────────────────────────────
    const { data: paymentRaw, error: fetchError } = await (supabase as any)
      .from("payments")
      .select("id, booking_id, status")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (fetchError || !paymentRaw) {
      console.error("[POST /api/payments/verify] Payment not found for order:", razorpay_order_id);
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    const payment = paymentRaw as { id: string; booking_id: string; status: string };

    // Idempotency: already captured
    if (payment.status === "captured") {
      return NextResponse.json({ success: true, booking_id: payment.booking_id });
    }

    const now = new Date().toISOString();

    // ── Step 2b: Update payment to captured ───────────────────────────────────
    const { error: paymentUpdateError } = await (supabase as any)
      .from("payments")
      .update({
        status: "captured",
        razorpay_payment_id,
        razorpay_signature,
        paid_at: now,
      })
      .eq("id", payment.id);

    if (paymentUpdateError) {
      console.error("[POST /api/payments/verify] Failed to update payment:", paymentUpdateError.message);
      return NextResponse.json({ error: "Failed to update payment record" }, { status: 500 });
    }

    // ── Step 2c: Confirm booking ──────────────────────────────────────────────
    const { error: bookingUpdateError } = await (supabase as any)
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", payment.booking_id)
      .eq("status", "pending");

    if (bookingUpdateError) {
      console.error("[POST /api/payments/verify] Failed to confirm booking:", bookingUpdateError.message);
      // Non-fatal — payment is captured, booking state can be reconciled via webhook
    }

    return NextResponse.json({ success: true, booking_id: payment.booking_id });
  } catch (err) {
    console.error("[POST /api/payments/verify] Unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
