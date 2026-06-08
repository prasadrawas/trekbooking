import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { PickupPointRepository } from "@/lib/repositories";
import { createClient } from "@/lib/supabase/server";

// GET /api/treks/:slug/events/:eventId/pickup-points — List pickup points (public)
export const GET = withErrorHandling(async (_request, { params }) => {
  const { slug, eventId } = await params;
  const supabase = await createClient();
  const repo = new PickupPointRepository(supabase);

  const trek = await repo.findTrekIdBySlug(slug);
  if (!trek) return jsonError("Trek not found", 404);

  const event = await repo.findEventById(eventId, trek.id);
  if (!event) return jsonError("Event not found", 404);

  const pickupPoints = await repo.findByEventId(eventId);
  return jsonOk({ pickup_points: pickupPoints });
});

// POST /api/treks/:slug/events/:eventId/pickup-points — Add pickup point (auth: owner)
export const POST = withErrorHandling(async (request, { params }) => {
  const { slug, eventId } = await params;
  const { supabase, user } = await requireAuth();
  const repo = new PickupPointRepository(supabase);

  const owned = await repo.verifyTrekOwnership(slug, user.id);
  if (!owned) return jsonError("Forbidden", 403);

  const event = await repo.findEventById(eventId, owned.id);
  if (!event) return jsonError("Event not found", 404);

  const body = await request.json();
  const { label, pickup_time } = body;

  if (!label) return jsonError("label is required", 400);
  if (!pickup_time) return jsonError("pickup_time is required", 400);

  const pickupPoint = await repo.create({
    trek_event_id: eventId,
    label,
    address: body.address ?? null,
    pickup_time,
    maps_url: body.maps_url ?? null,
    extra_charge: body.extra_charge ?? 0,
    sort_order: body.sort_order ?? 0,
  });

  return jsonOk({ pickup_point: pickupPoint }, 201);
});
