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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: treks } = await (supabase as any)
    .from("treks")
    .select("id, title, slug, difficulty, is_published, created_at")
    .eq("organizer_id", org.id)
    .order("created_at", { ascending: false });

  if (!treks || treks.length === 0) {
    return NextResponse.json({ treks: [] });
  }

  const today = new Date().toISOString();

  // Enrich each trek with cover image, upcoming event count, and total bookings
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

        // Upcoming events count
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

  return NextResponse.json({ treks: enriched });
}
