/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Trek, TrekInsert } from "@/types/database";

// ─── Types for query results ────────────────────────────────────────────────

export interface TrekListRow {
  id: string;
  slug: string;
  title: string;
  short_desc: string | null;
  difficulty: string;
  duration_days: number;
  distance_km: number | null;
  elevation_m: number | null;
  region: string | null;
  is_child_friendly: boolean;
  min_child_age: number | null;
  default_adult_price: number;
  default_child_price: number | null;
  created_at: string;
  trek_images: { image_url: string; alt_text: string | null; is_cover: boolean }[];
  organizers: { org_name: string; slug: string; is_verified: boolean; avg_rating: number } | null;
  trek_events: {
    id: string;
    event_date: string;
    price: number;
    child_price: number | null;
    total_seats: number;
    booked_seats: number;
    status: string;
  }[];
}

export interface TrekDetailRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  difficulty: string;
  duration_days: number;
  min_child_age: number | null;
  elevation_m: number | null;
  distance_km: number | null;
  region: string | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  things_to_carry: string[] | null;
  itinerary: any;
  is_child_friendly: boolean;
  default_pickup_points: any;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  trek_images: {
    id: string;
    image_url: string;
    alt_text: string | null;
    is_cover: boolean;
    sort_order: number;
  }[];
  organizers: {
    org_name: string;
    slug: string;
    is_verified: boolean;
    avg_rating: number;
    logo_url: string | null;
    created_at: string;
  };
  trek_events: {
    id: string;
    event_date: string;
    end_date: string | null;
    reporting_time: string;
    price: number;
    child_price: number | null;
    total_seats: number;
    booked_seats: number;
    status: string;
    pickup_points: {
      id: string;
      label: string;
      address: string | null;
      pickup_time: string;
      maps_url: string | null;
    }[];
  }[];
}

export interface TrekOwnershipRow {
  id: string;
  slug: string;
  organizer_id: string;
  organizers: { profile_id: string } | null;
}

/** Sort configuration accepted by findPublished. */
export interface TrekSortConfig {
  column: string;
  ascending: boolean;
}

/** Filters accepted by findPublished. */
export interface TrekFilters {
  regions?: string[];
  difficulties?: string[];
  durations?: number[];
  childFriendly?: boolean;
  search?: string;
  priceMin?: number;
  priceMax?: number;
}

export class TrekRepository {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * List published treks with filters, sorting, and pagination.
   * Includes trek_images, organizers, and trek_events joins for
   * building the card view with cover image and next-event data.
   * Returns { data, count }.
   */
  async findPublished(
    filters: TrekFilters,
    sort: TrekSortConfig,
    page: number,
    limit: number
  ): Promise<{ data: TrekListRow[]; count: number }> {
    const offset = (page - 1) * limit;

    let query = (this.client as any)
      .from("treks")
      .select(
        `
      id, slug, title, short_desc, difficulty, duration_days, distance_km,
      elevation_m, region, is_child_friendly, min_child_age, default_adult_price, default_child_price, created_at,
      trek_images(image_url, alt_text, is_cover),
      organizers(org_name, slug, is_verified, avg_rating),
      trek_events(id, event_date, price, child_price, total_seats, booked_seats, status)
    `,
        { count: "exact" }
      )
      .eq("is_published", true);

    if (filters.regions && filters.regions.length === 1) {
      query = query.eq("region", filters.regions[0]);
    } else if (filters.regions && filters.regions.length > 1) {
      query = query.in("region", filters.regions);
    }

    if (filters.difficulties && filters.difficulties.length === 1) {
      query = query.eq("difficulty", filters.difficulties[0]);
    } else if (filters.difficulties && filters.difficulties.length > 1) {
      query = query.in("difficulty", filters.difficulties);
    }

    if (filters.durations && filters.durations.length === 1) {
      query = query.eq("duration_days", filters.durations[0]);
    } else if (filters.durations && filters.durations.length > 1) {
      query = query.in("duration_days", filters.durations);
    }

    if (filters.childFriendly) {
      query = query.eq("is_child_friendly", true);
    }

    if (filters.search) {
      query = query.ilike("title", `%${filters.search}%`);
    }

    query = query.order(sort.column, { ascending: sort.ascending });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw new Error(`TrekRepository.findPublished: ${error.message}`);
    return { data: (data ?? []) as TrekListRow[], count: count ?? 0 };
  }

