import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { VideoRepository } from "@/lib/repositories";

// GET /api/treks/:slug/videos — List videos for trek (public)
export const GET = withErrorHandling(async (_request, { params }) => {
  const { slug } = await params;
  const adminClient = createAdminClient();
  const repo = new VideoRepository(adminClient);

  const trek = await repo.findTrekIdBySlug(slug);
  if (!trek) return jsonError("Trek not found", 404);

  const videos = await repo.findByTrekId(trek.id);
  return jsonOk({ videos }, 200, {
    "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
  });
});
