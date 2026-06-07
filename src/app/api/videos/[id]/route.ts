/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── YouTube URL validation ───────────────────────────────────────────────────

const YOUTUBE_URL_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{11}([&?][\w=&-]*)?$/;

function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_URL_REGEX.test(url);
}

// ─── PUT /api/videos/:id — Update video (auth: owner) ────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch video to verify ownership
    const { data: existing, error: fetchError } = await (supabase as any)
      .from("trekker_videos")
      .select("id, trekker_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const existingVideo = existing as { id: string; trekker_id: string };
    if (existingVideo.trekker_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { youtube_url, trek_id, title } = body as {
      youtube_url?: string;
      trek_id?: string | null;
      title?: string | null;
    };

    if (youtube_url !== undefined && !isValidYouTubeUrl(youtube_url)) {
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

    const updates: Record<string, unknown> = {};
    if (youtube_url !== undefined) updates.youtube_url = youtube_url;
    if (trek_id !== undefined) updates.trek_id = trek_id;
    if (title !== undefined) updates.title = title;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const { data: video, error: updateError } = await (supabase as any)
      .from("trekker_videos")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      console.error("[PUT /api/videos/:id] Update error:", updateError.message);
      return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
    }

    return NextResponse.json({ video });
  } catch (err) {
    console.error("[PUT /api/videos/:id] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/videos/:id — Delete video (auth: owner) ─────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch video to verify ownership
    const { data: existing, error: fetchError } = await (supabase as any)
      .from("trekker_videos")
      .select("id, trekker_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const existingVideo = existing as { id: string; trekker_id: string };
    if (existingVideo.trekker_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: deleteError } = await (supabase as any)
      .from("trekker_videos")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[DELETE /api/videos/:id] Delete error:", deleteError.message);
      return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/videos/:id] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
