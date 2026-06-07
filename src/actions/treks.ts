"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { DEFAULT_CANCELLATION_RULES } from "@/lib/cancellation";
import type { CancellationRule } from "@/lib/cancellation";
import type {
  DifficultyLevel,
  Trek,
  TrekImage,
  TrekEvent,
  PickupPoint,
  Organizer,
} from "@/types/database";

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

async function getOrganizerForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ id: string; default_cancellation_rules: CancellationRule[] | null }> {
  const { data, error } = await (supabase as any)
    .from("organizers")
    .select("id, status, default_cancellation_rules")
    .eq("profile_id", userId)
    .single();
  if (error || !data) throw new Error("Organizer profile not found");
  if ((data as any).status !== "active") throw new Error("Organizer account is not active");
  return data as { id: string; default_cancellation_rules: CancellationRule[] | null };
}

function parseArrayField(value: string | null | undefined): string[] | null {
  if (!value) return null;
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─── createTrek ───────────────────────────────────────────────────────────────

export async function createTrek(
  formData: FormData,
): Promise<{ success: true; id: string; slug: string } | { error: string }> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const organizer = await getOrganizerForUser(supabase, user.id);

    const title = (formData.get("title") as string)?.trim();
    if (!title) return { error: "Title is required." };

    const slug = slugify(title);
    const difficulty = formData.get("difficulty") as DifficultyLevel;
    const duration_days = Number(formData.get("duration_days"));
    const region = (formData.get("region") as string)?.trim();

    if (!difficulty || !duration_days || !region) {
      return { error: "Difficulty, duration, and region are required." };
    }

    // Resolve cancellation rules: FormData > organizer default > system default
    let cancellationRules: CancellationRule[];
    const rawRules = formData.get("cancellation_rules") as string | null;
    if (rawRules) {
      cancellationRules = JSON.parse(rawRules) as CancellationRule[];
    } else if (organizer.default_cancellation_rules) {
      cancellationRules = organizer.default_cancellation_rules;
    } else {
      cancellationRules = DEFAULT_CANCELLATION_RULES;
    }

    const { data, error } = await (supabase as any)
      .from("treks")
      .insert({
        organizer_id: organizer.id,
        title,
        slug,
        description: (formData.get("description") as string) || null,
        short_desc: (formData.get("short_desc") as string) || null,
        difficulty,
        duration_days,
        elevation_m: formData.get("elevation_m")
          ? Number(formData.get("elevation_m"))
          : null,
        distance_km: formData.get("distance_km")
          ? Number(formData.get("distance_km"))
          : null,
        region,
        meeting_point: (formData.get("meeting_point") as string) || null,
        meeting_point_url: (formData.get("meeting_point_url") as string) || null,
        inclusions: parseArrayField(formData.get("inclusions") as string),
        exclusions: parseArrayField(formData.get("exclusions") as string),
        things_to_carry: parseArrayField(formData.get("things_to_carry") as string),
        default_pickup_points: formData.get("default_pickup_points")
          ? JSON.parse(formData.get("default_pickup_points") as string)
          : [],
        cancellation_policy: (formData.get("cancellation_policy") as string) || null,
        cancellation_rules: cancellationRules,
        is_child_friendly: formData.get("is_child_friendly") === "true",
        min_child_age: formData.get("min_child_age") ? Number(formData.get("min_child_age")) : null,
        child_price_policy: (formData.get("child_price_policy") as string) || null,
        is_published: formData.get("publish") === "true",
      })
      .select("id, slug")
      .single();

    if (error) {
      if ((error as any).code === "23505") return { error: "A trek with this title already exists." };
      return { error: error.message };
    }

    return { success: true, id: (data as { id: string; slug: string }).id, slug: (data as { id: string; slug: string }).slug };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create trek." };
  }
}

// ─── updateTrek ───────────────────────────────────────────────────────────────

