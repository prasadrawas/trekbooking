"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { razorpay } from "@/lib/razorpay";
import { COMMISSION_RATE } from "@/lib/constants";
import { calculateRefund, DEFAULT_CANCELLATION_RULES } from "@/lib/cancellation";
import type { CancellationRule } from "@/lib/cancellation";
import type { BookingDetail } from "@/types/database";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return { supabase, user };
}

/** Generate a human-readable booking number: SB-YYYYMMDD-XXXX */
function generateBookingNumber(): string {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SB-${datePart}-${rand}`;
}

// ─── createBooking ────────────────────────────────────────────────────────────

export interface CreateBookingData {
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

export interface CreateBookingResult {
  bookingId: string;
  bookingNumber: string;
  razorpayOrderId: string;
  amount: number; // in paise
}

interface EventRow {
  id: string;
  trek_id: string;
  event_date: string;
  end_date: string;
  price: number;
  total_seats: number;
  booked_seats: number;
  status: string;
  pickup_points: Array<{ id: string; maps_url: string | null }>;
}

export async function createBooking(
  data: CreateBookingData,
): Promise<({ success: true } & CreateBookingResult) | { error: string }> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    if (!data.trek_event_id) return { error: "Event is required." };
    if (!data.num_adults || data.num_adults < 1) return { error: "At least one adult is required." };
    if (!data.booking_name?.trim()) return { error: "Booking name is required." };
    if (!data.booking_email?.trim()) return { error: "Booking email is required." };
    if (!data.booking_phone?.trim()) return { error: "Booking phone is required." };

    // Fetch event details
    const { data: eventRaw, error: eventError } = await (supabase as any)
      .from("trek_events")
      .select(
        `id, trek_id, event_date, end_date, price,
        total_seats, booked_seats, status,
        pickup_points(id, maps_url)`,
      )
      .eq("id", data.trek_event_id)
      .single();

    if (eventError || !eventRaw) return { error: "Event not found." };
    const event = eventRaw as EventRow;

    if (event.status !== "upcoming") return { error: "This event is not available for booking." };

    const numChildren = data.num_children ?? 0;
    const totalPersons = data.num_adults + numChildren;
    const availableSeats = event.total_seats - event.booked_seats;

    if (totalPersons > availableSeats) {
      return { error: `Only ${availableSeats} seat(s) remaining for this event.` };
    }

    // pickup_points schema doesn't have extra_charge column — treat as 0
    const pickupExtraCharge = 0;

    // Calculate amounts (in rupees)
    const adultAmount = data.num_adults * event.price;
    const childAmount = numChildren * Math.round(event.price * 0.5);
    const pickupAmount = pickupExtraCharge * totalPersons;
    const totalAmountRupees = adultAmount + childAmount + pickupAmount;
    // Platform fee is tracked internally — not charged separately to customer
    void Math.round(totalAmountRupees * COMMISSION_RATE);

    const bookingNumber = generateBookingNumber();

    // Atomically reserve seats via RPC
    const { error: rpcError } = await (supabase as any).rpc("book_seats", {
      p_event_id: data.trek_event_id,
      p_num_persons: totalPersons,
    });

    if (rpcError) {
      if ((rpcError.message as string).includes("not enough")) {
        return { error: "Not enough seats available. Please try again." };
      }
      return { error: rpcError.message };
    }

    // Insert booking record
    const platformFee = Math.round(totalAmountRupees * COMMISSION_RATE * 100) / 100;
    const organizerAmount = totalAmountRupees - platformFee;

    const { data: bookingRaw, error: bookingError } = await (supabase as any)
      .from("bookings")
      .insert({
        booking_number: bookingNumber,
        trekker_id: user.id,
        trek_event_id: data.trek_event_id,
        num_adults: data.num_adults,
        num_children: data.num_children,
        selected_pickup_id: data.selected_pickup_id ?? null,
        total_amount: totalAmountRupees,
        platform_fee: platformFee,
        organizer_amount: organizerAmount,
        status: "pending",
        booking_name: data.booking_name.trim(),
        booking_phone: data.booking_phone.trim(),
        booking_email: data.booking_email.trim(),
        emergency_contact: data.emergency_contact?.trim() || null,
        special_requests: data.special_requests?.trim() || null,
      })
      .select("id")
      .single();

    if (bookingError) {
      // Release reserved seats on failure via direct update
      const { data: eventCurrent } = await (supabase as any)
        .from("trek_events")
        .select("booked_seats")
        .eq("id", data.trek_event_id)
        .single();
      if (eventCurrent) {
        const newCount = Math.max(0, (eventCurrent as { booked_seats: number }).booked_seats - totalPersons);
        await (supabase as any)
          .from("trek_events")
          .update({ booked_seats: newCount })
          .eq("id", data.trek_event_id);
      }
      return { error: bookingError.message };
    }

    const booking = bookingRaw as { id: string };

    // Create Razorpay order (amount in paise)
    const amountPaise = totalAmountRupees * 100;
    let razorpayOrder: { id: string };
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: bookingNumber,
        notes: {
          booking_id: booking.id,
          booking_number: bookingNumber,
          user_id: user.id,
        },
      });
    } catch (rpErr) {
      await (supabase as any)
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", booking.id);
      // Release reserved seats via direct update
      const { data: eventCurrent } = await (supabase as any)
        .from("trek_events")
        .select("booked_seats")
        .eq("id", data.trek_event_id)
        .single();
      if (eventCurrent) {
        const newCount = Math.max(0, (eventCurrent as { booked_seats: number }).booked_seats - totalPersons);
        await (supabase as any)
          .from("trek_events")
          .update({ booked_seats: newCount })
          .eq("id", data.trek_event_id);
      }
      return { error: rpErr instanceof Error ? rpErr.message : "Failed to create payment order." };
    }

    // Insert payment record
    const { error: paymentError } = await (supabase as any).from("payments").insert({
      booking_id: booking.id,
      razorpay_order_id: razorpayOrder.id,
      amount: totalAmountRupees,
      currency: "INR",
      status: "pending",
    });

    if (paymentError) {
      return { error: paymentError.message };
    }

    return {
      success: true,
      bookingId: booking.id,
      bookingNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: amountPaise,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create booking." };
  }
}

// ─── verifyPayment ────────────────────────────────────────────────────────────

export interface VerifyPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function verifyPayment(
  data: VerifyPaymentData,
): Promise<{ success: true; bookingId: string } | { error: string }> {
  try {
    const { supabase } = await getAuthenticatedUser();

    // Verify Razorpay signature
    const body = `${data.razorpay_order_id}|${data.razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== data.razorpay_signature) {
      return { error: "Invalid payment signature. Payment verification failed." };
    }

    // Find the payment record
    const { data: paymentRaw, error: paymentFetchError } = await (supabase as any)
      .from("payments")
      .select("id, booking_id, status")
      .eq("razorpay_order_id", data.razorpay_order_id)
      .single();

    if (paymentFetchError || !paymentRaw) return { error: "Payment record not found." };
    const payment = paymentRaw as { id: string; booking_id: string; status: string };

    if (payment.status === "captured") {
      // Idempotent — already confirmed
      return { success: true, bookingId: payment.booking_id };
    }

    // Update payment record
    const { error: paymentUpdateError } = await (supabase as any)
      .from("payments")
      .update({
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
        status: "captured",
        paid_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (paymentUpdateError) return { error: paymentUpdateError.message };

    // Confirm booking
    const { error: bookingUpdateError } = await (supabase as any)
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", payment.booking_id);

    if (bookingUpdateError) return { error: bookingUpdateError.message };

    // TODO: send confirmation email via Resend

    return { success: true, bookingId: payment.booking_id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Payment verification failed." };
  }
}

// ─── cancelBooking ────────────────────────────────────────────────────────────

export async function cancelBooking(
  bookingId: string,
  reason: string,
): Promise<{ success: true; refundAmount: number; refundPercent: number; reason: string } | { error: string }> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    // Fetch booking with event and trek cancellation_rules
    const { data: bookingRaw, error: fetchError } = await (supabase as any)
      .from("bookings")
      .select(
        `id, trekker_id, trek_event_id, num_adults, num_children, status, total_amount,
        trek_events!inner(
          event_date,
          reporting_time,
          treks!inner(
            cancellation_rules,
            organizers!inner(profile_id)
          )
        )`
      )
      .eq("id", bookingId)
      .single();

    if (fetchError || !bookingRaw) return { error: "Booking not found." };

    const booking = bookingRaw as {
      id: string;
      trekker_id: string;
      trek_event_id: string;
      num_adults: number;
      num_children: number;
      status: string;
      total_amount: number;
      trek_events: {
        event_date: string;
        reporting_time: string;
        treks: {
          cancellation_rules: CancellationRule[] | null;
          organizers: { profile_id: string } | null;
        };
      };
    };

    if (booking.trekker_id !== user.id) {
      const orgProfileId = booking.trek_events?.treks?.organizers?.profile_id ?? null;
      if (orgProfileId !== user.id) return { error: "Access denied." };
    }

    if (booking.status === "cancelled") return { error: "Booking is already cancelled." };
    if (booking.status === "completed") return { error: "Cannot cancel a completed booking." };

    // Determine cancellation rules and compute refund
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

    const cancellationNote = `${reason ? reason + " | " : ""}${refundReason}`;

    // Cancel booking with full metadata
    const { error: cancelError } = await (supabase as any)
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellationNote,
      })
      .eq("id", bookingId);

    if (cancelError) return { error: cancelError.message };

    // Release seats via direct update
    if (booking.status === "confirmed" || booking.status === "pending") {
      const totalPersons = booking.num_adults + (booking.num_children ?? 0);
      const { data: eventCurrent } = await (supabase as any)
        .from("trek_events")
        .select("booked_seats")
        .eq("id", booking.trek_event_id)
        .single();
      if (eventCurrent) {
        const newCount = Math.max(0, (eventCurrent as { booked_seats: number }).booked_seats - totalPersons);
        await (supabase as any)
          .from("trek_events")
          .update({ booked_seats: newCount })
          .eq("id", booking.trek_event_id);
      }
    }

    // Initiate Razorpay refund if applicable
    if (refundAmount > 0) {
      const { data: paymentData } = await (supabase as any)
        .from("payments")
        .select("razorpay_payment_id")
        .eq("booking_id", bookingId)
        .eq("status", "captured")
        .single();

      if (paymentData?.razorpay_payment_id) {
        try {
          await razorpay.payments.refund(paymentData.razorpay_payment_id, {
            amount: refundAmount * 100, // paise
            notes: { booking_id: bookingId, reason: refundReason },
          });
        } catch (refundErr) {
          // Log but don't block — booking is already cancelled; refund can be retried
          console.error("[cancelBooking] Razorpay refund failed:", refundErr);
        }
      }
    }

    return { success: true, refundAmount, refundPercent, reason: refundReason };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to cancel booking." };
  }
}

