import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { PayoutRepository, ProfileRepository, OrganizerRepository } from "@/lib/repositories";

// GET /api/payouts — List payouts (auth: organizer or admin)
export const GET = withErrorHandling(async (request) => {
  const { supabase, user } = await requireAuth();

  const profileRepo = new ProfileRepository(supabase);
  const profile = await profileRepo.findRoleById(user.id);
  if (!profile) return jsonError("Profile not found", 404);

  const isAdmin = profile.role === "admin";
  const isOrganizer = profile.role === "organizer";
  if (!isAdmin && !isOrganizer) return jsonError("Forbidden", 403);

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;

  let orgId: string | null = null;
  if (isOrganizer) {
    const orgRepo = new OrganizerRepository(supabase);
    const org = await orgRepo.findIdByProfileId(user.id);
    if (!org) return jsonError("Organizer profile not found", 404);
    orgId = org.id;
  }

  const payoutRepo = new PayoutRepository(supabase);
  const { payouts, total } = await payoutRepo.findPaginated({
    organizerId: isOrganizer ? orgId : null,
    status: statusFilter,
    page,
    limit,
  });

  // Compute summary totals
  const summaryRows = await payoutRepo.findSummary(isOrganizer ? orgId : null);
  const totalEarned = summaryRows
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (p.payout_amount ?? 0), 0);
  const pendingAmount = summaryRows
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + (p.payout_amount ?? 0), 0);

  return jsonOk({
    payouts,
    total,
    summary: { totalEarned, pendingAmount },
  });
});
