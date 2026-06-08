import { razorpay } from "@/lib/razorpay";
import { COMMISSION_RATE } from "@/lib/constants";
import {
  calculateRefund,
  DEFAULT_CANCELLATION_RULES,
} from "@/lib/cancellation";
import type { CancellationRule } from "@/lib/cancellation";
import type { BookingRepository } from "@/lib/repositories/booking.repository";
import type { TrekEventRepository } from "@/lib/repositories/trek-event.repository";
import type { PaymentRepository } from "@/lib/repositories/payment.repository";
import type { PickupPointRepository } from "@/lib/repositories/pickup-point.repository";

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateBookingInput {
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

export interface BookingListFilters {
  status?: string | null;
  trekEventId?: string | null;
  page: number;
  limit: number;
}

export interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class BookingService {
  constructor(
    private bookingRepo: BookingRepository,
    private eventRepo: TrekEventRepository,
    private paymentRepo: PaymentRepository,
    private pickupRepo: PickupPointRepository,
  ) {}

  /**
   * Full booking creation flow:
   * 1. Validate the user is a trekker
   * 2. Check event availability
   * 3. Calculate total (with pickup surcharge)
   * 4. Calculate platform fee and organizer amount
   * 5. Reserve seats atomically (RPC)
   * 6. Create booking record
   * 7. Create Razorpay order
   * 8. Create payment record
   * On any failure after seat reservation, release seats and cancel booking.
   */
  async createBooking(userId: string, data: CreateBookingInput) {
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
    } = data;

    // ── Validate inputs ──────────────────────────────────────────────────────
    if (!trek_event_id || !num_adults || num_adults < 1) {
      throw new Error("trek_event_id and at least 1 adult are required");
    }
    if (!booking_name || !booking_email || !booking_phone) {
      throw new Error(
        "booking_name, booking_email, and booking_phone are required",
      );
    }

    // ── Verify user is a trekker ─────────────────────────────────────────────
    const role = await this.bookingRepo.findProfileRole(userId);
    if (!role || role !== "trekker") {
      throw new Error("Only trekkers can create bookings");
    }

    // ── Step 1: Validate event exists and has seats ──────────────────────────
    const event = await this.eventRepo.findByIdBasic(trek_event_id);
    if (!event) {
      throw new Error("Trek event not found");
    }

    if (event.status !== "upcoming") {
      throw new Error("Trek event is no longer available for booking");
    }

    const availableSeats = event.total_seats - event.booked_seats;
    const totalPersons = num_adults + num_children;

    if (totalPersons > availableSeats) {
      throw new Error(`Only ${availableSeats} seat(s) available`);
    }

    // ── Step 2: Calculate total amount ────────────────────────────────────────
    const childPrice = event.child_price ?? event.price;
    let total = num_adults * event.price + num_children * childPrice;

    // Add pickup extra charge if applicable
    if (selected_pickup_id) {
      const extraCharge = await this.eventRepo.findPickupExtraCharge(
        selected_pickup_id,
        trek_event_id,
      );
      if (extraCharge) {
        total += extraCharge * totalPersons;
      }
    }

    // ── Step 3: Calculate fees ────────────────────────────────────────────────
    const platformFee = Math.round(COMMISSION_RATE * total * 100) / 100;
    const organizerAmount = Math.round((total - platformFee) * 100) / 100;

    // ── Step 4: Generate booking number ──────────────────────────────────────
    const bookingNumber = this.bookingRepo.generateBookingNumber();

    // ── Step 5: Reserve seats atomically via RPC ─────────────────────────────
    try {
      await this.eventRepo.bookSeats(trek_event_id, totalPersons);
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to reserve seats",
      );
    }

    // ── Steps 6-8: Insert booking, create Razorpay order, insert payment ────
    let bookingId: string | null = null;

    try {
      // Step 6: Insert booking record
      const booking = await this.bookingRepo.create({
        booking_number: bookingNumber,
        trek_event_id,
        trekker_id: userId,
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
      });

      bookingId = booking.id;

      // Step 7: Create Razorpay order
      const totalInPaise = Math.round(total * 100);
      const razorpayOrder = await razorpay.orders.create({
        amount: totalInPaise,
        currency: "INR",
        receipt: bookingNumber,
      });

      // Step 8: Insert payment record
      await this.paymentRepo.create({
        booking_id: booking.id,
        razorpay_order_id: razorpayOrder.id,
        amount: total,
        currency: "INR",
        status: "created",
      });

      // ── Return result ─────────────────────────────────────────────────────
      return {
        booking: {
          id: booking.id,
          booking_number: booking.booking_number,
        },
        razorpay: {
          order_id: razorpayOrder.id,
          amount: totalInPaise,
          key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        },
      };
    } catch (err) {
      // Release seats on any failure after reservation
      await this.eventRepo
        .releaseSeats(trek_event_id, totalPersons)
        .catch(() => {});

      // If booking was inserted, cancel it
      if (bookingId) {
        await this.bookingRepo.cancelBooking(bookingId).catch(() => {});
      }

      throw err;
    }
  }

  /**
   * Cancel a booking: check ownership, calculate refund, release seats,
   * update booking status, and initiate Razorpay refund if applicable.
   */
  async cancelBooking(
    userId: string,
    bookingId: string,
    reason?: string,
  ) {
    // ── Step 1: Fetch booking and verify ownership ───────────────────────────
    const booking = await this.bookingRepo.findByIdForCancel(bookingId);

    const isTrekker = booking.trekker_id === userId;
    const organizerProfileId =
      booking.trek_events?.treks?.organizers?.profile_id ?? null;
    const isOrganizer = organizerProfileId === userId;

    if (!isTrekker && !isOrganizer) {
      throw new Error("Forbidden");
    }

    if (booking.status === "cancelled") {
      throw new Error("Booking is already cancelled");
    }

    if (booking.status === "completed") {
      throw new Error("Cannot cancel a completed booking");
    }

    // ── Step 2: Calculate refund ─────────────────────────────────────────────
    const rules: CancellationRule[] =
      booking.trek_events?.treks?.cancellation_rules ??
      DEFAULT_CANCELLATION_RULES;
    const eventDate = booking.trek_events?.event_date ?? "";
    const reportingTime = (
      booking.trek_events?.reporting_time ?? "00:00"
    ).slice(0, 5);
    const {
      refundPercent,
      refundAmount,
      reason: refundReason,
    } = calculateRefund(rules, eventDate, reportingTime, Number(booking.total_amount));

    const cancellationNote = `${reason ? reason + " | " : ""}${refundReason}`;
    const totalPersons = booking.num_adults + booking.num_children;

    // ── Step 3: Cancel the booking ───────────────────────────────────────────
    const updatedBooking = await this.bookingRepo.updateStatus(bookingId, {
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: cancellationNote,
    });

    // ── Step 4: Release seats ────────────────────────────────────────────────
    await this.eventRepo
      .releaseSeats(booking.trek_event_id, totalPersons)
      .catch((err) => {
        console.error(
          "[BookingService.cancelBooking] Failed to release seats:",
          err?.message,
        );
      });

    // ── Step 5: Initiate Razorpay refund if applicable ───────────────────────
    if (refundAmount > 0) {
      const razorpayPaymentId =
        await this.paymentRepo.findCapturedPaymentId(bookingId);

      if (razorpayPaymentId) {
        try {
          await razorpay.payments.refund(razorpayPaymentId, {
            amount: refundAmount * 100, // paise
            notes: { booking_id: bookingId, reason: refundReason },
          });
        } catch (refundErr) {
          console.error(
            "[BookingService.cancelBooking] Razorpay refund failed:",
            refundErr,
          );
          // Non-fatal -- booking is already cancelled; refund can be retried
        }
      }
    }

    return {
      booking: updatedBooking,
      refundAmount,
      refundPercent,
      reason: refundReason,
    };
  }

  /**
   * List bookings for a trekker with pagination and status filtering.
   */
  async getTrekkerBookings(userId: string, filters: BookingListFilters) {
    return this.bookingRepo.findByTrekkerId(userId, filters);
  }

  /**
   * List bookings visible to an organizer with pagination and status filtering.
   */
  async getOrganizerBookings(
    organizerId: string,
    filters: BookingListFilters,
  ) {
    return this.bookingRepo.findByOrganizerId(organizerId, filters);
  }

  /**
   * Fetch a single booking detail by ID, with authorization check.
   * Returns the full booking row with joins.
   */
  async getBookingDetail(userId: string, bookingId: string) {
    const booking = await this.bookingRepo.findById(bookingId);

    // Authorization: owner trekker OR organizer of the trek
    const isTrekker = booking.trekker_id === userId;
    const organizerProfileId =
      booking.trek_events?.treks?.organizers?.profile_id ?? null;
    const isOrganizer = organizerProfileId === userId;

    if (!isTrekker && !isOrganizer) {
      throw new Error("Forbidden");
    }

    return booking;
  }
}
