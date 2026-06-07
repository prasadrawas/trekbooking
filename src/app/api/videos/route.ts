/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── YouTube URL validation ───────────────────────────────────────────────────

const YOUTUBE_URL_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{11}([&?][\w=&-]*)?$/;

function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_URL_REGEX.test(url);
}

// ─── GET /api/videos — List videos for current user (auth: trekker) ──────────

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: videos, error } = await (supabase as any)
      .from("trekker_videos")
      .select(`
        id,
        youtube_url,
        title,
        sort_order,
        is_published,
        created_at,
        treks (
          id,
          title,
          slug
        )
      `)
      .eq("trekker_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/videos] DB error:", error.message);
      return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
    }

    return NextResponse.json({ videos: videos ?? [] });
  } catch (err) {
    console.error("[GET /api/videos] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/videos — Add video (auth: trekker) ─────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { youtube_url, trek_id, title } = body as {
      youtube_url: string;
      trek_id?: string;
      title?: string;
    };

    if (!youtube_url) {
      return NextResponse.json({ error: "youtube_url is required" }, { status: 400 });
    }

    if (!isValidYouTubeUrl(youtube_url)) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 422 });
    }

    // If trek_id provided, verify it exists
    if (trek_id) {
      const { data: trek, error: trekError } = await (supabase as any)
        .from("treks")
        .select("id")
        .eq("id", trek_id)
        .single();

      if (trekError || !trek) {
        return NextResponse.json({ error: "Trek not found" }, { status: 404 });
      }
    }

    const { data: video, error: insertError } = await (supabase as any)
      .from("trekker_videos")
      .insert({
        trekker_id: user.id,
        youtube_url,
        trek_id: trek_id ?? null,
        title: title ?? null,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("[POST /api/videos] Insert error:", insertError.message);
      return NextResponse.json({ error: "Failed to add video" }, { status: 500 });
    }

    return NextResponse.json({ video }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/videos] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
