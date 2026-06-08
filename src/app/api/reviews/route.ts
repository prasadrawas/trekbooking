import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { ReviewRepository } from "@/lib/repositories";

// GET /api/reviews — List reviews for current user (auth: trekker)
export const GET = withErrorHandling(async () => {
  const { supabase, user } = await requireAuth();
  const repo = new ReviewRepository(supabase);
  const reviews = await repo.findByTrekkerId(user.id);
  return jsonOk({ reviews });
});

// POST /api/reviews — Create review (auth: trekker)
export const POST = withErrorHandling(async (request) => {
  const { supabase, user } = await requireAuth();
  const repo = new ReviewRepository(supabase);

  const body = await request.json();
  const { booking_id, rating, comment } = body;

  if (!booking_id || rating === undefined) {
    return jsonError("booking_id and rating are required", 400);
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return jsonError("rating must be an integer between 1 and 5", 400);
  }

  // Validate booking belongs to user and is completed
  const booking = await repo.findBookingForReview(booking_id);
  if (!booking) return jsonError("Booking not found", 404);
  if (booking.trekker_id !== user.id) return jsonError("Forbidden", 403);
  if (booking.status !== "completed") {
    return jsonError("Reviews can only be submitted for completed bookings", 422);
  }

  // Check no existing review for this booking
  const existing = await repo.findByBookingId(booking_id);
  if (existing) return jsonError("A review already exists for this booking", 409);

  const trekId = booking.trek_events?.trek_id ?? null;
  const review = await repo.create({
    trekker_id: user.id,
    booking_id,
    trek_id: trekId,
    rating,
    comment: comment ?? null,
  });

  return jsonOk({ review }, 201);
});