export async function updateTrek(
  trekId: string,
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const organizer = await getOrganizerForUser(supabase, user.id);

    // Verify ownership
    const { data: existing, error: fetchError } = await (supabase as any)
      .from("treks")
      .select("id")
      .eq("id", trekId)
      .eq("organizer_id", organizer.id)
      .single();

    if (fetchError || !existing) return { error: "Trek not found or access denied." };

    const title = formData.get("title") as string | null;
    const updates: Record<string, unknown> = {};

    if (title?.trim()) {
      updates.title = title.trim();
      updates.slug = slugify(title.trim());
    }
    if (formData.has("description")) updates.description = formData.get("description") || null;
    if (formData.has("difficulty")) updates.difficulty = formData.get("difficulty");
    if (formData.has("duration_days")) updates.duration_days = Number(formData.get("duration_days"));
    if (formData.has("elevation_m")) {
      const v = formData.get("elevation_m");
      updates.elevation_m = v ? Number(v) : null;
    }
    if (formData.has("distance_km")) {
      const v = formData.get("distance_km");
      updates.distance_km = v ? Number(v) : null;
    }
    if (formData.has("region")) updates.region = formData.get("region");
    if (formData.has("meeting_point")) updates.meeting_point = formData.get("meeting_point") || null;
    if (formData.has("inclusions")) updates.inclusions = parseArrayField(formData.get("inclusions") as string);
    if (formData.has("exclusions")) updates.exclusions = parseArrayField(formData.get("exclusions") as string);
    if (formData.has("things_to_carry")) updates.things_to_carry = parseArrayField(formData.get("things_to_carry") as string);
    if (formData.has("meeting_point_url")) updates.meeting_point_url = formData.get("meeting_point_url") || null;
    if (formData.has("short_desc")) updates.short_desc = formData.get("short_desc") || null;
    if (formData.has("cancellation_policy")) updates.cancellation_policy = formData.get("cancellation_policy") || null;
    if (formData.has("cancellation_rules")) {
      updates.cancellation_rules = JSON.parse(formData.get("cancellation_rules") as string);
    }
    if (formData.has("default_pickup_points")) {
      updates.default_pickup_points = JSON.parse(formData.get("default_pickup_points") as string);
    }
    if (formData.has("is_child_friendly")) {
      updates.is_child_friendly = formData.get("is_child_friendly") === "true";
    }
    if (formData.has("min_child_age")) {
      const v = formData.get("min_child_age");
      updates.min_child_age = v ? Number(v) : null;
    }
    if (formData.has("publish")) {
      updates.is_published = formData.get("publish") === "true";
    }

    const { error } = await (supabase as any).from("treks").update(updates).eq("id", trekId);
    if (error) return { error: error.message };

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update trek." };
  }
}

// ─── publishTrek ──────────────────────────────────────────────────────────────

export async function publishTrek(
  trekId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const organizer = await getOrganizerForUser(supabase, user.id);

    const { error } = await (supabase as any)
      .from("treks")
      .update({ is_published: true })
      .eq("id", trekId)
      .eq("organizer_id", organizer.id);

    if (error) return { error: error.message };
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to publish trek." };
  }
}

// ─── unpublishTrek ────────────────────────────────────────────────────────────

export async function unpublishTrek(
  trekId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const organizer = await getOrganizerForUser(supabase, user.id);

    const { error } = await (supabase as any)
      .from("treks")
      .update({ is_published: false })
      .eq("id", trekId)
      .eq("organizer_id", organizer.id);

    if (error) return { error: error.message };
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to unpublish trek." };
  }
}

// ─── deleteTrek ───────────────────────────────────────────────────────────────

export async function deleteTrek(
  trekId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const organizer = await getOrganizerForUser(supabase, user.id);

    // Verify ownership
    const { data: trek, error: fetchError } = await (supabase as any)
      .from("treks")
      .select("id")
      .eq("id", trekId)
      .eq("organizer_id", organizer.id)
      .single();

    if (fetchError || !trek) return { error: "Trek not found or access denied." };

    // Block deletion if upcoming events have bookings
    const { data: blockers } = await (supabase as any)
      .from("trek_events")
      .select("id, bookings!inner(id)")
      .eq("trek_id", trekId)
      .in("status", ["upcoming", "ongoing"])
      .limit(1);

    if (blockers && (blockers as any[]).length > 0) {
      return {
        error: "Cannot delete trek: there are upcoming events with bookings. Cancel or complete them first.",
      };
    }

    const { error } = await (supabase as any).from("treks").delete().eq("id", trekId);
    if (error) return { error: error.message };

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete trek." };
  }
}

// ─── getPublishedTreks ────────────────────────────────────────────────────────

export interface PublishedTrekFilters {
  difficulty?: DifficultyLevel;
  region?: string;
  duration?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PublishedTrekItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  difficulty: DifficultyLevel;
  duration_days: number;
  region: string;
  avg_rating: number | null;
  total_reviews: number;
  cover_image: string | null;
  organizer_name: string;
  next_event_date: string | null;
  next_event_price: number | null;
  next_event_seats: number | null;
}

