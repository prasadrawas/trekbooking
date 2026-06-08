import { requireAuth, getUserRole } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { createBookingService } from "@/lib/services";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Auto-complete bookings where trek date has passed ───────────────────────
// Throttled: runs at most once every 5 minutes to avoid performance tax

let lastAutoCompleteRun = 0;
const AUTO_COMPLETE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function autoCompleteBookings() {
  const now = Date.now();
  if (now - lastAutoCompleteRun < AUTO_COMPLETE_INTERVAL_MS) return;
  lastAutoCompleteRun = now;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const today = new Date().toISOString().split("T")[0];

  const { data: pastEvents } = await admin
    .from("trek_events")
    .select("id")
    .lt("event_date", today)
    .in("status", ["upcoming", "full"])
    .limit(500);

  if (!pastEvents || pastEvents.length === 0) return;

  const pastEventIds = pastEvents.map((e: { id: string }) => e.id);

  await admin
    .from("bookings")
    .update({ status: "completed" })
    .in("trek_event_id", pastEventIds)
    .eq("status", "confirmed");

  await admin
    .from("trek_events")
    .update({ status: "completed" })
    .in("id", pastEventIds)
    .in("status", ["upcoming", "full"]);
}

// ─── GET /api/bookings ──────────────────────────────────────────────────────

export const GET = withErrorHandling(async (request) => {
  const { supabase, user } = await requireAuth();

  // Auto-complete past bookings (throttled, fire-and-forget)
  autoCompleteBookings().catch(() => {});

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const trekEventId = searchParams.get("trek_event_id");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const role = getUserRole(user);
  const service = createBookingService(supabase);
  const filters = { status, trekEventId, page, limit };

  if (role === "organizer") {
    // Look up organizer record ID for this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orgRaw } = await (supabase as any)
      .from("organizers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!orgRaw) {
      return jsonError("Organizer profile not found", 404);
    }

    const { data, count } = await service.getOrganizerBookings(
      (orgRaw as { id: string }).id,
      filters,
    );
    return jsonOk({ bookings: data, total: count, page });
  }

  const { data, count } = await service.getTrekkerBookings(user.id, filters);
  return jsonOk({ bookings: data, total: count, page });
});

// ─── POST /api/bookings ─────────────────────────────────────────────────────

export const POST = withErrorHandling(async (request) => {
  const { supabase, user } = await requireAuth();
  const body = await request.json();
  const service = createBookingService(supabase);
  const result = await service.createBooking(user.id, body);
  return jsonOk(result, 201);
});
