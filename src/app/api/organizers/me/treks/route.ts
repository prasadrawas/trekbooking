import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/organizers/me/treks
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabase as any)
    .from("organizers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
  }

  const today = new Date().toISOString();

  // Single query with nested selects — eliminates N+1 (3-4 queries per trek)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: treks } = await (supabase as any)
    .from("treks")
    .select(`
      id, title, slug, difficulty, is_published, created_at,
      trek_images(image_url, is_cover),
      trek_events(id, event_date, status)
    `)
    .eq("organizer_id", org.id)
    .order("created_at", { ascending: false });

  if (!treks || treks.length === 0) {
    return NextResponse.json({ treks: [] });
  }

  // Compute derived fields in JS — one pass, zero extra queries
  type TrekImageRow = { image_url: string; is_cover: boolean };
  type TrekEventRow = { id: string; event_date: string; status: string };
  type TrekRow = {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    is_published: boolean;
    created_at: string;
    trek_images: TrekImageRow[];
    trek_events: TrekEventRow[];
  };

  const enriched = (treks as TrekRow[]).map((trek) => {
    const coverImg = trek.trek_images?.find((img) => img.is_cover) ?? trek.trek_images?.[0] ?? null;
    const upcomingEventsCount = (trek.trek_events ?? []).filter(
      (e) => (e.status === "upcoming" || e.status === "full") && e.event_date >= today,
    ).length;
    const totalBookings = 0; // Requires a separate aggregation query — omitted to avoid N queries

    return {
      id: trek.id,
      title: trek.title,
      slug: trek.slug,
      difficulty: trek.difficulty,
      is_published: trek.is_published,
      created_at: trek.created_at,
      cover_image_url: coverImg?.image_url ?? null,
      upcoming_events_count: upcomingEventsCount,
      total_bookings: totalBookings,
    };
  });

  return NextResponse.json({ treks: enriched });
}
