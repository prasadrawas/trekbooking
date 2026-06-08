/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Encapsulates all Supabase queries for the `pickup_points` table.
 */
export class PickupPointRepository {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * List all pickup points for a trek event, ordered by sort_order.
   */
  async findByEventId(eventId: string) {
    const { data, error } = await (this.client as any)
      .from("pickup_points")
      .select("id, label, address, pickup_time, maps_url, extra_charge, sort_order")
      .eq("trek_event_id", eventId)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(`PickupPointRepository.findByEventId: ${error.message}`);
    return data ?? [];
  }

  /**
   * Create a new pickup point for an event. Returns the full inserted row.
   */
  async create(values: {
    trek_event_id: string;
    label: string;
    address?: string | null;
    pickup_time: string;
    maps_url?: string | null;
    extra_charge?: number;
    sort_order?: number;
  }) {
    const { data, error } = await (this.client as any)
      .from("pickup_points")
      .insert({
        trek_event_id: values.trek_event_id,
        label: values.label,
        address: values.address ?? null,
        pickup_time: values.pickup_time,
        maps_url: values.maps_url ?? null,
        extra_charge: values.extra_charge ?? 0,
        sort_order: values.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) throw new Error(`PickupPointRepository.create: ${error.message}`);
    return data;
  }

  /**
   * Update a pickup point by ID, scoped to the owning event.
   * Returns the full updated row.
   */
  async update(pointId: string, eventId: string, updates: Record<string, unknown>) {
    const { data, error } = await (this.client as any)
      .from("pickup_points")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", pointId)
      .eq("trek_event_id", eventId)
      .select()
      .single();

    if (error) throw new Error(`PickupPointRepository.update: ${error.message}`);
    return data;
  }

  /**
   * Delete a pickup point by ID, scoped to the owning event.
   */
  async delete(pointId: string, eventId: string) {
    const { error } = await (this.client as any)
      .from("pickup_points")
      .delete()
      .eq("id", pointId)
      .eq("trek_event_id", eventId);

    if (error) throw new Error(`PickupPointRepository.delete: ${error.message}`);
  }

  /**
   * Verify a pickup point exists and belongs to a specific event.
   * Returns { id } or null.
   */
  async findById(pointId: string, eventId: string) {
    const { data, error } = await (this.client as any)
      .from("pickup_points")
      .select("id")
      .eq("id", pointId)
      .eq("trek_event_id", eventId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`PickupPointRepository.findById: ${error.message}`);
    }
    return data;
  }

  /**
   * Verify an event exists and belongs to a specific trek.
   * Returns { id } or null.
   */
  async findEventById(eventId: string, trekId: string) {
    const { data, error } = await (this.client as any)
      .from("trek_events")
      .select("id")
      .eq("id", eventId)
      .eq("trek_id", trekId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`PickupPointRepository.findEventById: ${error.message}`);
    }
    return data;
  }

  /**
   * Verify trek ownership by slug and user profile ID.
   * Returns { id, organizer_id } or null.
   */
  async verifyTrekOwnership(slug: string, userId: string) {
    const { data, error } = await (this.client as any)
      .from("treks")
      .select("id, organizer_id, organizers!inner(profile_id)")
      .eq("slug", slug)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`PickupPointRepository.verifyTrekOwnership: ${error.message}`);
    }
    if (!data || data.organizers?.profile_id !== userId) return null;
    return data;
  }

  /**
   * Resolve a trek by slug, returning only its ID.
   */
  async findTrekIdBySlug(slug: string) {
    const { data, error } = await (this.client as any)
      .from("treks")
      .select("id")
      .eq("slug", slug)
      .single();

    if (error) throw new Error(`PickupPointRepository.findTrekIdBySlug: ${error.message}`);
    return data;
  }
}
