import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

async function getUser(supabase: any) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

// GET /api/treks — List published treks (public)
export async function GET(request: NextRequest) {
  // Use admin client for public read — bypasses RLS
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);

  const regions = searchParams.getAll("region");
  const difficulties = searchParams.getAll("difficulty");
  const durations = searchParams.getAll("duration");
  const childFriendly = searchParams.get("childFriendly") || searchParams.get("child_friendly");
  const search = searchParams.get("q");
  const priceMin = searchParams.get("price_min");
  const priceMax = searchParams.get("price_max");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "12", 10);
  const sort = searchParams.get("sort") ?? "created_at";

  const offset = (page - 1) * limit;

  let query = (supabase as any)
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

  if (regions.length === 1) query = query.eq("region", regions[0]);
  else if (regions.length > 1) query = query.in("region", regions);
  if (difficulties.length === 1) query = query.eq("difficulty", difficulties[0]);
  else if (difficulties.length > 1) query = query.in("difficulty", difficulties);
  if (durations.length === 1) query = query.eq("duration_days", parseInt(durations[0], 10));
  else if (durations.length > 1) query = query.in("duration_days", durations.map((d) => parseInt(d, 10)));
  if (childFriendly === "true") query = query.eq("is_child_friendly", true);
  if (search) query = query.ilike("title", `%${search}%`);

  // Sort mapping
  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    popularity: { column: "created_at", ascending: false },
    created_at: { column: "created_at", ascending: false },
    title: { column: "title", ascending: true },
    duration_days: { column: "duration_days", ascending: true },
    price_low: { column: "default_adult_price", ascending: true },
    price_high: { column: "default_adult_price", ascending: false },
    rating: { column: "created_at", ascending: false }, // no rating on trek, use created_at
    date: { column: "created_at", ascending: false },
  };
  const sortConfig = sortMap[sort] ?? sortMap.popularity;
  query = query.order(sortConfig.column, { ascending: sortConfig.ascending });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date().toISOString();

  const treks = (data ?? []).map((trek: any) => {
    const coverImage =
      (trek.trek_images ?? []).find((img: any) => img.is_cover) ??
      (trek.trek_images ?? [])[0] ??
      null;

    const upcomingEvents = (trek.trek_events ?? [])
      .filter(
        (e: any) => (e.status === "upcoming" || e.status === "full") && e.event_date >= now
      )
      .sort((a: any, b: any) =>
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      );

    const nextEvent = upcomingEvents[0]
      ? {
          id: upcomingEvents[0].id,
          event_date: upcomingEvents[0].event_date,
          price: upcomingEvents[0].price,
          child_price: upcomingEvents[0].child_price,
          seats_available:
            upcomingEvents[0].total_seats - (upcomingEvents[0].booked_seats ?? 0),
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

  return NextResponse.json({ treks, total: count ?? 0, page });
}

// POST /api/treks — Create trek (auth: organizer)
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const user = await getUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user has an organizer profile
  const { data: organizer } = await (supabase as any)
    .from("organizers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!organizer) {
    return NextResponse.json(
      { error: "Forbidden: organizer profile required" },
      { status: 403 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    title,
    description,
    short_desc,
    difficulty,
    duration_days,
    distance_km,
    elevation_m,
    region,
    meeting_point,
    meeting_point_url,
    inclusions,
    exclusions,
    things_to_carry,
    cancellation_policy,
    cancellation_rules,
    is_child_friendly,
    min_child_age,
    child_price_policy,
    is_published,
    default_pickup_points,
  } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const baseSlug = slugify(title);

  // Ensure slug uniqueness
  const { data: existing } = await (supabase as any)
    .from("treks")
    .select("slug")
    .ilike("slug", `${baseSlug}%`);

  let slug = baseSlug;
  if (existing && existing.length > 0) {
    const slugs = (existing as any[]).map((r: any) => r.slug);
    if (slugs.includes(baseSlug)) {
      let counter = 2;
      while (slugs.includes(`${baseSlug}-${counter}`)) counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }

  const { data: trek, error } = await (supabase as any)
    .from("treks")
    .insert({
      slug,
      title,
      description,
      short_desc,
      difficulty,
      duration_days,
      distance_km,
      elevation_m,
      region,
      meeting_point,
      meeting_point_url,
      inclusions: inclusions ?? [],
      exclusions: exclusions ?? [],
      things_to_carry: things_to_carry ?? [],
      cancellation_policy,
      cancellation_rules: cancellation_rules ?? [{ hours_before: 48, refund_percent: 100 }, { hours_before: 24, refund_percent: 50 }, { hours_before: 0, refund_percent: 0 }],
      is_child_friendly: is_child_friendly ?? false,
      min_child_age,
      child_price_policy,
      default_pickup_points: default_pickup_points ?? [],
      organizer_id: organizer.id,
      is_published: is_published ?? false,
    })
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ trek }, { status: 201 });
}
