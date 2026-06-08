import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";
import { TrekRepository, TrekEventRepository } from "@/lib/repositories";

// GET /api/treks/:slug/events — List events for a trek
// Public: only upcoming events; owner: all events
export const GET = withErrorHandling(async (_request, { params }) => {
  const { slug } = await params;
  const supabase = await createClient();
  const trekRepo = new TrekRepository(supabase);
  const eventRepo = new TrekEventRepository(supabase);

  const trek = await trekRepo.resolveBySlugOrId(slug);
  if (!trek) return jsonError("Trek not found", 404);

  // Check if current user is the trek owner
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user && trek.organizers?.profile_id === user.id;

  const events = isOwner
    ? await eventRepo.findByTrekId(trek.id)
    : await eventRepo.findUpcoming(trek.id);

  const cacheHeaders = !isOwner
    ? { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" }
    : undefined;

  return jsonOk({ events }, 200, cacheHeaders);
});

// POST /api/treks/:slug/events — Create event (auth: owner organizer)
export const POST = withErrorHandling(async (request, { params }) => {
  const { slug } = await params;
  const { supabase, user } = await requireAuth();
  const trekRepo = new TrekRepository(supabase);

  const owned = await trekRepo.verifyOwnership(slug, user.id);
  if (!owned) return jsonError("Forbidden", 403);

  const body = await request.json();
  const { event_date, end_date, reporting_time, price, child_price, total_seats } = body;

  if (!event_date || price == null || !total_seats) {
    return jsonError("event_date, price, and total_seats are required", 400);
  }

  const eventRepo = new TrekEventRepository(supabase);
  const event = await eventRepo.create({
    trek_id: owned.id,
    event_date,
    end_date: end_date ?? null,
    reporting_time: reporting_time ?? null,
    price,
    child_price: child_price ?? null,
    total_seats,
    booked_seats: 0,
    status: "upcoming",
  });

  return jsonOk({ event }, 201);
});