// ─── getBookingById ───────────────────────────────────────────────────────────

export async function getBookingById(bookingId: string): Promise<{
  data: BookingDetail | null;
  error?: string;
}> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { data, error } = await (supabase as any)
      .from("bookings")
      .select(
        `
        *,
        payment:payments(*),
        trek_event:trek_events(
          *,
          trek:treks(
            id, title, slug, description, difficulty, duration_days, region, meeting_point,
            trek_images(id, image_url, is_cover, sort_order),
            organizer:organizers(id, org_name, logo_url, phone)
          ),
          pickup_points(*)
        )
        `,
      )
      .eq("id", bookingId)
      .eq("trekker_id", user.id)
      .single();

    if (error || !data) return { data: null, error: "Booking not found." };
    return { data: data as unknown as BookingDetail };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch booking.",
    };
  }
}

// ─── getTrekkerBookings ───────────────────────────────────────────────────────

export interface TrekkerBookingItem {
  id: string;
  num_adults: number;
  num_children: number;
  total_amount: number;
  status: string;
  created_at: string;
  trek_event: {
    event_date: string;
    trek: { title: string; slug: string; cover_image: string | null };
  };
}

export async function getTrekkerBookings(status?: string): Promise<{
  data: TrekkerBookingItem[];
  error?: string;
}> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    let query = (supabase as any)
      .from("bookings")
      .select(
        `
        id, num_adults, num_children, total_amount, status, created_at,
        trek_events(
          event_date,
          treks(title, slug, trek_images(image_url, is_cover))
        )
        `,
      )
      .eq("trekker_id", user.id)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };

    const result: TrekkerBookingItem[] = ((data as any[]) ?? []).map((b: any) => {
      const event = Array.isArray(b.trek_events) ? b.trek_events[0] : b.trek_events;
      const trek = event
        ? Array.isArray(event.treks) ? event.treks[0] : event.treks
        : null;
      const images: Array<{ image_url: string; is_cover: boolean }> = trek?.trek_images ?? [];
      const coverImage = images.find((img) => img.is_cover)?.image_url ?? images[0]?.image_url ?? null;

      return {
        id: b.id,
        num_adults: b.num_adults,
        num_children: b.num_children,
        total_amount: b.total_amount,
        status: b.status,
        created_at: b.created_at,
        trek_event: {
          event_date: event?.event_date ?? "",
          trek: {
            title: trek?.title ?? "",
            slug: trek?.slug ?? "",
            cover_image: coverImage,
          },
        },
      };
    });

    return { data: result };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch bookings.",
    };
  }
}

