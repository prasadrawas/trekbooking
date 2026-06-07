import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = user.user_metadata?.role as string | undefined;

  // Prevent admin self-deletion
  if (role === "admin") {
    return NextResponse.json(
      { error: "Admin accounts cannot be deleted through this endpoint." },
      { status: 403 }
    );
  }

  // If organizer, check for upcoming events with bookings
  if (role === "organizer") {
    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (admin as any)
      .from("organizers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (org) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: treks } = await (admin as any)
        .from("treks")
        .select("id")
        .eq("organizer_id", org.id);

      const trekIds = (treks ?? []).map((t: { id: string }) => t.id);

      if (trekIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count } = await (admin as any)
          .from("trek_events")
          .select("id", { count: "exact", head: true })
          .in("trek_id", trekIds)
          .in("status", ["upcoming", "full"]);

        if (count && count > 0) {
          return NextResponse.json(
            { error: "Cannot delete account with upcoming trek events. Please cancel all upcoming events first." },
            { status: 400 }
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
