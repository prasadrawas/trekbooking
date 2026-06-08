import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk } from "@/lib/api-utils";
import { createDashboardService } from "@/lib/services";

// GET /api/organizers/me/dashboard — Organizer dashboard data
export const GET = withErrorHandling(async () => {
  const { supabase, user } = await requireAuth();
  const service = createDashboardService(supabase);
  const result = await service.getOrganizerDashboard(user.id);
  return jsonOk(result);
});
