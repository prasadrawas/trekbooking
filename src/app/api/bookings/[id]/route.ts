/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { razorpay } from "@/lib/razorpay";
import { calculateRefund, DEFAULT_CANCELLATION_RULES } from "@/lib/cancellation";
import type { CancellationRule } from "@/lib/cancellation";

// ─── GET /api/bookings/:id ────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch booking with full join
    const { data: bookingRaw, error: bookingError } = await (supabase as any)
      .from("bookings")
      .select(
        `
        id,
        booking_number,
        status,
        num_adults,
        num_children,
        total_amount,
        platform_fee,
        organizer_amount,
        booking_name,
        booking_email,
        booking_phone,
        emergency_contact,
        special_requests,
        selected_pickup_id,
        created_at,
        cancelled_at,
        cancellation_reason,
        trekker_id,
        trek_event_id,
        payments (
          id,
          razorpay_order_id,
          razorpay_payment_id,
          amount,
          currency,
          status,
          method,
          paid_at
        ),
        trek_events (
          id,
          event_date,
          reporting_time,
          price,
          child_price,
          treks (
            id,
            title,
            slug,
            organizer_id,
            organizers (
              id,
              org_name,
              profile_id
            )
          )
        ),
        pickup_points (
          id,
          label,
          pickup_time,
          address,
          maps_url,
          extra_charge
        )
      `
      )
      .eq("id", id)
      .single();

    if (bookingError || !bookingRaw) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingRaw as {
      trekker_id: string;
      trek_events: {
        treks: {
          organizer_id: string;
          organizers: { profile_id: string } | null;
        };
      } | null;
      [key: string]: unknown;
    };

    // Authorization: owner trekker OR organizer of the trek
    const isTrekker = booking.trekker_id === user.id;
    const organizerProfileId =
      booking.trek_events?.treks?.organizers?.profile_id ?? null;
    const isOrganizer = organizerProfileId === user.id;

    if (!isTrekker && !isOrganizer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ booking });
  } catch (err) {
    console.error("[GET /api/bookings/:id] Unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── PUT /api/bookings/:id ────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { action: string; reason?: string };
    try {
      body = (await request.json()) as { action: string; reason?: string };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (body.action !== "cancel") {
      return NextResponse.json(
        { error: `Unknown action '${body.action}'. Supported: cancel` },
        { status: 400 }
      );
    }

    // ── Step 1: Fetch booking and verify ownership ────────────────────────────
    const { data: bookingRaw, error: fetchError } = await (supabase as any)
      .from("bookings")
      .select(
        `
        id,
        status,
        num_adults,
        num_children,
        total_amount,
        trek_event_id,
        trekker_id,
        trek_events (
          event_date,
          reporting_time,
          treks (
            cancellation_rules,
            organizers (
              profile_id
            )
          )
        )
      `
      )
      .eq("id", id)
      .single();

    if (fetchError || !bookingRaw) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingRaw as {
      id: string;
      status: string;
      num_adults: number;
      num_children: number;
      total_amount: number;
      trek_event_id: string;
      trekker_id: string;
      trek_events: {
        event_date: string;
        reporting_time: string;
        treks: {
          cancellation_rules: CancellationRule[] | null;
          organizers: { profile_id: string } | null;
        } | null;
      } | null;
    };

    const isTrekker = booking.trekker_id === user.id;
    const organizerProfileId =
      booking.trek_events?.treks?.organizers?.profile_id ?? null;
    const isOrganizer = organizerProfileId === user.id;

    if (!isTrekker && !isOrganizer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    if (booking.status === "completed") {
      return NextResponse.json(
        { error: "Cannot cancel a completed booking" },
        { status: 400 }
      );
    }

    // ── Step 2: Calculate refund ──────────────────────────────────────────────
    const rules: CancellationRule[] =
      booking.trek_events?.treks?.cancellation_rules ?? DEFAULT_CANCELLATION_RULES;
    const eventDate = booking.trek_events?.event_date ?? "";
    // reporting_time may come back as "HH:MM:SS" — trim to "HH:MM"
    const reportingTime = (booking.trek_events?.reporting_time ?? "00:00").slice(0, 5);
    const { refundPercent, refundAmount, reason: refundReason } = calculateRefund(
      rules,
      eventDate,
      reportingTime,
      Number(booking.total_amount),
    );

    const cancellationNote = `${body.reason ? body.reason + " | " : ""}${refundReason}`;
    const now = new Date().toISOString();
    const totalPersons = booking.num_adults + booking.num_children;

    // ── Step 3: Cancel the booking ────────────────────────────────────────────
    const { data: updatedRaw, error: updateError } = await (supabase as any)
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: now,
        cancellation_reason: cancellationNote,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[PUT /api/bookings/:id] Update error:", updateError.message);
      return NextResponse.json(
        { error: "Failed to cancel booking" },
        { status: 500 }
      );
    }

    // ── Step 4: Release seats ─────────────────────────────────────────────────
    // Decrement booked_seats directly (no release_seats RPC exists)
    const { data: evtRaw } = await (supabase as any)
      .from("trek_events")
      .select("booked_seats")
      .eq("id", booking.trek_event_id)
      .single();
    if (evtRaw) {
      const currentBooked = (evtRaw as { booked_seats: number }).booked_seats;
      const { error: seatUpdateError } = await (supabase as any)
        .from("trek_events")
        .update({ booked_seats: Math.max(0, currentBooked - totalPersons) })
        .eq("id", booking.trek_event_id);
      if (seatUpdateError) {
        console.error("[PUT /api/bookings/:id] Failed to release seats:", seatUpdateError.message);
        // Non-fatal — booking is cancelled; seat count can be reconciled separately
      }
    }

    // ── Step 5: Initiate Razorpay refund if applicable ────────────────────────
    if (refundAmount > 0) {
      const { data: paymentData } = await (supabase as any)
        .from("payments")
        .select("razorpay_payment_id")
        .eq("booking_id", id)
        .eq("status", "captured")
        .single();

      if (paymentData?.razorpay_payment_id) {
        try {
          await razorpay.payments.refund(paymentData.razorpay_payment_id, {
            amount: refundAmount * 100, // paise
            notes: { booking_id: id, reason: refundReason },
          });
        } catch (refundErr) {
          console.error("[PUT /api/bookings/:id] Razorpay refund failed:", refundErr);
          // Non-fatal — booking is already cancelled; refund can be retried
        }
      }
    }

    return NextResponse.json({ booking: updatedRaw, refundAmount, refundPercent, reason: refundReason });
  } catch (err) {
    console.error("[PUT /api/bookings/:id] Unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
