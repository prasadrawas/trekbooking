/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TrekEvent, TrekEventInsert } from "@/types/database";

// ─── Types for query results ────────────────────────────────────────────────

export interface TrekEventWithPickups {
  id: string;
  event_date: string;
  end_date: string | null;
  reporting_time: string;
  price: number;
  child_price: number | null;
  total_seats: number;
  booked_seats: number;
  status: string;
  created_at: string;
  pickup_points: {
    id: string;
    label: string;
    address: string | null;
    pickup_time: string;
    maps_url: string | null;
  }[];
}

export interface TrekEventBasic {
  id: string;
  price: number;
  child_price: number | null;
  total_seats: number;
  booked_seats: number;
  status: string;
}

export class TrekEventRepository {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * List all events for a trek, ordered by event_date ascending.
   * Includes pickup_points join.
   */
  async findByTrekId(trekId: string): Promise<TrekEventWithPickups[]> {
    const { data, error } = await (this.client as any)
      .from("trek_events")
      .select(
        `
      id, event_date, end_date, reporting_time, price, child_price,
      total_seats, booked_seats, status, created_at,
      pickup_points(id, label, address, pickup_time, maps_url)
    `
      )
      .eq("trek_id", trekId)
      .order("event_date", { ascending: true });

    if (error) throw new Error(`TrekEventRepository.findByTrekId: ${error.message}`);
    return (data ?? []) as TrekEventWithPickups[];
  }

  /**
   * List upcoming (not past, not cancelled) events for a trek, ordered by
   * event_date ascending. Includes pickup_points join.
   */
  async findUpcoming(trekId: string): Promise<TrekEventWithPickups[]> {
    const now = new Date().toISOString();

    const { data, error } = await (this.client as any)
      .from("trek_events")
      .select(
        `
      id, event_date, end_date, reporting_time, price, child_price,
      total_seats, booked_seats, status, created_at,
      pickup_points(id, label, address, pickup_time, maps_url)
    `
      )
      .eq("trek_id", trekId)
      .in("status", ["upcoming", "full"])
      .gte("event_date", now)
      .order("event_date", { ascending: true });

    if (error) throw new Error(`TrekEventRepository.findUpcoming: ${error.message}`);
    return (data ?? []) as TrekEventWithPickups[];
  }

  /**
   * Fetch a single event by ID and trek ID, with pickup_points.
   */
  async findByIdAndTrekId(eventId: string, trekId: string): Promise<TrekEventWithPickups | null> {
    const { data, error } = await (this.client as any)
      .from("trek_events")
      .select(
        `
      id, event_date, end_date, reporting_time, price, child_price,
      total_seats, booked_seats, status, created_at,
      pickup_points(id, label, address, pickup_time, maps_url)
    `
      )
      .eq("id", eventId)
      .eq("trek_id", trekId)
      .single();

    if (error || !data) return null;
    return data as TrekEventWithPickups;
  }

  /**
   * Fetch a single event by ID with basic pricing and seat info.
   * Used during booking creation to validate availability.
   */
  async findByIdBasic(id: string): Promise<TrekEventBasic | null> {
    const { data, error } = await (this.client as any)
      .from("trek_events")
      .select("id, price, child_price, total_seats, booked_seats, status")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as TrekEventBasic;
  }

  /**
   * Create a single trek event. Returns the full inserted row.
   */
  async create(event: TrekEventInsert): Promise<TrekEvent> {
    const { data, error } = await (this.client as any)
      .from("trek_events")
      .insert(event)
      .select()
      .single();

    if (error) throw new Error(`TrekEventRepository.create: ${error.message}`);
    return data as TrekEvent;
  }

  /**
   * Create multiple trek events in a single insert (batch).
   * Returns the inserted rows.
   */
  async createBatch(events: TrekEventInsert[]): Promise<TrekEvent[]> {
    const { data, error } = await (this.client as any)
      .from("trek_events")
      .insert(events)
      .select();

    if (error) throw new Error(`TrekEventRepository.createBatch: ${error.message}`);
    return (data ?? []) as TrekEvent[];
  }

  /**
   * Update a trek event by ID and trek ID. Returns the full updated row.
   */
  async update(
    eventId: string,
    trekId: string,
    updates: Record<string, unknown>
  ): Promise<TrekEvent | null> {
    const { data, error } = await (this.client as any)
      .from("trek_events")
      .update(updates)
      .eq("id", eventId)
      .eq("trek_id", trekId)
      .select()
      .single();

    if (error) throw new Error(`TrekEventRepository.update: ${error.message}`);
    return (data ?? null) as TrekEvent | null;
  }

  /**
   * Cancel (soft-delete) an event by setting its status to "cancelled".
   */
  async delete(eventId: string, trekId: string): Promise<void> {
    const { error } = await (this.client as any)
      .from("trek_events")
      .update({ status: "cancelled" })
      .eq("id", eventId)
      .eq("trek_id", trekId);

    if (error) throw new Error(`TrekEventRepository.delete: ${error.message}`);
  }

  /**
   * Atomically reserve seats for an event via the book_seats RPC.
   * Throws on failure (e.g. insufficient seats).
   */
  async bookSeats(eventId: string, numPersons: number): Promise<void> {
    const { error } = await (this.client as any).rpc("book_seats", {
      p_event_id: eventId,
      p_num_persons: numPersons,
    });

    if (error) throw new Error(`TrekEventRepository.bookSeats: ${error.message}`);
  }

  /**
   * Atomically release previously reserved seats via the release_seats RPC.
   * Throws on failure.
   */
  async releaseSeats(eventId: string, numPersons: number): Promise<void> {
    const { error } = await (this.client as any).rpc("release_seats", {
      p_event_id: eventId,
      p_num_persons: numPersons,
    });

    if (error) throw new Error(`TrekEventRepository.releaseSeats: ${error.message}`);
  }

  /**
   * Find past events that are still marked as "upcoming" or "full"
   * (i.e. their event_date is before today). Used by the auto-complete
   * routine. Limited to 500 rows per run.
   */
  async findPastIncompleteEvents(today: string): Promise<{ id: string }[]> {
    const { data } = await (this.client as any)
      .from("trek_events")
      .select("id")
      .lt("event_date", today)
      .in("status", ["upcoming", "full"])
      .limit(500);

    return (data ?? []) as { id: string }[];
  }

  /**
   * Bulk-mark past events as "completed". Used by the auto-complete routine.
   */
  async completeEvents(eventIds: string[]): Promise<void> {
    const { error } = await (this.client as any)
      .from("trek_events")
      .update({ status: "completed" })
      .in("id", eventIds)
      .in("status", ["upcoming", "full"]);

    if (error) throw new Error(`TrekEventRepository.completeEvents: ${error.message}`);
  }

  /**
   * Look up the extra charge for a pickup point by its ID and event ID.
   * Returns the extra_charge value or null if not found.
   */
  async findPickupExtraCharge(pickupId: string, eventId: string): Promise<number | null> {
    const { data } = await (this.client as any)
      .from("pickup_points")
      .select("extra_charge")
      .eq("id", pickupId)
      .eq("trek_event_id", eventId)
      .single();

    if (!data) return null;
    return (data as { extra_charge: number }).extra_charge;
  }
}
