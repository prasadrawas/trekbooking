"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireAuth, requireOrganizer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDashboardService } from "@/lib/services";
import {
  OrganizerRepository,
  PayoutRepository,
  ReviewRepository,
} from "@/lib/repositories";
import { slugify } from "@/lib/utils";

export async function createOrganizer(
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  try {
    const { supabase, user } = await requireAuth();
    const orgRepo = new OrganizerRepository(supabase);

    // Check if organizer record already exists
    const existing = await orgRepo.findIdByProfileId(user.id);
    if (existing) {
      return { error: "Organization already exists." };
    }

    const org_name = (formData.get("org_name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;

    if (!org_name || !phone || !email) {
      return { error: "Organization name, phone, and email are required." };
    }

    // Generate unique slug
    let slug = slugify(org_name);
    const existingSlugs = await orgRepo.findSlugsByPrefix(slug);
    if (existingSlugs.includes(slug)) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Use admin client to bypass RLS for insert
    const adminClient = createAdminClient();
    const adminOrgRepo = new OrganizerRepository(adminClient);
    await adminOrgRepo.create({
      profile_id: user.id,
      org_name,
      slug,
      phone: `+91${phone.replace(/^\+91/, "")}`,
      email,
      description,
      status: "active",
      free_period_ends_at: new Date(
        Date.now() + 90 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create organizer." };
  }
}

export async function getOrganizer(): Promise<{
  id: string;
  org_name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  phone: string;
  email: string;
  is_verified: boolean;
  commission_rate: number;
  avg_rating: number;
  total_reviews: number;
  status: string;
} | null> {
  try {
    const { supabase, user } = await requireAuth();
    const { data } = await (supabase as any)
      .from("organizers")
      .select("*")
      .eq("profile_id", user.id)
      .single();
    return data;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Dashboard data functions
// ---------------------------------------------------------------------------

export async function getOrgDashboardData(): Promise<{
  stats: {
    totalBookingsThisMonth: number;
    revenueThisMonth: number;
    upcomingTreksCount: number;
    avgRating: number;
  };
  upcomingTreks: Array<{
    id: string;
    event_date: string;
    status: string;
    booked_seats: number;
    total_seats: number;
    trek: { title: string; difficulty: string; slug: string } | null;
  }>;
  recentBookings: Array<{
    id: string;
    booking_number: string;
    booking_name: string;
    total_amount: number;
    status: string;
    created_at: string;
    trek_title: string | null;
    event_date: string | null;
  }>;
  orgName: string;
} | null> {
  try {
    const { supabase, user } = await requireAuth();
    const service = createDashboardService(supabase);
    return await service.getOrganizerDashboard(user.id);
  } catch {
    return null;
  }
}

export async function getOrgTreks(): Promise<
  Array<{
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    is_published: boolean;
    created_at: string;
    cover_image_url: string | null;
    upcoming_events_count: number;
    total_bookings: number;
  }>
> {
  try {
    const { supabase, organizerId } = await requireOrganizer();
    const orgRepo = new OrganizerRepository(supabase);

    const today = new Date().toISOString();
    const treksRaw = await orgRepo.findTreksWithDetails(organizerId);

    // Enrich each trek with cover image, upcoming event count, and total bookings
    const enriched = await Promise.all(
      (treksRaw as any[]).map(async (trek: any) => {
        const images = trek.trek_images ?? [];
        const coverImage = images.find((img: any) => img.is_cover)?.image_url ?? null;

        const events = trek.trek_events ?? [];
        const upcomingCount = events.filter(
          (e: any) => e.status === "upcoming" && e.event_date >= today,
        ).length;

        const eventIds = events.map((e: any) => e.id);
        let totalBookings = 0;
        if (eventIds.length > 0) {
          totalBookings = await orgRepo.countBookingsSince(eventIds, "1970-01-01");
        }

        return {
          id: trek.id,
          title: trek.title,
          slug: trek.slug,
          difficulty: trek.difficulty,
          is_published: trek.is_published,
          created_at: trek.created_at,
          cover_image_url: coverImage,
          upcoming_events_count: upcomingCount,
          total_bookings: totalBookings,
        };
      }),
    );

    return enriched;
  } catch {
    return [];
  }
}

export async function getOrgTrekDetail(trekId: string): Promise<Record<string, unknown> | null> {
  try {
    const { supabase, organizerId } = await requireOrganizer();

    const { data: trek } = await (supabase as any)
      .from("treks")
      .select("*")
      .eq("id", trekId)
      .eq("organizer_id", organizerId)
      .single();

    if (!trek) return null;

    const { data: images } = await (supabase as any)
      .from("trek_images")
      .select("*")
      .eq("trek_id", trekId)
      .order("sort_order", { ascending: true });

    const { data: events } = await (supabase as any)
      .from("trek_events")
      .select("*, pickup_points(*)")
      .eq("trek_id", trekId)
      .order("event_date", { ascending: true });

    return {
      ...trek,
      images: images ?? [],
      events: events ?? [],
    };
  } catch {
    return null;
  }
}

export async function getOrgEvents(trekId: string): Promise<Array<Record<string, unknown>>> {
  try {
    const { supabase, organizerId } = await requireOrganizer();

    // Verify trek belongs to organizer
    const { data: trek } = await (supabase as any)
      .from("treks")
      .select("id")
      .eq("id", trekId)
      .eq("organizer_id", organizerId)
      .single();

    if (!trek) return [];

    const { data: events } = await (supabase as any)
      .from("trek_events")
      .select("*, pickup_points(*)")
      .eq("trek_id", trekId)
      .order("event_date", { ascending: true });

    if (!events || events.length === 0) return [];

    // Attach booking count per event
    const enriched = await Promise.all(
      events.map(async (ev: Record<string, unknown>) => {
        const { count } = await (supabase as any)
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("trek_event_id", ev.id);
        return { ...ev, booking_count: count ?? 0 };
      }),
    );

    return enriched;
  } catch {
    return [];
  }
}

export async function getOrgBookings(filters?: {
  trekId?: string;
  status?: string;
  page?: number;
}): Promise<{
  bookings: Array<{
    id: string;
    booking_number: string;
    booking_name: string;
    booking_email: string;
    booking_phone: string;
    num_adults: number;
    num_children: number;
    total_amount: number;
    status: string;
    created_at: string;
    trek_title: string | null;
    event_date: string | null;
  }>;
  totalCount: number;
  page: number;
}> {
  const PAGE_SIZE = 10;
  const page = filters?.page ?? 1;

  try {
    const { supabase, organizerId } = await requireOrganizer();
    const orgRepo = new OrganizerRepository(supabase);

    // Resolve event IDs scoped to the organizer (and optionally a single trek)
    let trekIds: string[] = [];
    if (filters?.trekId) {
      trekIds = [filters.trekId];
    } else {
      trekIds = await orgRepo.findTrekIds(organizerId);
    }

    if (trekIds.length === 0) return { bookings: [], totalCount: 0, page };

    const eventIds = await orgRepo.findEventIdsByTrekIds(trekIds);
    if (eventIds.length === 0) return { bookings: [], totalCount: 0, page };

    let query = (supabase as any)
      .from("bookings")
      .select(
        "id, booking_number, booking_name, booking_email, booking_phone, num_adults, num_children, total_amount, status, created_at, trek_events(event_date, treks(title))",
        { count: "exact" },
      )
      .in("trek_event_id", eventIds)
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data: bookingRows, count: totalCount } = await query;

    const bookings = (bookingRows ?? []).map(
      (b: any) => ({
        id: b.id,
        booking_number: b.booking_number,
        booking_name: b.booking_name,
        booking_email: b.booking_email,
        booking_phone: b.booking_phone,
        num_adults: b.num_adults,
        num_children: b.num_children,
        total_amount: b.total_amount,
        status: b.status,
        created_at: b.created_at,
        trek_title: b.trek_events?.treks?.title ?? null,
        event_date: b.trek_events?.event_date ?? null,
      }),
    );

    return { bookings, totalCount: totalCount ?? 0, page };
  } catch {
    return { bookings: [], totalCount: 0, page };
  }
}

export async function getOrgReviewsData(): Promise<{
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    trekker_name: string | null;
    trek_title: string | null;
  }>;
  breakdown: Record<number, number>;
  avgRating: number;
  totalReviews: number;
} | null> {
  try {
    const { supabase, organizerId } = await requireOrganizer();
    const orgRepo = new OrganizerRepository(supabase);
    const reviewRepo = new ReviewRepository(supabase);

    const { user } = await requireAuth();
    const orgSummary = await orgRepo.findReviewsSummary(user.id);
    if (!orgSummary) return null;

    const trekIds = await orgRepo.findTrekIds(organizerId);

    if (trekIds.length === 0) {
      return {
        reviews: [],
        breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        avgRating: 0,
        totalReviews: 0,
      };
    }

    const reviewRows = await reviewRepo.findByTrekIds(trekIds, { offset: 0, limit: 200 });

    type RawReview = {
      id: string;
      rating: number;
      comment: string | null;
      created_at: string;
      bookings: {
        booking_name: string | null;
        trek_events: {
          treks: { title: string } | null;
        } | null;
      } | null;
    };

    const reviews = (reviewRows as RawReview[]).map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      trekker_name: r.bookings?.booking_name ?? null,
      trek_title: r.bookings?.trek_events?.treks?.title ?? null,
    }));

    // Rating breakdown
    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      const star = Math.round(r.rating);
      if (star >= 1 && star <= 5) breakdown[star] = (breakdown[star] ?? 0) + 1;
    }

    return {
      reviews,
      breakdown,
      avgRating: (orgSummary as any).avg_rating ?? 0,
      totalReviews: (orgSummary as any).total_reviews ?? reviews.length,
    };
  } catch {
    return null;
  }
}

export async function getOrgPayoutsData(): Promise<{
  payouts: Array<Record<string, unknown>>;
  summary: {
    totalEarned: number;
    pendingAmount: number;
    lastPayoutDate: string | null;
    lastPayoutAmount: number | null;
  };
} | null> {
  try {
    const { supabase, organizerId } = await requireOrganizer();
    const payoutRepo = new PayoutRepository(supabase);

    const { payouts: payoutRows } = await payoutRepo.findPaginated({
      organizerId,
      status: null,
      page: 1,
      limit: 100,
    });

    const payouts = (payoutRows as any[]).map((p: any) => ({
      ...p,
      trek_title: p.trek_events?.treks?.title ?? null,
      event_date: p.trek_events?.event_date ?? null,
    }));

    // Summary from payout records
    const summaryRows = await payoutRepo.findSummary(organizerId);
    const totalEarned = summaryRows
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.payout_amount, 0);
    const pendingAmount = summaryRows
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.payout_amount, 0);

    // Last completed payout
    const completedPayouts = payouts.filter((p: any) => p.status === "completed");
    const lastPayout = completedPayouts.length > 0 ? completedPayouts[0] : null;

    return {
      payouts,
      summary: {
        totalEarned,
        pendingAmount,
        lastPayoutDate: lastPayout?.created_at ?? null,
        lastPayoutAmount: lastPayout?.payout_amount ?? null,
      },
    };
  } catch {
    return null;
  }
}
