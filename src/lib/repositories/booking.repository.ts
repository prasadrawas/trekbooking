/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Booking, BookingInsert } from "@/types/database";

// ─── Types for query results ────────────────────────────────────────────────

export interface BookingListItem {
  id: string;
  booking_number: string;
  status: string;
  num_adults: number;
  num_children: number;
  total_amount: number;
  platform_fee: number;
  organizer_amount: number;
  booking_name: string;
  booking_email: string;
  booking_phone: string;
  created_at: string;
  cancelled_at: string | null;
  trek_event_id: string;
  trek_events: {
    event_date: string;
    reporting_time: string;
    price: number;
    child_price: number | null;
    treks: {
      title: string;
      slug: string;
    } | null;
  } | null;
}

export interface BookingDetailRow {
  id: string;
  booking_number: string;
  status: string;
  num_adults: number;
  num_children: number;
  total_amount: number;
  platform_fee: number;
  organizer_amount: number;
  booking_name: string;
  booking_email: string;
  booking_phone: string;
  emergency_contact: string | null;
  special_requests: string | null;
  selected_pickup_id: string | null;
  created_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  trekker_id: string;
  trek_event_id: string;
  payments: {
    id: string;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    amount: number;
    currency: string;
    status: string;
    method: string | null;
    paid_at: string | null;
  }[];
  trek_events: {
    id: string;
    event_date: string;
    reporting_time: string;
    price: number;
    child_price: number | null;
    treks: {
      id: string;
      title: string;
      slug: string;
      organizer_id: string;
      organizers: {
        id: string;
        org_name: string;
        profile_id: string;
      } | null;
    } | null;
  } | null;
  pickup_points: {
    id: string;
    label: string;
    pickup_time: string;
    address: string | null;
    maps_url: string | null;
    extra_charge: number;
  } | null;
}

export interface BookingForCancel {
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
      cancellation_rules: any[] | null;
      organizers: { profile_id: string } | null;
    } | null;
  } | null;
}

export interface BookingForWebhook {
  id: string;
  trek_event_id: string;
  num_adults: number;
  num_children: number;
  status: string;
}

export class BookingRepository {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Generate a unique booking number in the format SB-YYYYMMDD-XXXX
   * where XXXX is a random alphanumeric suffix.
   */
  generateBookingNumber(): string {
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

  /**
   * Fetch a single booking by ID with full joins: payments, trek_events
   * (with treks and organizers), and pickup_points.
   */
  async findById(id: string): Promise<BookingDetailRow> {
    const { data, error } = await (this.client as any)
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

    if (error) throw new Error(`BookingRepository.findById: ${error.message}`);
    return data as BookingDetailRow;
  }

  /**
   * Fetch a booking by ID with cancellation-related joins (event date,
   * reporting time, cancellation rules, organizer profile_id).
   */
  async findByIdForCancel(id: string): Promise<BookingForCancel> {
    const { data, error } = await (this.client as any)
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

    if (error) throw new Error(`BookingRepository.findByIdForCancel: ${error.message}`);
    return data as BookingForCancel;
  }

  /**
   * Fetch a booking by ID with minimal fields needed for webhook processing
   * (seat release on payment failure / refund).
   */
  async findByIdForWebhook(id: string): Promise<BookingForWebhook | null> {
    const { data, error } = await (this.client as any)
      .from("bookings")
      .select("id, trek_event_id, num_adults, num_children, status")
      .eq("id", id)
      .single();

    if (error) return null;
    return data as BookingForWebhook;
  }

  /**
   * List bookings for a trekker with pagination. Supports status filtering
   * (upcoming, past, cancelled) and trek_event_id filtering.
   * Returns { data, count }.
   */
  async findByTrekkerId(
    trekkerId: string,
    options: {
      status?: string | null;
      trekEventId?: string | null;
      page: number;
      limit: number;
    }
  ): Promise<{ data: BookingListItem[]; count: number }> {
    const { status, trekEventId, page, limit } = options;
    const offset = (page - 1) * limit;

    let query = (this.client as any)
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
      .eq("trekker_id", trekkerId)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (status === "upcoming") {
      query = query.in("status", ["pending", "confirmed"]);
    } else if (status === "past") {
      query = query.in("status", ["completed"]);
    } else if (status === "cancelled") {
      query = query.in("status", ["cancelled", "refunded"]);
    }

    if (trekEventId) {
      query = query.eq("trek_event_id", trekEventId);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`BookingRepository.findByTrekkerId: ${error.message}`);
    return { data: (data ?? []) as BookingListItem[], count: count ?? 0 };
  }

  /**
   * List bookings visible to an organizer (filtered by their treks).
   * Supports status and trek_event_id filtering with pagination.
   * Returns { data, count }.
   */
  async findByOrganizerId(
    organizerId: string,
    options: {
      status?: string | null;
      trekEventId?: string | null;
      page: number;
      limit: number;
    }
  ): Promise<{ data: BookingListItem[]; count: number }> {
    const { status, trekEventId, page, limit } = options;
    const offset = (page - 1) * limit;

    let query = (this.client as any)
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
      .eq("trek_events.treks.organizer_id", organizerId)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (status === "upcoming") {
      query = query.in("status", ["pending", "confirmed"]);
    } else if (status === "past") {
      query = query.in("status", ["completed"]);
    } else if (status === "cancelled") {
      query = query.in("status", ["cancelled", "refunded"]);
    }

    if (trekEventId) {
      query = query.eq("trek_event_id", trekEventId);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`BookingRepository.findByOrganizerId: ${error.message}`);
    return { data: (data ?? []) as BookingListItem[], count: count ?? 0 };
  }

  /**
   * Look up the organizer record ID for a user's profile_id.
   * Returns the organizer id or null if not found.
   */
  async findOrganizerByProfileId(profileId: string): Promise<{ id: string } | null> {
    const { data, error } = await (this.client as any)
      .from("organizers")
      .select("id")
      .eq("profile_id", profileId)
      .single();

    if (error || !data) return null;
    return data as { id: string };
  }

  /**
   * Look up a user's profile role.
   */
  async findProfileRole(userId: string): Promise<string | null> {
    const { data, error } = await (this.client as any)
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !data) return null;
    return (data as { role: string }).role;
  }

