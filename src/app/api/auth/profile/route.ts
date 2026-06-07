/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── GET /api/auth/profile — Get current user profile (auth) ─────────────────

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profileRaw, error: profileError } = await (supabase as any)
      .from("profiles")
      .select("id, role, full_name, phone, avatar_url, city, youtube_channel_url")
      .eq("id", user.id)
      .single();

    if (profileError || !profileRaw) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = profileRaw as {
      id: string;
      role: string;
      full_name: string | null;
      phone: string | null;
      avatar_url: string | null;
      city: string | null;
      youtube_channel_url: string | null;
    };

    return NextResponse.json({
      user: {
        id: profile.id,
        email: user.email,
        role: profile.role,
        full_name: profile.full_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        city: profile.city,
        youtube_channel_url: profile.youtube_channel_url,
      },
    });
  } catch (err) {
    console.error("[GET /api/auth/profile] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT /api/auth/profile — Update profile (auth) ───────────────────────────

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify profile exists
    const { data: existing, error: fetchError } = await (supabase as any)
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { full_name, phone, city, avatar_url, youtube_channel_url } = body as {
      full_name?: string;
      phone?: string;
      city?: string;
      avatar_url?: string;
      youtube_channel_url?: string;
    };

    const allowedFields = ["full_name", "phone", "city", "avatar_url", "youtube_channel_url"] as const;
    type AllowedField = (typeof allowedFields)[number];
    const input: Partial<Record<AllowedField, unknown>> = {
      full_name,
      phone,
      city,
      avatar_url,
      youtube_channel_url,
    };

    const updates: Partial<Record<AllowedField, unknown>> = {};
    for (const field of allowedFields) {
      if (input[field] !== undefined) {
        updates[field] = input[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const { data: updatedRaw, error: updateError } = await (supabase as any)
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("id, role, full_name, phone, avatar_url, city, youtube_channel_url")
      .single();

    if (updateError) {
      console.error("[PUT /api/auth/profile] Update error:", updateError.message);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    const updated = updatedRaw as {
      id: string;
      role: string;
      full_name: string | null;
      phone: string | null;
      avatar_url: string | null;
      city: string | null;
      youtube_channel_url: string | null;
    };

    return NextResponse.json({
      user: {
        id: updated.id,
        email: user.email,
        role: updated.role,
        full_name: updated.full_name,
        phone: updated.phone,
        avatar_url: updated.avatar_url,
        city: updated.city,
        youtube_channel_url: updated.youtube_channel_url,
      },
    });
  } catch (err) {
    console.error("[PUT /api/auth/profile] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
