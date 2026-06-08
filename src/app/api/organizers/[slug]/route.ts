/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── GET /api/organizers/:slug — Get organizer public profile ─────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    const supabase = createAdminClient();

    // Public profile — exclude sensitive fields (bank details, commission rate)
    const { data: organizer, error } = await (supabase as any)
      .from("organizers")
      .select("id, profile_id, org_name, slug, description, logo_url, phone, email, is_verified, avg_rating, total_reviews, status, created_at")
      .eq("slug", slug)
      .eq("status", "active")
      .single();

    if (error || !organizer) {
      return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
    }

    // Fetch published treks with their cover images
    const { data: treks, error: treksError } = await (supabase as any)
      .from("treks")
      .select(`
        id,
        title,
        slug,
        difficulty,
        duration_days,
        distance_km,
        region,
        is_child_friendly,
        default_adult_price,
        trek_images (
          image_url,
          is_cover,
          sort_order
        )
      `)
      .eq("organizer_id", organizer.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (treksError) {
      console.error("[GET /api/organizers/:slug] Treks fetch error:", treksError.message);
    }

    return NextResponse.json({
      organizer: {
        ...organizer,
        treks: treks ?? [],
      },
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
    });
  } catch (err) {
    console.error("[GET /api/organizers/:slug] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
