/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── GET /api/payouts — List payouts (auth: organizer or admin) ───────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user profile role
    const { data: profileRaw, error: profileError } = await (supabase as any)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profileRaw) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = profileRaw as { role: string };
    const isAdmin = profile.role === "admin";
    const isOrganizer = profile.role === "organizer";

    if (!isAdmin && !isOrganizer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = (supabase as any)
      .from("payouts")
      .select(`
        id,
        total_collected,
        commission,
        payout_amount,
        status,
        paid_at,
        reference_id,
        created_at,
        organizers (
          id,
          org_name,
          slug
        ),
        trek_events (
          id,
          event_date,
          treks (
            id,
            title,
            slug
          )
        )
      `, { count: "exact" });

    // Scope to organizer's own payouts unless admin
    if (isOrganizer) {
      const { data: organizerRaw } = await (supabase as any)
        .from("organizers")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!organizerRaw) {
        return NextResponse.json({ error: "Organizer profile not found" }, { status: 404 });
      }

      const org = organizerRaw as { id: string };
      query = query.eq("organizer_id", org.id);
    }

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data: payouts, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[GET /api/payouts] DB error:", error.message);
      return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
    }

    // Compute summary totals
    let summaryQuery = (supabase as any)
      .from("payouts")
      .select("payout_amount, status");

    if (isOrganizer) {
      const { data: organizerRaw } = await (supabase as any)
        .from("organizers")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (organizerRaw) {
        const org = organizerRaw as { id: string };
        summaryQuery = summaryQuery.eq("organizer_id", org.id);
      }
    }

    const { data: allPayouts } = await summaryQuery;
    const allRows = (allPayouts ?? []) as { payout_amount: number; status: string }[];

    const totalEarned = allRows
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + (p.payout_amount ?? 0), 0);

    const pendingAmount = allRows
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + (p.payout_amount ?? 0), 0);

    return NextResponse.json({
      payouts: payouts ?? [],
      total: count ?? 0,
      summary: { totalEarned, pendingAmount },
    });
  } catch (err) {
    console.error("[GET /api/payouts] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
