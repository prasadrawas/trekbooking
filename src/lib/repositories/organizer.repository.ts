/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Encapsulates all Supabase queries for the `organizers` table
 * and related dashboard aggregation queries.
 */
export class OrganizerRepository {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * List active organizers with pagination (public listing).
   * Returns only safe, non-sensitive fields.
   */
  async findActive({ page, limit }: { page: number; limit: number }) {
    const offset = (page - 1) * limit;

    const { data, error, count } = await (this.client as any)
      .from("organizers")
      .select("id, org_name, slug, description, logo_url, is_verified, avg_rating, total_reviews, status, created_at", { count: "exact" })
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`OrganizerRepository.findActive: ${error.message}`);
    return { organizers: data ?? [], total: count ?? 0 };
  }

  /**
   * Get a single organizer's public profile by slug.
   * Excludes sensitive fields (bank details, commission rate).
   */
  async findBySlug(slug: string) {
    const { data, error } = await (this.client as any)
      .from("organizers")
      .select("id, profile_id, org_name, slug, description, logo_url, phone, email, is_verified, avg_rating, total_reviews, status, created_at")
      .eq("slug", slug)
      .eq("status", "active")
      .single();

    if (error) throw new Error(`OrganizerRepository.findBySlug: ${error.message}`);
    return data;
  }

  /**
   * Get an organizer by their auth profile ID (for /me endpoints).
   * Includes private fields like bank details.
   */
  async findByProfileId(profileId: string) {
    const { data, error } = await (this.client as any)
      .from("organizers")
      .select("id, profile_id, org_name, slug, description, phone, email, logo_url, is_verified, avg_rating, bank_account_name, bank_account_number, bank_ifsc, default_cancellation_rules, created_at, updated_at")
      .eq("profile_id", profileId)
      .single();

    if (error) throw new Error(`OrganizerRepository.findByProfileId: ${error.message}`);
    return data;
  }

  /**
   * Check if an organizer profile already exists for a given profile ID.
   * Returns the organizer ID or null.
   */
  async findIdByProfileId(profileId: string) {
    const { data, error } = await (this.client as any)
      .from("organizers")
      .select("id")
      .eq("profile_id", profileId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`OrganizerRepository.findIdByProfileId: ${error.message}`);
    }
    return data;
  }

  /**
   * Find all slugs matching a base slug prefix (for unique slug generation).
   */
  async findSlugsByPrefix(baseSlug: string) {
    const { data, error } = await (this.client as any)
      .from("organizers")
      .select("slug")
      .like("slug", `${baseSlug}%`);

    if (error) throw new Error(`OrganizerRepository.findSlugsByPrefix: ${error.message}`);
    return (data ?? []).map((r: { slug: string }) => r.slug);
  }

  /**
   * Create a new organizer profile. Returns the inserted row's id and slug.
   */
  async create(values: {
    profile_id: string;
    org_name: string;
    slug: string;
    phone: string;
    email: string;
    description?: string | null;
    status?: string;
    free_period_ends_at?: string;
  }) {
    const { data, error } = await (this.client as any)
      .from("organizers")
      .insert(values)
      .select("id, slug")
      .single();

    if (error) throw new Error(`OrganizerRepository.create: ${error.message}`);
    return data;
  }

  /**
   * Update an organizer profile by profile_id.
   * Returns the full updated row with private fields.
   */
  async update(profileId: string, updates: Record<string, unknown>) {
    const { data, error } = await (this.client as any)
      .from("organizers")
      .update({ ...updates })
      .eq("profile_id", profileId)
      .select("id, profile_id, org_name, slug, description, phone, email, logo_url, is_verified, avg_rating, bank_account_name, bank_account_number, bank_ifsc, default_cancellation_rules, created_at, updated_at")
      .single();

    if (error) throw new Error(`OrganizerRepository.update: ${error.message}`);
    return data;
  }

  // ─── Dashboard queries ──────────────────────────────────────────────────────

  /**
   * Get organizer summary for dashboard (id, org_name, avg_rating).
   */
  async findDashboardSummary(profileId: string) {
    const { data, error } = await (this.client as any)
      .from("organizers")
      .select("id, org_name, avg_rating")
      .eq("profile_id", profileId)
      .single();

    if (error) throw new Error(`OrganizerRepository.findDashboardSummary: ${error.message}`);
    return data;
  }

  /**
   * Get organizer summary for reviews page (id, avg_rating, total_reviews).
   */
  async findReviewsSummary(profileId: string) {
    const { data, error } = await (this.client as any)
      .from("organizers")
      .select("id, avg_rating, total_reviews")
      .eq("profile_id", profileId)
      .single();

    if (error) throw new Error(`OrganizerRepository.findReviewsSummary: ${error.message}`);
    return data;
  }

  /**
   * Fetch trek IDs belonging to an organizer.
   */
  async findTrekIds(organizerId: string) {
    const { data, error } = await (this.client as any)
      .from("treks")
      .select("id")
      .eq("organizer_id", organizerId);

    if (error) throw new Error(`OrganizerRepository.findTrekIds: ${error.message}`);
    return (data ?? []).map((t: { id: string }) => t.id);
  }

  /**
   * Fetch event IDs for a set of trek IDs.
   */
  async findEventIdsByTrekIds(trekIds: string[]) {
    const { data, error } = await (this.client as any)
      .from("trek_events")
      .select("id")
      .in("trek_id", trekIds);

    if (error) throw new Error(`OrganizerRepository.findEventIdsByTrekIds: ${error.message}`);
    return (data ?? []).map((e: { id: string }) => e.id);
  }

  /**
   * Count bookings in a set of events created since a given date.
   */
  async countBookingsSince(eventIds: string[], since: string) {
    const { count, error } = await (this.client as any)
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("trek_event_id", eventIds)
      .gte("created_at", since);

    if (error) throw new Error(`OrganizerRepository.countBookingsSince: ${error.message}`);
    return count ?? 0;
  }

  /**
   * Sum organizer_amount for confirmed bookings in a set of events created since a given date.
   */
  async sumRevenueSince(eventIds: string[], since: string) {
    const { data, error } = await (this.client as any)
      .from("bookings")
      .select("organizer_amount")
      .in("trek_event_id", eventIds)
      .eq("status", "confirmed")
      .gte("created_at", since)
      .limit(10000);

    if (error) throw new Error(`OrganizerRepository.sumRevenueSince: ${error.message}`);
    return (data ?? []).reduce(
      (sum: number, b: { organizer_amount: number | null }) => sum + (b.organizer_amount ?? 0),
      0,
    );
  }

  /**
   * Count upcoming events for a set of trek IDs.
   */
  async countUpcomingEvents(trekIds: string[], today: string) {
    const { count, error } = await (this.client as any)
      .from("trek_events")
      .select("id", { count: "exact", head: true })
      .in("trek_id", trekIds)
      .gte("event_date", today)
      .eq("status", "upcoming");

    if (error) throw new Error(`OrganizerRepository.countUpcomingEvents: ${error.message}`);
    return count ?? 0;
  }

  /**
   * Fetch the next N upcoming events with trek info.
   */
  async findUpcomingEvents(trekIds: string[], today: string, limit: number) {
    const { data, error } = await (this.client as any)
      .from("trek_events")
      .select("id, event_date, status, booked_seats, total_seats, treks(title, difficulty, slug)")
      .in("trek_id", trekIds)
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(limit);

    if (error) throw new Error(`OrganizerRepository.findUpcomingEvents: ${error.message}`);
    return data ?? [];
  }

  /**
   * Fetch the most recent N bookings across a set of event IDs.
   */
  async findRecentBookings(eventIds: string[], limit: number) {
    const { data, error } = await (this.client as any)
      .from("bookings")
      .select("id, booking_number, booking_name, total_amount, status, created_at, trek_events(event_date, treks(title))")
      .in("trek_event_id", eventIds)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`OrganizerRepository.findRecentBookings: ${error.message}`);
    return data ?? [];
  }

  /**
   * Fetch treks with images and events for the organizer's trek listing.
   */
  async findTreksWithDetails(organizerId: string) {
    const { data, error } = await (this.client as any)
      .from("treks")
      .select(`
        id, title, slug, difficulty, is_published, created_at,
        trek_images(image_url, is_cover),
        trek_events(id, event_date, status)
      `)
      .eq("organizer_id", organizerId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`OrganizerRepository.findTreksWithDetails: ${error.message}`);
    return data ?? [];
  }

  /**
   * Fetch published treks for an organizer's public profile page.
   */
  async findPublishedTreks(organizerId: string) {
    const { data, error } = await (this.client as any)
      .from("treks")
      .select(`
        id,
        title,
        slug,
        difficulty,
        duration_days,
        distance_km,
        region,
        is_child_friendly,
        default_adult_price,
        trek_images (
          image_url,
          is_cover,
          sort_order
        )
      `)
      .eq("organizer_id", organizerId)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(`OrganizerRepository.findPublishedTreks: ${error.message}`);
    return data ?? [];
  }
}
