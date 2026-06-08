import { requireOrganizer } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTrekService } from "@/lib/services";
import { TrekRepository } from "@/lib/repositories";

// GET /api/treks — List published treks (public)
export const GET = withErrorHandling(async (request) => {
  const adminClient = createAdminClient();
  const service = createTrekService(adminClient);
  const { searchParams } = new URL(request.url);

  const regions = searchParams.getAll("region");
  const difficulties = searchParams.getAll("difficulty");
  const durations = searchParams.getAll("duration");
  const childFriendly = searchParams.get("childFriendly") || searchParams.get("child_friendly");
  const search = searchParams.get("q");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "12", 10);
  const sort = searchParams.get("sort") ?? "created_at";

  const result = await service.getPublishedTreks(
    {
      regions: regions.length > 0 ? regions : undefined,
      difficulties: difficulties.length > 0 ? difficulties : undefined,
      durations: durations.length > 0 ? durations.map((d) => parseInt(d, 10)) : undefined,
      childFriendly: childFriendly === "true" ? true : undefined,
      search: search ?? undefined,
    },
    sort,
    page,
    limit,
  );

  return jsonOk(result, 200, {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  });
});

// POST /api/treks — Create trek (auth: organizer)
export const POST = withErrorHandling(async (request) => {
  const { supabase, organizerId } = await requireOrganizer();
  const service = createTrekService(supabase);

  const body = await request.json();
  if (!body.title) return jsonError("title is required", 400);

  const trek = await service.createTrek(organizerId, body);
  return jsonOk({ trek }, 201);
});
