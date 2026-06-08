import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrganizerRepository } from "@/lib/repositories";

// GET /api/organizers/:slug — Get organizer public profile
export const GET = withErrorHandling(async (_request, { params }) => {
  const { slug } = await params;
  const adminClient = createAdminClient();
  const repo = new OrganizerRepository(adminClient);

  const organizer = await repo.findBySlug(slug);
  if (!organizer) return jsonError("Organizer not found", 404);

  const treks = await repo.findPublishedTreks(organizer.id);

  return jsonOk(
    { organizer: { ...organizer, treks } },
    200,
    { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
  );
});
