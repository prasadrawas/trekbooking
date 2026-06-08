import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { OrganizerRepository } from "@/lib/repositories";

// GET /api/organizers/me/treks — List organizer's own treks
export const GET = withErrorHandling(async () => {
  const { supabase, user } = await requireAuth();
  const repo = new OrganizerRepository(supabase);

  const org = await repo.findIdByProfileId(user.id);
  if (!org) return jsonError("Organizer not found", 404);

  const treks = await repo.findTreksWithDetails(org.id);

  if (!treks || treks.length === 0) {
    return jsonOk({ treks: [] });
  }

  const today = new Date().toISOString();

  type TrekImageRow = { image_url: string; is_cover: boolean };
  type TrekEventRow = { id: string; event_date: string; status: string };
  type TrekRow = {
    id: string; title: string; slug: string; difficulty: string;
    is_published: boolean; created_at: string;
    trek_images: TrekImageRow[]; trek_events: TrekEventRow[];
  };

  const enriched = (treks as TrekRow[]).map((trek) => {
    const coverImg = trek.trek_images?.find((img) => img.is_cover) ?? trek.trek_images?.[0] ?? null;
    const upcomingEventsCount = (trek.trek_events ?? []).filter(
      (e) => (e.status === "upcoming" || e.status === "full") && e.event_date >= today,
    ).length;

    return {
      id: trek.id,
      title: trek.title,
      slug: trek.slug,
      difficulty: trek.difficulty,
      is_published: trek.is_published,
      created_at: trek.created_at,
      cover_image_url: coverImg?.image_url ?? null,
      upcoming_events_count: upcomingEventsCount,
      total_bookings: 0,
    };
  });

  return jsonOk({ treks: enriched });
});
