import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { OrganizerRepository } from "@/lib/repositories";

// GET /api/organizers/me — Get current user's organizer profile (auth)
export const GET = withErrorHandling(async () => {
  const { supabase, user } = await requireAuth();
  const repo = new OrganizerRepository(supabase);

  const organizer = await repo.findByProfileId(user.id);
  if (!organizer) return jsonError("Organizer profile not found", 404);

  return jsonOk({ organizer });
});

// PUT /api/organizers/me — Update organizer profile (auth)
export const PUT = withErrorHandling(async (request) => {
  const { supabase, user } = await requireAuth();
  const repo = new OrganizerRepository(supabase);

  // Verify organizer exists
  const existing = await repo.findIdByProfileId(user.id);
  if (!existing) return jsonError("Organizer profile not found", 404);

  const body = await request.json();

  const allowedFields = [
    "org_name", "description", "phone", "email",
    "bank_account_name", "bank_account_number", "bank_ifsc",
    "logo_url", "default_cancellation_rules",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("No updatable fields provided", 400);
  }

  const organizer = await repo.update(user.id, updates);
  return jsonOk({ organizer });
});
