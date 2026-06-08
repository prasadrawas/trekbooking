import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { OrganizerRepository, ReviewRepository } from "@/lib/repositories";

// GET /api/organizers/me/reviews — List reviews for organizer's treks
export const GET = withErrorHandling(async (request) => {
  const { supabase, user } = await requireAuth();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const orgRepo = new OrganizerRepository(supabase);
  const org = await orgRepo.findReviewsSummary(user.id);
  if (!org) return jsonError("Organizer not found", 404);

  const trekIds = await orgRepo.findTrekIds(org.id);

  if (trekIds.length === 0) {
    return jsonOk({
      reviews: [],
      breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      avgRating: 0,
      totalReviews: 0,
    });
  }

  const reviewRepo = new ReviewRepository(supabase);
  const reviewRows = await reviewRepo.findByTrekIds(trekIds, { offset, limit });

  const reviews = (reviewRows as any[]).map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    trekker_name: r.bookings?.booking_name ?? null,
    trek_title: r.bookings?.trek_events?.treks?.title ?? null,
  }));

  // Rating breakdown per star (1-5)
  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const star = Math.round(r.rating);
    if (star >= 1 && star <= 5) breakdown[star] = (breakdown[star] ?? 0) + 1;
  }

  return jsonOk({
    reviews,
    breakdown,
    avgRating: org.avg_rating ?? 0,
    totalReviews: org.total_reviews ?? 0,
    page,
    limit,
  });
});
