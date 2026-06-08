import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTrekService } from "@/lib/services";
import { TrekRepository } from "@/lib/repositories";

// GET /api/treks/:slug — Get trek detail (public)
export const GET = withErrorHandling(async (_request, { params }) => {
  const { slug } = await params;
  const adminClient = createAdminClient();
  const service = createTrekService(adminClient);

  const trek = await service.getTrekDetail(slug).catch(() => null);
  if (!trek) return jsonError("Trek not found", 404);

  return jsonOk({ trek }, 200, {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  });
});

// PUT /api/treks/:slug — Update trek (auth: owner organizer)
export const PUT = withErrorHandling(async (request, { params }) => {
  const { slug } = await params;
  const { supabase, user } = await requireAuth();
  const repo = new TrekRepository(supabase);

  const owned = await repo.verifyOwnership(slug, user.id);
  if (!owned) return jsonError("Forbidden", 403);

  const body = await request.json();
  const service = createTrekService(supabase);
  const trek = await service.updateTrek(owned.id, body);

  return jsonOk({ trek });
});

// DELETE /api/treks/:slug — Delete trek (auth: owner organizer)
export const DELETE = withErrorHandling(async (_request, { params }) => {
  const { slug } = await params;
  const { supabase, user } = await requireAuth();
  const repo = new TrekRepository(supabase);

  const owned = await repo.verifyOwnership(slug, user.id);
  if (!owned) return jsonError("Forbidden", 403);

  const blockers = await repo.findBlockingEvents(owned.id);
  if (blockers.length > 0) {
    return jsonError(
      "Cannot delete trek: there are upcoming events with existing bookings.",
      409,
    );
  }

  await repo.deleteBySlug(slug);
  return jsonOk({ success: true });
});
