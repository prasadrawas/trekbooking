/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";

export const DELETE = withErrorHandling(async () => {
  const { supabase, user } = await requireAuth();

  const role = user.user_metadata?.role as string | undefined;

  // Prevent admin self-deletion
  if (role === "admin") {
    return jsonError("Admin accounts cannot be deleted through this endpoint.", 403);
  }

  // If organizer, check for upcoming events with bookings
  if (role === "organizer") {
    const admin = createAdminClient();

    const { data: org } = await (admin as any)
      .from("organizers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (org) {
      const { data: treks } = await (admin as any)
        .from("treks")
        .select("id")
        .eq("organizer_id", org.id);

      const trekIds = (treks ?? []).map((t: { id: string }) => t.id);

      if (trekIds.length > 0) {
        const { count } = await (admin as any)
          .from("trek_events")
          .select("id", { count: "exact", head: true })
          .in("trek_id", trekIds)
          .in("status", ["upcoming", "full"]);

        if (count && count > 0) {
          return jsonError(
            "Cannot delete account with upcoming trek events. Please cancel all upcoming events first.",
            400,
          );
        }
      }
    }
  }

  // Sign out first to clear session
  await supabase.auth.signOut();

  // Delete user via admin client (cascades to profiles and all related data)
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonOk({ success: true });
});
