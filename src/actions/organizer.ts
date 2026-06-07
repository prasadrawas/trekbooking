"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

export async function createOrganizer(
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  // Check if organizer record already exists
  const { data: existing } = await supabase
    .from("organizers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

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
  const { data: slugCheck } = await supabase
    .from("organizers")
    .select("id")
    .eq("slug", slug)
    .single();

  if (slugCheck) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // Use admin client to bypass RLS for insert
  const adminClient = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient.from("organizers") as any).insert({
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

  if (error) {
    return { error: error.message };
  }

  return { success: true };
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("organizers")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  return data;
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabase as any)
    .from("organizers")
    .select("id, org_name, avg_rating")
    .eq("profile_id", user.id)
    .single();

  if (!org) return null;

  const today = new Date().toISOString();
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).toISOString();

  // Fetch organizer's trek IDs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trekRows } = await (supabase as any)
    .from("treks")
    .select("id")
    .eq("organizer_id", org.id);

  const trekIds: string[] = (trekRows ?? []).map((t: { id: string }) => t.id);

  // Fetch trek event IDs belonging to this organizer
  let eventIds: string[] = [];
  if (trekIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: eventRows } = await (supabase as any)
      .from("trek_events")
      .select("id")
      .in("trek_id", trekIds);
    eventIds = (eventRows ?? []).map((e: { id: string }) => e.id);
  }

  // --- Stats ---
  // Total bookings this month
  let totalBookingsThisMonth = 0;
  let revenueThisMonth = 0;

  if (eventIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: bookingCount } = await (supabase as any)
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("trek_event_id", eventIds)
      .gte("created_at", monthStart);

    totalBookingsThisMonth = bookingCount ?? 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: revenueRows } = await (supabase as any)
      .from("bookings")
      .select("organizer_amount")
      .in("trek_event_id", eventIds)
      .eq("status", "confirmed")
      .gte("created_at", monthStart);

    revenueThisMonth = (revenueRows ?? []).reduce(
      (sum: number, b: { organizer_amount: number | null }) =>
        sum + (b.organizer_amount ?? 0),
      0,
    );
  }

  // Upcoming treks count
  let upcomingTreksCount = 0;
  if (trekIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from("trek_events")
      .select("id", { count: "exact", head: true })
      .in("trek_id", trekIds)
      .gte("event_date", today)
      .eq("status", "upcoming");

    upcomingTreksCount = count ?? 0;
  }

  // --- Upcoming treks (next 3) ---
  type UpcomingTrek = {
    id: string;
    event_date: string;
    status: string;
    booked_seats: number;
    total_seats: number;
    trek: { title: string; difficulty: string; slug: string } | null;
  };
  let upcomingTreks: UpcomingTrek[] = [];

  if (trekIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: upcomingRows } = await (supabase as any)
      .from("trek_events")
      .select(
        "id, event_date, status, booked_seats, total_seats, treks(title, difficulty, slug)",
      )
      .in("trek_id", trekIds)
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(3);

    upcomingTreks = (upcomingRows ?? []).map(
      (row: {
        id: string;
        event_date: string;
        status: string;
        booked_seats: number;
        total_seats: number;
        treks: { title: string; difficulty: string; slug: string } | null;
      }) => ({
        id: row.id,
        event_date: row.event_date,
        status: row.status,
        booked_seats: row.booked_seats,
        total_seats: row.total_seats,
        trek: row.treks,
      }),
    );
  }

  // --- Recent bookings (last 5) ---
  type RecentBooking = {
    id: string;
    booking_number: string;
    booking_name: string;
    total_amount: number;
    status: string;
    created_at: string;
    trek_title: string | null;
    event_date: string | null;
  };
  let recentBookings: RecentBooking[] = [];

  if (eventIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bookingRows } = await (supabase as any)
      .from("bookings")
      .select(
        "id, booking_number, booking_name, total_amount, status, created_at, trek_events(event_date, treks(title))",
      )
      .in("trek_event_id", eventIds)
      .order("created_at", { ascending: false })
      .limit(5);

    recentBookings = (bookingRows ?? []).map(
      (b: {
        id: string;
        booking_number: string;
        booking_name: string;
        total_amount: number;
        status: string;
        created_at: string;
        trek_events: {
          event_date: string;
          treks: { title: string } | null;
        } | null;
      }) => ({
        id: b.id,
        booking_number: b.booking_number,
        booking_name: b.booking_name,
        total_amount: b.total_amount,
        status: b.status,
        created_at: b.created_at,
        trek_title: b.trek_events?.treks?.title ?? null,
        event_date: b.trek_events?.event_date ?? null,
      }),
    );
  }

  return {
    stats: {
      totalBookingsThisMonth,
      revenueThisMonth,
      upcomingTreksCount,
      avgRating: org.avg_rating ?? 0,
    },
    upcomingTreks,
    recentBookings,
    orgName: org.org_name,
  };
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabase as any)
    .from("organizers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!org) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: treks } = await (supabase as any)
    .from("treks")
    .select("id, title, slug, difficulty, is_published, created_at")
    .eq("organizer_id", org.id)
    .order("created_at", { ascending: false });

  if (!treks || treks.length === 0) return [];

  const today = new Date().toISOString();

  // Enrich each trek with image, upcoming event count, and total bookings
  const enriched = await Promise.all(
    treks.map(
      async (trek: {
        id: string;
        title: string;
        slug: string;
        difficulty: string;
        is_published: boolean;
        created_at: string;
      }) => {
        // Cover image
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: imgRow } = await (supabase as any)
          .from("trek_images")
          .select("image_url")
          .eq("trek_id", trek.id)
          .eq("is_cover", true)
          .maybeSingle();

        // Upcoming events
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: upcomingCount } = await (supabase as any)
          .from("trek_events")
          .select("id", { count: "exact", head: true })
          .eq("trek_id", trek.id)
          .gte("event_date", today);

        // Event IDs for booking count
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: eventRows } = await (supabase as any)
          .from("trek_events")
          .select("id")
          .eq("trek_id", trek.id);

        const eIds = (eventRows ?? []).map((e: { id: string }) => e.id);

        let totalBookings = 0;
        if (eIds.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { count } = await (supabase as any)
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .in("trek_event_id", eIds);
          totalBookings = count ?? 0;
        }

        return {
          ...trek,
          cover_image_url: imgRow?.image_url ?? null,
          upcoming_events_count: upcomingCount ?? 0,
          total_bookings: totalBookings,
        };
      },
    ),
  );

  return enriched;
}