export async function getPublishedTreks(
  filters?: PublishedTrekFilters,
): Promise<{ data: PublishedTrekItem[]; total: number; error?: string }> {
  try {
    const supabase = await createClient();
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 12;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = (supabase as any)
      .from("treks")
      .select(
        `
        id, title, slug, description, difficulty, duration_days, region,
        avg_rating, total_reviews,
        trek_images(image_url, is_cover, sort_order),
        organizers(org_name),
        trek_events(event_date, price, total_seats, booked_seats, status)
        `,
        { count: "exact" },
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters?.difficulty) query = query.eq("difficulty", filters.difficulty);
    if (filters?.region) query = query.eq("region", filters.region);
    if (filters?.duration) query = query.eq("duration_days", filters.duration);
    if (filters?.search) query = query.ilike("title", `%${filters.search}%`);

    const { data, error, count } = await query;
    if (error) return { data: [], total: 0, error: error.message };

    const now = new Date().toISOString();

    const result: PublishedTrekItem[] = ((data as any[]) ?? []).map((trek: any) => {
      const images: Array<{ image_url: string; is_cover: boolean; sort_order: number }> =
        trek.trek_images ?? [];
      const cover =
        images.find((img) => img.is_cover)?.image_url ??
        [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.image_url ??
        null;

      const organizer = Array.isArray(trek.organizers) ? trek.organizers[0] : trek.organizers;

      const upcomingEvents = ((trek.trek_events ?? []) as Array<{
        event_date: string;
        price: number;
        total_seats: number;
        booked_seats: number;
        status: string;
      }>)
        .filter((e) => e.status === "upcoming" && e.event_date > now)
        .sort((a, b) => a.event_date.localeCompare(b.event_date));

      const nextEvent = upcomingEvents[0] ?? null;

      return {
        id: trek.id,
        title: trek.title,
        slug: trek.slug,
        description: trek.description,
        difficulty: trek.difficulty as DifficultyLevel,
        duration_days: trek.duration_days,
        region: trek.region,
        avg_rating: trek.avg_rating,
        total_reviews: trek.total_reviews,
        cover_image: cover,
        organizer_name: organizer?.org_name ?? "",
        next_event_date: nextEvent?.event_date ?? null,
        next_event_price: nextEvent?.price ?? null,
        next_event_seats: nextEvent
          ? nextEvent.total_seats - nextEvent.booked_seats
          : null,
      };
    });

    return { data: result, total: count ?? 0 };
  } catch (err) {
    return {
      data: [],
      total: 0,
      error: err instanceof Error ? err.message : "Failed to fetch treks.",
    };
  }
}

// ─── getTrekBySlug ────────────────────────────────────────────────────────────

export interface TrekDetailWithReviews extends Trek {
  trek_images: TrekImage[];
  organizer: Organizer;
  trek_events: (TrekEvent & { pickup_points: PickupPoint[] })[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    user_name: string | null;
  }[];
}

export async function getTrekBySlug(slug: string): Promise<{
  data: TrekDetailWithReviews | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("treks")
      .select(
        `
        *,
        trek_images(*),
        organizers(*),
        trek_events(*, pickup_points(*)),
        reviews(id, rating, comment, created_at, profiles(full_name))
        `,
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (error || !data) return { data: null, error: "Trek not found." };

    const now = new Date().toISOString();

    const trek_events = ((data as any).trek_events ?? []).filter(
      (e: any) => e.status === "upcoming" && e.event_date >= now,
    ).sort((a: any, b: any) => a.event_date.localeCompare(b.event_date)) as (TrekEvent & { pickup_points: PickupPoint[] })[];

    const reviews = ((data as any).reviews ?? []).map((r: any) => {
      const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        user_name: profile?.full_name ?? null,
      };
    });

    const organizer = Array.isArray((data as any).organizers)
      ? (data as any).organizers[0]
      : (data as any).organizers;

    return {
      data: {
        ...(data as any),
        trek_images: ((data as any).trek_images ?? []) as TrekImage[],
        organizer: organizer as Organizer,
        trek_events,
        reviews,
      } as TrekDetailWithReviews,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch trek.",
    };
  }
}

// ─── getOrganizerTreks ────────────────────────────────────────────────────────

export interface OrganizerTrekItem extends Trek {
  trek_images: TrekImage[];
  _event_count: number;
}

export async function getOrganizerTreks(): Promise<{
  data: OrganizerTrekItem[];
  error?: string;
}> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const organizer = await getOrganizerForUser(supabase, user.id);

    const { data, error } = await (supabase as any)
      .from("treks")
      .select("*, trek_images(*), trek_events(id, status)")
      .eq("organizer_id", organizer.id)
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };

    const result: OrganizerTrekItem[] = ((data as any[]) ?? []).map((trek: any) => ({
      ...trek,
      trek_images: (trek.trek_images ?? []) as TrekImage[],
      _event_count: ((trek.trek_events ?? []) as Array<{ id: string; status: string }>).filter(
        (e) => e.status === "upcoming",
      ).length,
    }));

    return { data: result };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch treks.",
    };
  }
}
