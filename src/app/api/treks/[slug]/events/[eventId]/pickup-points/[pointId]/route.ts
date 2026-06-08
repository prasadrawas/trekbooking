import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { PickupPointRepository } from "@/lib/repositories";

// PUT /api/treks/:slug/events/:eventId/pickup-points/:pointId — Update (auth: owner)
export const PUT = withErrorHandling(async (request, { params }) => {
  const { slug, eventId, pointId } = await params;
  const { supabase, user } = await requireAuth();
  const repo = new PickupPointRepository(supabase);

  const owned = await repo.verifyTrekOwnership(slug, user.id);
  if (!owned) return jsonError("Forbidden", 403);

  const event = await repo.findEventById(eventId, owned.id);
  if (!event) return jsonError("Event not found", 404);

  const point = await repo.findById(pointId, eventId);
  if (!point) return jsonError("Pickup point not found", 404);

  const body = await request.json();
  delete body.id;
  delete body.trek_event_id;

  const updatedPoint = await repo.update(pointId, eventId, body);
  return jsonOk({ pickup_point: updatedPoint });
});

// DELETE /api/treks/:slug/events/:eventId/pickup-points/:pointId — Delete (auth: owner)
export const DELETE = withErrorHandling(async (_request, { params }) => {
  const { slug, eventId, pointId } = await params;
  const { supabase, user } = await requireAuth();
  const repo = new PickupPointRepository(supabase);

  const owned = await repo.verifyTrekOwnership(slug, user.id);
  if (!owned) return jsonError("Forbidden", 403);

  const event = await repo.findEventById(eventId, owned.id);
  if (!event) return jsonError("Event not found", 404);

  const point = await repo.findById(pointId, eventId);
  if (!point) return jsonError("Pickup point not found", 404);

  await repo.delete(pointId, eventId);
  return jsonOk({ success: true });
});
