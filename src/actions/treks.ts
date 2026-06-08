"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireAuth, requireOrganizer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createTrekService } from "@/lib/services";
import { TrekRepository, OrganizerRepository } from "@/lib/repositories";
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
    const { supabase, organizerId } = await requireOrganizer();
    const trekService = createTrekService(supabase);

    // Get organizer default cancellation rules
    const orgRepo = new OrganizerRepository(supabase);
    const orgData = await orgRepo.findByProfileId((await requireAuth()).user.id).catch(() => null);
    const orgDefaultRules = (orgData as any)?.default_cancellation_rules ?? null;

    const title = (formData.get("title") as string)?.trim();
    if (!title) return { error: "Title is required." };

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
    } else if (orgDefaultRules) {
      cancellationRules = orgDefaultRules;
    } else {
      cancellationRules = DEFAULT_CANCELLATION_RULES;
    }

    const trekRepo = new TrekRepository(supabase);

    // Generate unique slug
    const baseSlug = slugify(title);
    const existingSlugs = await trekRepo.findMatchingSlugs(baseSlug);
    let slug = baseSlug;
    if (existingSlugs.length > 0 && existingSlugs.includes(baseSlug)) {
      let counter = 2;
      while (existingSlugs.includes(`${baseSlug}-${counter}`)) counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const result = await trekRepo.create({
      organizer_id: organizerId,
      title,
      slug,
      description: (formData.get("description") as string) || null,
      short_desc: (formData.get("short_desc") as string) || null,
      difficulty,
      duration_days,
      elevation_m: formData.get("elevation_m") ? Number(formData.get("elevation_m")) : null,
      distance_km: formData.get("distance_km") ? Number(formData.get("distance_km")) : null,
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
    } as any);

    return { success: true, id: result.id, slug: result.slug };
  } catch (err) {
    if (err instanceof Error && err.message.includes("23505")) {
      return { error: "A trek with this title already exists." };
    }
    return { error: err instanceof Error ? err.message : "Failed to create trek." };
  }
}

// ─── updateTrek ───────────────────────────────────────────────────────────────

export async function updateTrek(
  trekId: string,
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, organizerId } = await requireOrganizer();
    const trekRepo = new TrekRepository(supabase);

    // Verify ownership
    const existing = await (supabase as any)
      .from("treks")
      .select("id")
      .eq("id", trekId)
      .eq("organizer_id", organizerId)
      .single();

    if (existing.error || !existing.data) return { error: "Trek not found or access denied." };

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

    await trekRepo.update(trekId, updates);
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
    const { supabase, organizerId } = await requireOrganizer();
    const trekRepo = new TrekRepository(supabase);

    // Verify ownership via raw query since repo.update needs matching organizer
    const { error } = await (supabase as any)
      .from("treks")
      .update({ is_published: true })
      .eq("id", trekId)
      .eq("organizer_id", organizerId);

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
    const { supabase, organizerId } = await requireOrganizer();

    const { error } = await (supabase as any)
      .from("treks")
      .update({ is_published: false })
      .eq("id", trekId)
      .eq("organizer_id", organizerId);

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
    const { supabase, organizerId } = await requireOrganizer();
    const trekRepo = new TrekRepository(supabase);

    // Verify ownership
    const { data: trek, error: fetchError } = await (supabase as any)
      .from("treks")
      .select("id, slug")
      .eq("id", trekId)
      .eq("organizer_id", organizerId)
      .single();

    if (fetchError || !trek) return { error: "Trek not found or access denied." };

    // Check for blocking events
    const blockers = await trekRepo.findBlockingEvents(trekId);
    if (blockers.length > 0) {
      return {
        error: "Cannot delete trek: there are upcoming events with bookings. Cancel or complete them first.",
      };
    }

    await trekRepo.deleteBySlug(trek.slug);
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
    const trekService = createTrekService(supabase);

    const result = await trekService.getPublishedTreks(
      {
        difficulties: filters?.difficulty ? [filters.difficulty] : undefined,
        regions: filters?.region ? [filters.region] : undefined,
        durations: filters?.duration ? [filters.duration] : undefined,
        search: filters?.search,
      },
      "popularity",
      filters?.page ?? 1,
      filters?.limit ?? 12,
    );

    const data: PublishedTrekItem[] = result.treks.map((trek) => ({
      id: trek.id,
      title: trek.title,
      slug: trek.slug,
      description: trek.short_desc,
      difficulty: trek.difficulty as DifficultyLevel,
      duration_days: trek.duration_days,
      region: trek.region ?? "",
      avg_rating: null,
      total_reviews: 0,
      cover_image: trek.cover_image?.image_url ?? null,
      organizer_name: trek.organizer?.org_name ?? "",
      next_event_date: trek.next_event?.event_date ?? null,
      next_event_price: trek.next_event?.price ?? null,
      next_event_seats: trek.next_event?.seats_available ?? null,
    }));

    return { data, total: result.total };
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
    const trekService = createTrekService(supabase);

    const trek = await trekService.getTrekDetail(slug);
    if (!trek) return { data: null, error: "Trek not found." };

    // Fetch reviews separately since TrekService doesn't include them
    const { data: reviewsRaw } = await (supabase as any)
      .from("reviews")
      .select("id, rating, comment, created_at, profiles(full_name)")
      .eq("trek_id", trek.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    const reviews = ((reviewsRaw as any[]) ?? []).map((r: any) => {
      const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        user_name: profile?.full_name ?? null,
      };
    });

    return {
      data: {
        ...trek,
        organizer: trek.organizers,
        reviews,
      } as unknown as TrekDetailWithReviews,
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
    const { supabase, organizerId } = await requireOrganizer();
    const orgRepo = new OrganizerRepository(supabase);

    const treksRaw = await orgRepo.findTreksWithDetails(organizerId);

    const result: OrganizerTrekItem[] = (treksRaw as any[]).map((trek: any) => ({
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