// ─── getOrganizerBookings ─────────────────────────────────────────────────────

export interface OrganizerBookingFilters {
  trekId?: string;
  status?: string;
  page?: number;
}

export interface OrganizerBookingItem {
  id: string;
  num_adults: number;
  num_children: number;
  total_amount: number;
  status: string;
  created_at: string;
  booking_name: string;
  trek_title: string;
  event_date: string;
}

export async function getOrganizerBookings(
  filters?: OrganizerBookingFilters,
): Promise<{
  data: OrganizerBookingItem[];
  total: number;
  error?: string;
}> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    // Get organizer record
    const { data: organizerRaw, error: orgError } = await (supabase as any)
      .from("organizers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (orgError || !organizerRaw) return { data: [], total: 0, error: "Organizer profile not found." };
    const organizer = organizerRaw as { id: string };

    const page = filters?.page ?? 1;
    const limit = 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = (supabase as any)
      .from("bookings")
      .select(
        `
        id, num_adults, num_children, total_amount, status, created_at,
        booking_name,
        trek_events!inner(
          event_date,
          treks!inner(id, title, organizer_id)
        )
        `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters?.trekId) {
      query = query.eq("trek_events.treks.id", filters.trekId);
    }

    if (filters?.status) query = query.eq("status", filters.status);

    const { data, error, count } = await query;
    if (error) return { data: [], total: 0, error: error.message };

    // Post-filter to only this organizer's bookings
    const filtered = ((data as any[]) ?? []).filter((b: any) => {
      const events = Array.isArray(b.trek_events) ? b.trek_events : [b.trek_events];
      return events.some((e: any) => {
        if (!e) return false;
        const treks = Array.isArray(e.treks) ? e.treks : [e.treks];
        return treks.some((t: any) => t?.organizer_id === organizer.id);
      });
    });

    const result: OrganizerBookingItem[] = filtered.map((b: any) => {
      const event = Array.isArray(b.trek_events) ? b.trek_events[0] : b.trek_events;
      const trek = event
        ? Array.isArray(event.treks) ? event.treks[0] : event.treks
        : null;

      return {
        id: b.id,
        num_adults: b.num_adults,
        num_children: b.num_children,
        total_amount: b.total_amount,
        status: b.status,
        created_at: b.created_at,
        booking_name: b.booking_name ?? "N/A",
        trek_title: trek?.title ?? "",
        event_date: event?.event_date ?? "",
      };
    });

    return { data: result, total: count ?? 0 };
  } catch (err) {
    return {
      data: [],
      total: 0,
      error: err instanceof Error ? err.message : "Failed to fetch bookings.",
    };
  }
}