export async function getOrgTrekDetail(trekId: string): Promise<Record<string, unknown> | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabase as any)
    .from("organizers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!org) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trek } = await (supabase as any)
    .from("treks")
    .select("*")
    .eq("id", trekId)
    .eq("organizer_id", org.id)
    .single();

  if (!trek) return null;

  // Images
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: images } = await (supabase as any)
    .from("trek_images")
    .select("*")
    .eq("trek_id", trekId)
    .order("sort_order", { ascending: true });

  // Upcoming events with pickup points
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
}

export async function getOrgEvents(trekId: string): Promise<Array<Record<string, unknown>>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabase as any)
    .from("organizers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!org) return [];

  // Verify trek belongs to organizer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trek } = await (supabase as any)
    .from("treks")
    .select("id")
    .eq("id", trekId)
    .eq("organizer_id", org.id)
    .single();

  if (!trek) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: events } = await (supabase as any)
    .from("trek_events")
    .select("*, pickup_points(*)")
    .eq("trek_id", trekId)
    .order("event_date", { ascending: true });

  if (!events || events.length === 0) return [];

  // Attach booking count per event
  const enriched = await Promise.all(
    events.map(async (ev: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase as any)
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("trek_event_id", ev.id);

      return { ...ev, booking_count: count ?? 0 };
    }),
  );

  return enriched;
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
  const supabase = await createClient();
  const PAGE_SIZE = 10;
  const page = filters?.page ?? 1;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { bookings: [], totalCount: 0, page };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabase as any)
    .from("organizers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!org) return { bookings: [], totalCount: 0, page };

  // Resolve event IDs scoped to the organizer (and optionally a single trek)
  let trekIds: string[] = [];
  if (filters?.trekId) {
    trekIds = [filters.trekId];
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: trekRows } = await (supabase as any)
      .from("treks")
      .select("id")
      .eq("organizer_id", org.id);
    trekIds = (trekRows ?? []).map((t: { id: string }) => t.id);
  }

  if (trekIds.length === 0) return { bookings: [], totalCount: 0, page };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: eventRows } = await (supabase as any)
    .from("trek_events")
    .select("id")
    .in("trek_id", trekIds);

  const eventIds: string[] = (eventRows ?? []).map((e: { id: string }) => e.id);

  if (eventIds.length === 0) return { bookings: [], totalCount: 0, page };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    (b: {
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
      trek_events: {
        event_date: string;
        treks: { title: string } | null;
      } | null;
    }) => ({
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabase as any)
    .from("organizers")
    .select("id, avg_rating, total_reviews")
    .eq("profile_id", user.id)
    .single();

  if (!org) return null;

  // Get trek IDs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trekRows } = await (supabase as any)
    .from("treks")
    .select("id")
    .eq("organizer_id", org.id);

  const trekIds: string[] = (trekRows ?? []).map((t: { id: string }) => t.id);

  if (trekIds.length === 0) {
    return {
      reviews: [],
      breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      avgRating: 0,
      totalReviews: 0,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reviewRows } = await (supabase as any)
    .from("reviews")
    .select(
      "id, rating, comment, created_at, bookings(booking_name, trek_events(treks(title)))",
    )
    .in("trek_id", trekIds)
    .order("created_at", { ascending: false });

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

  const reviews = (reviewRows ?? []).map((r: RawReview) => ({
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
    avgRating: org.avg_rating ?? 0,
    totalReviews: org.total_reviews ?? reviews.length,
  };
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabase as any)
    .from("organizers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!org) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payoutRows } = await (supabase as any)
    .from("payouts")
    .select("*, trek_events(event_date, treks(title))")
    .eq("organizer_id", org.id)
    .order("created_at", { ascending: false });

  type RawPayout = {
    id: string;
    payout_amount: number;
    status: string;
    created_at: string;
    trek_events: {
      event_date: string;
      treks: { title: string } | null;
    } | null;
    [key: string]: unknown;
  };

  const payouts: Array<Record<string, unknown>> = (payoutRows ?? []).map(
    (p: RawPayout) => ({
      ...p,
      trek_title: p.trek_events?.treks?.title ?? null,
      event_date: p.trek_events?.event_date ?? null,
    }),
  );

  // Summary from confirmed bookings organizer_amount
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trekRows } = await (supabase as any)
    .from("treks")
    .select("id")
    .eq("organizer_id", org.id);

  const trekIds: string[] = (trekRows ?? []).map((t: { id: string }) => t.id);

  let totalEarned = 0;
  let pendingAmount = 0;

  if (trekIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: eventRows } = await (supabase as any)
      .from("trek_events")
      .select("id")
      .in("trek_id", trekIds);

    const eventIds: string[] = (eventRows ?? []).map((e: { id: string }) => e.id);

    if (eventIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: earnedRows } = await (supabase as any)
        .from("bookings")
        .select("organizer_amount")
        .in("trek_event_id", eventIds)
        .eq("status", "confirmed");

      totalEarned = (earnedRows ?? []).reduce(
        (sum: number, b: { organizer_amount: number | null }) =>
          sum + (b.organizer_amount ?? 0),
        0,
      );

      // Pending = payouts in pending state for this organizer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pendingRows } = await (supabase as any)
        .from("payouts")
        .select("payout_amount")
        .eq("organizer_id", org.id)
        .eq("status", "pending");

      pendingAmount = (pendingRows ?? []).reduce(
        (sum: number, p: { payout_amount: number | null }) =>
          sum + (p.payout_amount ?? 0),
        0,
      );
    }
  }

  // Last completed payout
  const completedPayouts = (payoutRows ?? []).filter(
    (p: RawPayout) => p.status === "completed",
  );
  const lastPayout =
    completedPayouts.length > 0
      ? (completedPayouts[0] as RawPayout)
      : null;

  return {
    payouts,
    summary: {
      totalEarned,
      pendingAmount,
      lastPayoutDate: lastPayout?.created_at ?? null,
      lastPayoutAmount: lastPayout?.payout_amount ?? null,
    },
  };
}
