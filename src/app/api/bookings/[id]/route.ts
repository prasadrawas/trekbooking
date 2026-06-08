import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { createBookingService } from "@/lib/services";

// ─── GET /api/bookings/:id ──────────────────────────────────────────────────

export const GET = withErrorHandling(async (_request, { params }) => {
  const { id } = await params;
  const { supabase, user } = await requireAuth();
  const service = createBookingService(supabase);
  const booking = await service.getBookingDetail(user.id, id);
  return jsonOk({ booking });
});

// ─── PUT /api/bookings/:id ──────────────────────────────────────────────────

export const PUT = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const { supabase, user } = await requireAuth();
  const body = await request.json();

  if (body.action !== "cancel") {
    return jsonError(`Unknown action '${body.action}'. Supported: cancel`, 400);
  }

  const service = createBookingService(supabase);
  const result = await service.cancelBooking(user.id, id, body.reason);
  return jsonOk(result);
});
