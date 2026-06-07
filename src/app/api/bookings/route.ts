/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { razorpay } from "@/lib/razorpay";
import { COMMISSION_RATE } from "@/lib/constants";

// ─── Auto-complete bookings where trek date has passed ───────────────────────
// Throttled: runs at most once every 5 minutes to avoid performance tax

let lastAutoCompleteRun = 0;
const AUTO_COMPLETE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function autoCompleteBookings() {
  const now = Date.now();
  if (now - lastAutoCompleteRun < AUTO_COMPLETE_INTERVAL_MS) return;
  lastAutoCompleteRun = now;

  const admin = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: pastEvents } = await (admin as any)
    .from("trek_events")
    .select("id")
    .lt("event_date", today)
    .in("status", ["upcoming", "full"]);

  if (!pastEvents || pastEvents.length === 0) return;

  const pastEventIds = pastEvents.map((e: { id: string }) => e.id);

  await (admin as any)
    .from("bookings")
    .update({ status: "completed" })
    .in("trek_event_id", pastEventIds)
    .eq("status", "confirmed");

  await (admin as any)
    .from("trek_events")
    .update({ status: "completed" })
    .in("id", pastEventIds)
    .in("status", ["upcoming", "full"]);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingRequestBody {
  trek_event_id: string;
  num_adults: number;
  num_children?: number;
  booking_name: string;
  booking_email: string;
  booking_phone: string;
  emergency_contact?: string;
  special_requests?: string;
  selected_pickup_id?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateBookingNumber(): string {
  const now = new Date();
  const date =
    String(now.getFullYear()) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SB-${date}-${suffix}`;
}

// ─── GET /api/bookings ────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auto-complete past bookings (throttled — runs at most every 5 minutes, after auth)
    autoCompleteBookings().catch(() => {}); // fire-and-forget, don't await

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // upcoming | past | cancelled
    const trekEventId = searchParams.get("trek_event_id");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    // Determine user role from profile
    const { data: profileRaw } = await (supabase as any)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const profile = profileRaw as { role: string } | null;
    const isOrganizer = profile?.role === "organizer";

    let query = (supabase as any)
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
        created_at,
        cancelled_at,
        trek_event_id,
        trek_events (
          event_date,
          reporting_time,
          price,
          child_price,
          treks (
            title,
            slug
          )
        )
      `,
        { count: "exact" }
      )
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (isOrganizer) {
      // Organizer: get organizer record then filter by their trek events
      const { data: organizerRaw } = await (supabase as any)
        .from("organizers")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!organizerRaw) {
        return NextResponse.json({ error: "Organizer profile not found" }, { status: 404 });
      }

      const org = organizerRaw as { id: string };

      // Filter bookings for events belonging to this organizer's treks
      query = query.eq("trek_events.treks.organizer_id", org.id);
    } else {
      // Trekker: their own bookings
      query = query.eq("trekker_id", user.id);
    }

    // Apply status filter
    if (status === "upcoming") {
      query = query.in("status", ["pending", "confirmed"]);
    } else if (status === "past") {
      query = query.in("status", ["completed"]);
    } else if (status === "cancelled") {
      query = query.in("status", ["cancelled", "refunded"]);
    }

    // Apply trek_event_id filter
    if (trekEventId) {
      query = query.eq("trek_event_id", trekEventId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[GET /api/bookings] Query error:", error.message);
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }

    return NextResponse.json({
      bookings: data ?? [],
      total: count ?? 0,
      page,
    });
  } catch (err) {
    console.error("[GET /api/bookings] Unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST /api/bookings ───────────────────────────────────────────────────────

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

    // Verify user is a trekker
    const { data: profileRaw } = await (supabase as any)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const profile = profileRaw as { role: string } | null;
    if (!profile || profile.role !== "trekker") {
      return NextResponse.json(
        { error: "Only trekkers can create bookings" },
        { status: 403 }
      );
    }

    let body: BookingRequestBody;
    try {
      body = (await request.json()) as BookingRequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      trek_event_id,
      num_adults,
      num_children = 0,
      booking_name,
      booking_email,
      booking_phone,
      emergency_contact,
      special_requests,
      selected_pickup_id,
    } = body;

    // Basic validation
    if (!trek_event_id || !num_adults || num_adults < 1) {
      return NextResponse.json(
        { error: "trek_event_id and at least 1 adult are required" },
        { status: 400 }
      );
    }
    if (!booking_name || !booking_email || !booking_phone) {
      return NextResponse.json(
        { error: "booking_name, booking_email, and booking_phone are required" },
        { status: 400 }
      );
    }

    // ── Step 1: Validate event exists and has seats ───────────────────────────
    const { data: eventRaw, error: eventError } = await (supabase as any)
      .from("trek_events")
      .select("id, price, child_price, total_seats, booked_seats, status")
      .eq("id", trek_event_id)
      .single();

    if (eventError || !eventRaw) {
      return NextResponse.json({ error: "Trek event not found" }, { status: 404 });
    }

    const event = eventRaw as {
      id: string;
      price: number;
      child_price: number | null;
      total_seats: number;
      booked_seats: number;
      status: string;
    };

    if (event.status !== "upcoming") {
      return NextResponse.json(
        { error: "Trek event is no longer available for booking" },
        { status: 400 }
      );
    }

    const availableSeats = event.total_seats - event.booked_seats;
    const totalPersons = num_adults + num_children;

    if (totalPersons > availableSeats) {
      return NextResponse.json(
        { error: `Only ${availableSeats} seat(s) available` },
        { status: 400 }
      );
    }

    // ── Step 2: Calculate total amount ────────────────────────────────────────
    const childPrice = event.child_price ?? event.price;
    let total = num_adults * event.price + num_children * childPrice;

    // Add pickup extra charge if applicable
    if (selected_pickup_id) {
      const { data: pickupRaw } = await (supabase as any)
        .from("pickup_points")
        .select("extra_charge")
        .eq("id", selected_pickup_id)
        .eq("trek_event_id", trek_event_id)
        .single();

      if (pickupRaw) {
        const pickup = pickupRaw as { extra_charge: number };
        total += pickup.extra_charge * totalPersons;
      }
    }

    // ── Step 3: Calculate fees ────────────────────────────────────────────────
    const platformFee = Math.round(COMMISSION_RATE * total * 100) / 100;
    const organizerAmount = Math.round((total - platformFee) * 100) / 100;

    // ── Step 4: Generate booking number ──────────────────────────────────────
    const bookingNumber = generateBookingNumber();

    // ── Step 5: Reserve seats atomically via RPC ──────────────────────────────
    const { error: rpcError } = await (supabase as any).rpc("book_seats", {
      p_event_id: trek_event_id,
      p_num_persons: totalPersons,
    });

    if (rpcError) {
      console.error("[POST /api/bookings] book_seats RPC error:", rpcError.message);
      return NextResponse.json(
        { error: rpcError.message ?? "Failed to reserve seats" },
        { status: 400 }
      );
    }

    // ── Steps 6-8: Insert booking, create Razorpay order, insert payment ──────
    let bookingId: string | null = null;

    try {
      // Step 6: Insert booking record
      const { data: bookingRaw, error: bookingError } = await (supabase as any)
        .from("bookings")
        .insert({
          booking_number: bookingNumber,
          trek_event_id,
          trekker_id: user.id,
          num_adults,
          num_children,
          total_amount: total,
          platform_fee: platformFee,
          organizer_amount: organizerAmount,
          status: "pending",
          booking_name,
          booking_email,
          booking_phone,
          emergency_contact: emergency_contact ?? null,
          special_requests: special_requests ?? null,
          selected_pickup_id: selected_pickup_id ?? null,
        })
        .select("id, booking_number")
        .single();

      if (bookingError || !bookingRaw) {
        throw new Error(bookingError?.message ?? "Failed to create booking record");
      }

      const booking = bookingRaw as { id: string; booking_number: string };
      bookingId = booking.id;

      // Step 7: Create Razorpay order
      const totalInPaise = Math.round(total * 100);
      const razorpayOrder = await razorpay.orders.create({
        amount: totalInPaise,
        currency: "INR",
        receipt: bookingNumber,
      });

      // Step 8: Insert payment record
      const { error: paymentError } = await (supabase as any)
        .from("payments")
        .insert({
          booking_id: booking.id,
          razorpay_order_id: razorpayOrder.id,
          amount: total,
          currency: "INR",
          status: "created",
        });

      if (paymentError) {
        throw new Error(paymentError.message ?? "Failed to create payment record");
      }

      // ── Step 9: Return response ───────────────────────────────────────────
      return NextResponse.json(
        {
          booking: {
            id: booking.id,
            booking_number: booking.booking_number,
          },
          razorpay: {
            order_id: razorpayOrder.id,
            amount: totalInPaise,
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          },
        },
        { status: 201 }
      );
    } catch (err) {
      // Release seats on any failure after reservation
      console.error("[POST /api/bookings] Error after seat reservation — releasing seats:", err);

      // Decrement booked_seats directly (no release_seats RPC exists)
      const { data: evtRaw } = await (supabase as any)
        .from("trek_events")
        .select("booked_seats")
        .eq("id", trek_event_id)
        .single();
      if (evtRaw) {
        const currentBooked = (evtRaw as { booked_seats: number }).booked_seats;
        await (supabase as any)
          .from("trek_events")
          .update({ booked_seats: Math.max(0, currentBooked - totalPersons) })
          .eq("id", trek_event_id);
      }

      // If booking was inserted, cancel it
      if (bookingId) {
        await (supabase as any)
          .from("bookings")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("id", bookingId);
      }

      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to create booking" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("[POST /api/bookings] Unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
