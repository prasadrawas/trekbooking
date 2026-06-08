import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { ReviewRepository } from "@/lib/repositories";

// PUT /api/reviews/:id — Update review (auth: owner)
export const PUT = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const { supabase, user } = await requireAuth();
  const repo = new ReviewRepository(supabase);

  const body = await request.json();
  const { rating, comment } = body;

  if (rating !== undefined) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return jsonError("rating must be an integer between 1 and 5", 400);
    }
  }

  const updates: Record<string, unknown> = {};
  if (rating !== undefined) updates.rating = rating;
  if (comment !== undefined) updates.comment = comment;

  if (Object.keys(updates).length === 0) {
    return jsonError("No updatable fields provided", 400);
  }

  const updated = await repo.update(id, user.id, updates);
  if (!updated) return jsonError("Review not found or forbidden", 404);

  return jsonOk({ review: updated });
});

// DELETE /api/reviews/:id — Delete review (auth: owner)
export const DELETE = withErrorHandling(async (_request, { params }) => {
  const { id } = await params;
  const { supabase, user } = await requireAuth();
  const repo = new ReviewRepository(supabase);

  const count = await repo.delete(id, user.id);
  if (count === 0) return jsonError("Review not found or forbidden", 404);

  return jsonOk({ success: true });
});
