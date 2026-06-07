import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/treks/:slug/videos — List videos for trek (public)
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

  const { data: videos, error } = await (supabase as any)
    .from("trekker_videos")
    .select("id, title, youtube_url, sort_order, created_at")
    .eq("trek_id", trek.id)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ videos: videos ?? [] });
}
