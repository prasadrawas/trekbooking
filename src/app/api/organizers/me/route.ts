/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── GET /api/organizers/me — Get current user's organizer profile (auth) ────

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: organizer, error } = await (supabase as any)
      .from("organizers")
      .select("id, profile_id, org_name, slug, description, phone, email, logo_url, is_verified, avg_rating, bank_account_name, bank_account_number, bank_ifsc, default_cancellation_rules, created_at, updated_at")
      .eq("profile_id", user.id)
      .single();

    if (error || !organizer) {
      return NextResponse.json({ error: "Organizer profile not found" }, { status: 404 });
    }

    return NextResponse.json({ organizer });
  } catch (err) {
    console.error("[GET /api/organizers/me] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT /api/organizers/me — Update organizer profile (auth) ─────────────────

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify organizer exists and belongs to the user
    const { data: existing, error: fetchError } = await (supabase as any)
      .from("organizers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Organizer profile not found" }, { status: 404 });
    }

    const body = await request.json();

    // Allowlist of updatable fields
    const allowedFields = [
      "org_name",
      "description",
      "phone",
      "email",
      "bank_account_name",
      "bank_account_number",
      "bank_ifsc",
      "logo_url",
      "default_cancellation_rules",
    ] as const;

    type AllowedField = (typeof allowedFields)[number];

    const updates: Partial<Record<AllowedField, unknown>> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const { data: organizer, error: updateError } = await (supabase as any)
      .from("organizers")
      .update({ ...updates })
      .eq("profile_id", user.id)
      .select("id, profile_id, org_name, slug, description, phone, email, logo_url, is_verified, avg_rating, bank_account_name, bank_account_number, bank_ifsc, default_cancellation_rules, created_at, updated_at")
      .single();

    if (updateError) {
      console.error("[PUT /api/organizers/me] Update error:", updateError.message);
      return NextResponse.json({ error: "Failed to update organizer profile" }, { status: 500 });
    }

    return NextResponse.json({ organizer });
  } catch (err) {
    console.error("[PUT /api/organizers/me] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
