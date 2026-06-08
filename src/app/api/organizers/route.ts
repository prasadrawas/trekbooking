/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

// ─── GET /api/organizers — List active organizers (public) ───────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    // Public list — use admin client (bypasses RLS) but select only safe fields
    const supabase = createAdminClient();

    const { data: organizers, error, count } = await (supabase as any)
      .from("organizers")
      .select("id, org_name, slug, description, logo_url, is_verified, avg_rating, total_reviews, status, created_at", { count: "exact" })
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[GET /api/organizers] DB error:", error.message);
      return NextResponse.json({ error: "Failed to fetch organizers" }, { status: 500 });
    }

    return NextResponse.json({ organizers: organizers ?? [], total: count ?? 0 });
  } catch (err) {
    console.error("[GET /api/organizers] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/organizers — Create organizer profile (auth: role=organizer) ──

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has organizer role
    const { data: profileRaw, error: profileError } = await (supabase as any)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profileRaw) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = profileRaw as { role: string };
    if (profile.role !== "organizer") {
      return NextResponse.json({ error: "Forbidden: organizer role required" }, { status: 403 });
    }

    // Check if organizer profile already exists
    const { data: existing } = await (supabase as any)
      .from("organizers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Organizer profile already exists" }, { status: 409 });
    }

    const body = await request.json();
    const { org_name, phone, email, description } = body as {
      org_name: string;
      phone: string;
      email: string;
      description?: string;
    };

    if (!org_name || !phone || !email) {
      return NextResponse.json({ error: "org_name, phone, and email are required" }, { status: 400 });
    }

    // Auto-generate unique slug — single query to find all conflicts
    const baseSlug = slugify(org_name);
    const { data: slugRows } = await (supabase as any)
      .from("organizers")
      .select("slug")
      .like("slug", `${baseSlug}%`);

    const takenSlugs = new Set<string>((slugRows ?? []).map((r: { slug: string }) => r.slug));
    let slug = baseSlug;
    let attempt = 0;
    while (takenSlugs.has(slug)) {
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    // free_period_ends_at = now + 90 days
    const freePeriodEndsAt = new Date();
    freePeriodEndsAt.setDate(freePeriodEndsAt.getDate() + 90);

    const { data: organizer, error: insertError } = await (supabase as any)
      .from("organizers")
      .insert({
        profile_id: user.id,
        org_name,
        slug,
        phone,
        email,
        description: description ?? null,
        status: "active",
        free_period_ends_at: freePeriodEndsAt.toISOString(),
      })
      .select("id, slug")
      .single();

    if (insertError) {
      console.error("[POST /api/organizers] Insert error:", insertError.message);
      return NextResponse.json({ error: "Failed to create organizer profile" }, { status: 500 });
    }

    return NextResponse.json({ organizer }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/organizers] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