  /**
   * Create a new booking record. Returns the inserted row's id and booking_number.
   */
  async create(
    booking: BookingInsert
  ): Promise<{ id: string; booking_number: string }> {
    const { data, error } = await (this.client as any)
      .from("bookings")
      .insert(booking)
      .select("id, booking_number")
      .single();

    if (error) throw new Error(`BookingRepository.create: ${error.message}`);
    return data as { id: string; booking_number: string };
  }

  /**
   * Update the status (and optional fields) of a booking by ID.
   * Returns the full updated row.
   */
  async updateStatus(
    id: string,
    updates: {
      status: string;
      cancelled_at?: string;
      cancellation_reason?: string;
    }
  ): Promise<Booking> {
    const { data, error } = await (this.client as any)
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`BookingRepository.updateStatus: ${error.message}`);
    return data as Booking;
  }

  /**
   * Update booking status with an additional eq guard (e.g. only update if
   * current status is "pending"). Used by payment verification and webhooks.
   */
  async updateStatusWhere(
    id: string,
    currentStatus: string,
    newStatus: string
  ): Promise<void> {
    const { error } = await (this.client as any)
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("status", currentStatus);

    if (error) throw new Error(`BookingRepository.updateStatusWhere: ${error.message}`);
  }

  /**
   * Cancel a booking by updating status and setting cancelled_at timestamp.
   * Used by webhook handlers for payment failure / refund scenarios.
   */
  async cancelBooking(id: string): Promise<void> {
    const { error } = await (this.client as any)
      .from("bookings")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(`BookingRepository.cancelBooking: ${error.message}`);
  }

  /**
   * Mark a booking as refunded with a cancelled_at timestamp.
   */
  async markRefunded(id: string): Promise<void> {
    const { error } = await (this.client as any)
      .from("bookings")
      .update({ status: "refunded", cancelled_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(`BookingRepository.markRefunded: ${error.message}`);
  }

  /**
   * Bulk-update confirmed bookings for completed past events to "completed".
   */
  async completeBookingsForEvents(eventIds: string[]): Promise<void> {
    const { error } = await (this.client as any)
      .from("bookings")
      .update({ status: "completed" })
      .in("trek_event_id", eventIds)
      .eq("status", "confirmed");

    if (error) throw new Error(`BookingRepository.completeBookingsForEvents: ${error.message}`);
  }
}
