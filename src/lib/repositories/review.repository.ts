/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Encapsulates all Supabase queries for the `reviews` table.
 */
export class ReviewRepository {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * List reviews for a trek by trek ID (public, with reviewer profile info).
   */
  async findByTrekId(trekId: string) {
    const { data, error } = await (this.client as any)
      .from("reviews")
      .select(`
      id, rating, comment, created_at,
      profiles(id, full_name, avatar_url)
    `)
      .eq("trek_id", trekId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`ReviewRepository.findByTrekId: ${error.message}`);
    return data ?? [];
  }

  /**
   * List reviews for a set of trek IDs with booking/trek info (for organizer reviews page).
   * Paginated via offset and limit.
   */
  async findByTrekIds(trekIds: string[], { offset, limit }: { offset: number; limit: number }) {
    const { data, error } = await (this.client as any)
      .from("reviews")
      .select(
        "id, rating, comment, created_at, bookings(booking_name, trek_events(treks(title)))",
      )
      .in("trek_id", trekIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`ReviewRepository.findByTrekIds: ${error.message}`);
    return data ?? [];
  }

  /**
   * Check if a review already exists for a given booking.
   */
  async findByBookingId(bookingId: string) {
    const { data, error } = await (this.client as any)
      .from("reviews")
      .select("id")
      .eq("booking_id", bookingId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`ReviewRepository.findByBookingId: ${error.message}`);
    }
    return data;
  }

  /**
   * List all reviews by a trekker (with nested booking/trek info).
   */
  async findByTrekkerId(trekkerId: string) {
    const { data, error } = await (this.client as any)
      .from("reviews")
      .select(`
        id,
        rating,
        comment,
        created_at,
        booking_id,
        trek_id,
        bookings (
          id,
          trek_events (
            id,
            event_date,
            treks (
              id,
              title,
              slug
            )
          )
        )
      `)
      .eq("trekker_id", trekkerId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(`ReviewRepository.findByTrekkerId: ${error.message}`);
    return data ?? [];
  }

  /**
   * Create a new review. Returns the full inserted row.
   */
  async create(values: {
    trekker_id: string;
    booking_id: string;
    trek_id: string | null;
    rating: number;
    comment?: string | null;
  }) {
    const { data, error } = await (this.client as any)
      .from("reviews")
      .insert(values)
      .select("*")
      .single();

    if (error) throw new Error(`ReviewRepository.create: ${error.message}`);
    return data;
  }

  /**
   * Update a review by ID, scoped to the owning trekker. Returns the updated row.
   */
  async update(id: string, trekkerId: string, updates: Record<string, unknown>) {
    const { data, error } = await (this.client as any)
      .from("reviews")
      .update(updates)
      .eq("id", id)
      .eq("trekker_id", trekkerId)
      .select("*")
      .single();

    if (error) throw new Error(`ReviewRepository.update: ${error.message}`);
    return data;
  }

  /**
   * Delete a review by ID, scoped to the owning trekker.
   * Returns the count of deleted rows.
   */
  async delete(id: string, trekkerId: string) {
    const { error, count } = await (this.client as any)
      .from("reviews")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("trekker_id", trekkerId);

    if (error) throw new Error(`ReviewRepository.delete: ${error.message}`);
    return count ?? 0;
  }

  /**
   * Validate a booking exists and return ownership/status info for review creation.
   */
  async findBookingForReview(bookingId: string) {
    const { data, error } = await (this.client as any)
      .from("bookings")
      .select("id, trekker_id, status, trek_events(trek_id)")
      .eq("id", bookingId)
      .single();

    if (error) throw new Error(`ReviewRepository.findBookingForReview: ${error.message}`);
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

    if (error) throw new Error(`ReviewRepository.findTrekIdBySlug: ${error.message}`);
    return data;
  }
}