  /**
   * Fetch a single trek by slug or UUID with full detail joins:
   * trek_images, organizers (inner), and trek_events with pickup_points.
   */
  async findBySlug(slugOrId: string): Promise<TrekDetailRow | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    const { data, error } = await (this.client as any)
      .from("treks")
      .select(
        `
      id, title, slug, short_desc, description, difficulty, duration_days, min_child_age, elevation_m,
      distance_km, region, meeting_point, meeting_point_url, inclusions, exclusions, things_to_carry, itinerary,
      is_child_friendly, child_price_policy, default_pickup_points, default_adult_price,
      default_child_price, cancellation_policy, cancellation_rules, is_published, created_at, updated_at,
      trek_images(id, image_url, alt_text, is_cover, sort_order),
      organizers!inner(org_name, slug, is_verified, avg_rating, logo_url, created_at),
      trek_events(
        id, event_date, end_date, reporting_time, price, child_price,
        total_seats, booked_seats, status,
        pickup_points(id, label, address, pickup_time, maps_url)
      )
    `
      )
      .eq(isUuid ? "id" : "slug", slugOrId)
      .single();

    if (error || !data) return null;
    return data as TrekDetailRow;
  }

  /**
   * Verify trek ownership: returns the trek row (with id, slug, organizer_id)
   * if the given user owns it via the organizer profile_id, otherwise null.
   * Supports both slug and UUID lookup.
   */
  async verifyOwnership(slugOrId: string, userId: string): Promise<TrekOwnershipRow | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const column = isUuid ? "id" : "slug";

    const { data } = await (this.client as any)
      .from("treks")
      .select("id, slug, organizer_id, organizers!inner(profile_id)")
      .eq(column, slugOrId)
      .single();

    if (!data || data.organizers?.profile_id !== userId) return null;
    return data as TrekOwnershipRow;
  }

  /**
   * Find existing slugs matching a base slug pattern.
   * Used for ensuring slug uniqueness when creating treks.
   */
  async findMatchingSlugs(baseSlug: string): Promise<string[]> {
    const { data } = await (this.client as any)
      .from("treks")
      .select("slug")
      .ilike("slug", `${baseSlug}%`);

    if (!data) return [];
    return (data as { slug: string }[]).map((r) => r.slug);
  }

  /**
   * Look up the organizer record for a user profile_id.
   * Returns { id } or null.
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
   * Create a new trek. Returns the inserted row's id and slug.
   */
  async create(trek: TrekInsert): Promise<{ id: string; slug: string }> {
    const { data, error } = await (this.client as any)
      .from("treks")
      .insert(trek)
      .select("id, slug")
      .single();

    if (error) throw new Error(`TrekRepository.create: ${error.message}`);
    return data as { id: string; slug: string };
  }

  /**
   * Update a trek by ID. Returns the full updated row.
   */
  async update(id: string, updates: Record<string, unknown>): Promise<Trek> {
    const { data, error } = await (this.client as any)
      .from("treks")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`TrekRepository.update: ${error.message}`);
    return data as Trek;
  }

  /**
   * Delete a trek by slug.
   */
  async deleteBySlug(slug: string): Promise<void> {
    const { error } = await (this.client as any)
      .from("treks")
      .delete()
      .eq("slug", slug);

    if (error) throw new Error(`TrekRepository.deleteBySlug: ${error.message}`);
  }

  /**
   * Check if a trek has upcoming events with existing bookings.
   * Returns the blocking event rows (id, booked_seats) or empty array.
   */
  async findBlockingEvents(trekId: string): Promise<{ id: string; booked_seats: number }[]> {
    const now = new Date().toISOString();

    const { data, error } = await (this.client as any)
      .from("trek_events")
      .select("id, booked_seats")
      .eq("trek_id", trekId)
      .gte("event_date", now)
      .neq("status", "cancelled")
      .gt("booked_seats", 0);

    if (error) throw new Error(`TrekRepository.findBlockingEvents: ${error.message}`);
    return (data ?? []) as { id: string; booked_seats: number }[];
  }

  /**
   * Resolve a trek slug or UUID to its id and organizer profile_id.
   * Used by event routes to verify the trek exists.
   */
  async resolveBySlugOrId(slugOrId: string): Promise<{ id: string; organizers: { profile_id: string } | null } | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    const { data } = await (this.client as any)
      .from("treks")
      .select("id, organizers!inner(profile_id)")
      .eq(isUuid ? "id" : "slug", slugOrId)
      .single();

    if (!data) return null;
    return data as { id: string; organizers: { profile_id: string } | null };
  }

  /**
   * Find a trek by slug, returning only its id. Used by event detail route.
   */
  async findIdBySlug(slug: string): Promise<string | null> {
    const { data } = await (this.client as any)
      .from("treks")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!data) return null;
    return (data as { id: string }).id;
  }
}
