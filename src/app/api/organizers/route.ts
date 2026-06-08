import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrganizerRepository, ProfileRepository } from "@/lib/repositories";
import { slugify } from "@/lib/utils";

// GET /api/organizers — List active organizers (public)
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const adminClient = createAdminClient();
  const repo = new OrganizerRepository(adminClient);
  const result = await repo.findActive({ page, limit });

  return jsonOk(result, 200, {
    "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
  });
});

// POST /api/organizers — Create organizer profile (auth: role=organizer)
export const POST = withErrorHandling(async (request) => {
  const { supabase, user } = await requireAuth();

  // Verify user has organizer role
  const profileRepo = new ProfileRepository(supabase);
  const profile = await profileRepo.findRoleById(user.id);
  if (!profile || profile.role !== "organizer") {
    return jsonError("Forbidden: organizer role required", 403);
  }

  const orgRepo = new OrganizerRepository(supabase);

  // Check if organizer profile already exists
  const existing = await orgRepo.findIdByProfileId(user.id);
  if (existing) return jsonError("Organizer profile already exists", 409);

  const body = await request.json();
  const { org_name, phone, email, description } = body;
  if (!org_name || !phone || !email) {
    return jsonError("org_name, phone, and email are required", 400);
  }

  // Auto-generate unique slug
  const baseSlug = slugify(org_name);
  const existingSlugs = await orgRepo.findSlugsByPrefix(baseSlug);
  const takenSlugs = new Set(existingSlugs);
  let slug = baseSlug;
  let attempt = 0;
  while (takenSlugs.has(slug)) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  // free_period_ends_at = now + 90 days
  const freePeriodEndsAt = new Date();
  freePeriodEndsAt.setDate(freePeriodEndsAt.getDate() + 90);

  const organizer = await orgRepo.create({
    profile_id: user.id,
    org_name,
    slug,
    phone,
    email,
    description: description ?? null,
    status: "active",
    free_period_ends_at: freePeriodEndsAt.toISOString(),
  });

  return jsonOk({ organizer }, 201);
});
