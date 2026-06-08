import { slugify } from "@/lib/utils";
import type { DifficultyLevel, ChildPricePolicy } from "@/types/database";
import type {
  TrekRepository,
  TrekFilters,
  TrekSortConfig,
  TrekListRow,
} from "@/lib/repositories/trek.repository";

// ─── Sort mapping (matches the API route) ────────────────────────────────────

const SORT_MAP: Record<string, TrekSortConfig> = {
  popularity: { column: "created_at", ascending: false },
  created_at: { column: "created_at", ascending: false },
  title: { column: "title", ascending: true },
  duration_days: { column: "duration_days", ascending: true },
  price_low: { column: "default_adult_price", ascending: true },
  price_high: { column: "default_adult_price", ascending: false },
  rating: { column: "created_at", ascending: false },
  date: { column: "created_at", ascending: false },
};

// ─── Published trek list item (post-processed) ──────────────────────────────

export interface PublishedTrekItem {
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
  cover_image: { image_url: string; alt_text: string | null; is_cover: boolean } | null;
  organizer: TrekListRow["organizers"];
  next_event: {
    id: string;
    event_date: string;
    price: number;
    child_price: number | null;
    seats_available: number;
  } | null;
}

// ─── Input for trek creation ─────────────────────────────────────────────────

export interface CreateTrekInput {
  title: string;
  description?: string;
  short_desc?: string;
  difficulty?: string;
  duration_days?: number;
  distance_km?: number;
  elevation_m?: number;
  region?: string;
  meeting_point?: string;
  meeting_point_url?: string;
  inclusions?: string[];
  exclusions?: string[];
  things_to_carry?: string[];
  cancellation_policy?: string;
  cancellation_rules?: { hours_before: number; refund_percent: number }[];
  is_child_friendly?: boolean;
  min_child_age?: number;
  child_price_policy?: string;
  is_published?: boolean;
  default_pickup_points?: unknown[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class TrekService {
  constructor(private trekRepo: TrekRepository) {}

  /**
   * List published treks with filters, sorting, and pagination.
   * Post-processes rows to extract cover image and next upcoming event.
   */
  async getPublishedTreks(
    filters: TrekFilters,
    sort: string,
    page: number,
    limit: number,
  ): Promise<{ treks: PublishedTrekItem[]; total: number; page: number }> {
    const sortConfig = SORT_MAP[sort] ?? SORT_MAP.popularity;

    const { data, count } = await this.trekRepo.findPublished(
      filters,
      sortConfig,
      page,
      limit,
    );

    const now = new Date().toISOString();

    const treks: PublishedTrekItem[] = data.map((trek) => {
      const coverImage =
        trek.trek_images.find((img) => img.is_cover) ??
        trek.trek_images[0] ??
        null;

      const upcomingEvents = trek.trek_events
        .filter(
          (e) =>
            (e.status === "upcoming" || e.status === "full") &&
            e.event_date >= now,
        )
        .sort(
          (a, b) =>
            new Date(a.event_date).getTime() -
            new Date(b.event_date).getTime(),
        );

      const nextEvent = upcomingEvents[0]
        ? {
            id: upcomingEvents[0].id,
            event_date: upcomingEvents[0].event_date,
            price: upcomingEvents[0].price,
            child_price: upcomingEvents[0].child_price,
            seats_available:
              upcomingEvents[0].total_seats -
              (upcomingEvents[0].booked_seats ?? 0),
          }
        : null;

      return {
        id: trek.id,
        slug: trek.slug,
        title: trek.title,
        short_desc: trek.short_desc,
        difficulty: trek.difficulty,
        duration_days: trek.duration_days,
        distance_km: trek.distance_km,
        elevation_m: trek.elevation_m,
        region: trek.region,
        is_child_friendly: trek.is_child_friendly,
        min_child_age: trek.min_child_age,
        default_adult_price: trek.default_adult_price,
        default_child_price: trek.default_child_price,
        cover_image: coverImage,
        organizer: trek.organizers,
        next_event: nextEvent,
      };
    });

    return { treks, total: count, page };
  }

  /**
   * Get full trek detail by slug (or UUID). Filters trek_events
   * to only upcoming/full events with future dates, sorted ascending.
   */
  async getTrekDetail(slug: string) {
    const trek = await this.trekRepo.findBySlug(slug);
    if (!trek) {
      throw new Error("Trek not found");
    }

    // Filter events: only upcoming/full with future dates
    const now = new Date().toISOString();
    trek.trek_events = trek.trek_events
      .filter(
        (e) =>
          (e.status === "upcoming" || e.status === "full") &&
          e.event_date >= now,
      )
      .sort(
        (a, b) =>
          new Date(a.event_date).getTime() -
          new Date(b.event_date).getTime(),
      );

    return trek;
  }

  /**
   * Create a new trek with a unique slug derived from the title.
   */
  async createTrek(organizerId: string, data: CreateTrekInput) {
    if (!data.title) {
      throw new Error("title is required");
    }

    const baseSlug = slugify(data.title);

    // Ensure slug uniqueness
    const existingSlugs = await this.trekRepo.findMatchingSlugs(baseSlug);
    let slug = baseSlug;
    if (existingSlugs.length > 0 && existingSlugs.includes(baseSlug)) {
      let counter = 2;
      while (existingSlugs.includes(`${baseSlug}-${counter}`)) counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertPayload: any = {
      slug,
      title: data.title,
      description: data.description,
      short_desc: data.short_desc,
      difficulty: data.difficulty as DifficultyLevel | undefined,
      duration_days: data.duration_days,
      distance_km: data.distance_km,
      elevation_m: data.elevation_m,
      region: data.region,
      meeting_point: data.meeting_point,
      meeting_point_url: data.meeting_point_url,
      inclusions: data.inclusions ?? [],
      exclusions: data.exclusions ?? [],
      things_to_carry: data.things_to_carry ?? [],
      cancellation_policy: data.cancellation_policy,
      cancellation_rules: data.cancellation_rules ?? [
        { hours_before: 48, refund_percent: 100 },
        { hours_before: 24, refund_percent: 50 },
        { hours_before: 0, refund_percent: 0 },
      ],
      is_child_friendly: data.is_child_friendly ?? false,
      min_child_age: data.min_child_age,
      child_price_policy: data.child_price_policy as ChildPricePolicy | undefined,
      default_pickup_points: data.default_pickup_points ?? [],
      organizer_id: organizerId,
      is_published: data.is_published ?? false,
    };

    const trek = await this.trekRepo.create(insertPayload);

    return trek;
  }

  /**
   * Update a trek by ID. Strips protected fields before delegating
   * to the repository.
   */
  async updateTrek(trekId: string, data: Record<string, unknown>) {
    // Prevent overwriting protected fields
    delete data.id;
    delete data.slug;
    delete data.organizer_id;
    delete data.created_at;

    return this.trekRepo.update(trekId, data);
  }

  /**
   * Delete a trek by slug after verifying ownership and checking
   * for blocking events (upcoming events with existing bookings).
   */
  async deleteTrek(slug: string, userId: string) {
    const owned = await this.trekRepo.verifyOwnership(slug, userId);
    if (!owned) {
      throw new Error("Forbidden");
    }

    // Check for upcoming events with bookings
    const blockers = await this.trekRepo.findBlockingEvents(owned.id);
    if (blockers.length > 0) {
      throw new Error(
        "Cannot delete trek: there are upcoming events with existing bookings.",
      );
    }

    await this.trekRepo.deleteBySlug(slug);
    return { success: true };
  }
}
