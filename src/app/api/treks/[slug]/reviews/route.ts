import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/treks/:slug/reviews — List reviews for trek (public)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  // Resolve trek by slug
  const { data: trek } = await (supabase as any)
    .from("treks")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!trek) {
    return NextResponse.json({ error: "Trek not found" }, { status: 404 });
  }

  const { data: reviews, error } = await (supabase as any)
    .from("reviews")
    .select(
      `
      id, rating, comment, created_at,
      profiles(id, full_name, avatar_url)
    `
    )
    .eq("trek_id", trek.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = reviews ?? [];

  const totalReviews = list.length;
  const avgRating =
    totalReviews > 0
      ? list.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) /
        totalReviews
      : null;

  return NextResponse.json({
    reviews: list,
    avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
    totalReviews,
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
