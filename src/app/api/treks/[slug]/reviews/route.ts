import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReviewRepository } from "@/lib/repositories";

// GET /api/treks/:slug/reviews — List reviews for trek (public)
export const GET = withErrorHandling(async (_request, { params }) => {
  const { slug } = await params;
  const adminClient = createAdminClient();
  const repo = new ReviewRepository(adminClient);

  const trek = await repo.findTrekIdBySlug(slug);
  if (!trek) return jsonError("Trek not found", 404);

  const reviews = await repo.findByTrekId(trek.id);

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? Math.round(
          (reviews.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) /
            totalReviews) *
            10,
        ) / 10
      : null;

  return jsonOk({ reviews, avgRating, totalReviews }, 200, {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  });
});
