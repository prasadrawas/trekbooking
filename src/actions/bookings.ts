"use server";

import { requireAuth } from "@/lib/auth";
import { createBookingService, createPaymentService } from "@/lib/services";
import { BookingRepository } from "@/lib/repositories";
import type { BookingDetail } from "@/types/database";

// ─── Types (re-exported for consumers) ──────────────────────────────────────

export type { CreateBookingInput as CreateBookingData } from "@/lib/services/booking.service";
export type { VerifyPaymentInput as VerifyPaymentData } from "@/lib/services/booking.service";

export interface CreateBookingResult {
  bookingId: string;
  bookingNumber: string;
  razorpayOrderId: string;
  amount: number; // in paise
}

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

// ─── createBooking ────────────────────────────────────────────────────────────

export async function createBooking(
  data: {
    trek_event_id: string;
    num_adults: number;
    num_children?: number;
    booking_name: string;
    booking_email: string;
    booking_phone: string;
    emergency_contact?: string;
    special_requests?: string;
    selected_pickup_id?: string;
  },
): Promise<({ success: true } & CreateBookingResult) | { error: string }> {
  try {
    const { supabase, user } = await requireAuth();
    const service = createBookingService(supabase);
    const result = await service.createBooking(user.id, data);

    return {
      success: true,
      bookingId: result.booking.id,
      bookingNumber: result.booking.booking_number,
      razorpayOrderId: result.razorpay.order_id,
      amount: result.razorpay.amount,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create booking." };
  }
}

// ─── verifyPayment ────────────────────────────────────────────────────────────

export async function verifyPayment(
  data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  },
): Promise<{ success: true; bookingId: string } | { error: string }> {
  try {
    const { supabase } = await requireAuth();
    const service = createPaymentService(supabase);
    const result = await service.verifyPaymentSignature(
      data.razorpay_order_id,
      data.razorpay_payment_id,
      data.razorpay_signature,
    );

    return { success: true, bookingId: result.booking_id };
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
    const { supabase, user } = await requireAuth();
    const service = createBookingService(supabase);
    const result = await service.cancelBooking(user.id, bookingId, reason);

    return {
      success: true,
      refundAmount: result.refundAmount,
      refundPercent: result.refundPercent,
      reason: result.reason,
    };
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
    const { supabase, user } = await requireAuth();
    const service = createBookingService(supabase);
    const booking = await service.getBookingDetail(user.id, bookingId);
    return { data: booking as unknown as BookingDetail };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch booking.",
    };
  }
}

// ─── getTrekkerBookings ───────────────────────────────────────────────────────

export async function getTrekkerBookings(status?: string): Promise<{
  data: TrekkerBookingItem[];
  error?: string;
}> {
  try {
    const { supabase, user } = await requireAuth();
    const service = createBookingService(supabase);
    const result = await service.getTrekkerBookings(user.id, {
      status: status ?? null,
      trekEventId: null,
      page: 1,
      limit: 100,
    });

    // Transform to expected shape
    const data: TrekkerBookingItem[] = result.data.map((b) => {
      const event = b.trek_events;
      const trek = event?.treks;
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
            cover_image: null,
          },
        },
      };
    });

    return { data };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch bookings.",
    };
  }
}

// ─── getOrganizerBookings ─────────────────────────────────────────────────────

export async function getOrganizerBookings(
  filters?: OrganizerBookingFilters,
): Promise<{
  data: OrganizerBookingItem[];
  total: number;
  error?: string;
}> {
  try {
    const { supabase, user } = await requireAuth();
    const bookingRepo = new BookingRepository(supabase);

    // Get organizer record
    const organizer = await bookingRepo.findOrganizerByProfileId(user.id);
    if (!organizer) return { data: [], total: 0, error: "Organizer profile not found." };

    const service = createBookingService(supabase);
    const result = await service.getOrganizerBookings(organizer.id, {
      status: filters?.status ?? null,
      trekEventId: filters?.trekId ?? null,
      page: filters?.page ?? 1,
      limit: 20,
    });

    const data: OrganizerBookingItem[] = result.data.map((b) => {
      const event = b.trek_events;
      const trek = event?.treks;
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

    return { data, total: result.count };
  } catch (err) {
    return {
      data: [],
      total: 0,
      error: err instanceof Error ? err.message : "Failed to fetch bookings.",
    };
  }
}
