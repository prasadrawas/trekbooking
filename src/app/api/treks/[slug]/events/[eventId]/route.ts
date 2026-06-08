import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { TrekRepository, TrekEventRepository } from "@/lib/repositories";
import { createClient } from "@/lib/supabase/server";

// GET /api/treks/:slug/events/:eventId — Get event detail with pickup points
export const GET = withErrorHandling(async (_request, { params }) => {
  const { slug, eventId } = await params;
  const supabase = await createClient();
  const trekRepo = new TrekRepository(supabase);

  const trekId = await trekRepo.findIdBySlug(slug);
  if (!trekId) return jsonError("Trek not found", 404);

  const eventRepo = new TrekEventRepository(supabase);
  const event = await eventRepo.findByIdAndTrekId(eventId, trekId);
  if (!event) return jsonError("Event not found", 404);

  return jsonOk({ event });
});

// PUT /api/treks/:slug/events/:eventId — Update event (auth: owner)
export const PUT = withErrorHandling(async (request, { params }) => {
  const { slug, eventId } = await params;
  const { supabase, user } = await requireAuth();
  const trekRepo = new TrekRepository(supabase);

  const owned = await trekRepo.verifyOwnership(slug, user.id);
  if (!owned) return jsonError("Forbidden", 403);

  const body = await request.json();
  delete body.id;
  delete body.trek_id;
  delete body.booked_seats;
  delete body.created_at;

  const eventRepo = new TrekEventRepository(supabase);
  const event = await eventRepo.update(eventId, owned.id, body);
  if (!event) return jsonError("Event not found", 404);

  return jsonOk({ event });
});

// DELETE /api/treks/:slug/events/:eventId — Cancel event (auth: owner)
export const DELETE = withErrorHandling(async (_request, { params }) => {
  const { slug, eventId } = await params;
  const { supabase, user } = await requireAuth();
  const trekRepo = new TrekRepository(supabase);

  const owned = await trekRepo.verifyOwnership(slug, user.id);
  if (!owned) return jsonError("Forbidden", 403);

  const eventRepo = new TrekEventRepository(supabase);
  await eventRepo.delete(eventId, owned.id);

  return jsonOk({ success: true });
});
