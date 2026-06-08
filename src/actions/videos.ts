"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { VideoRepository } from "@/lib/repositories";
import type { TrekkerVideo } from "@/types/database";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract YouTube video ID from various YouTube URL formats.
 */
function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("?")[0] || null;
    }
    if (parsed.hostname === "www.youtube.com" || parsed.hostname === "youtube.com") {
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/shorts/")[1]?.split("?")[0] || null;
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/embed/")[1]?.split("?")[0] || null;
      }
      return parsed.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}

// ─── addVideo ─────────────────────────────────────────────────────────────────

export interface AddVideoData {
  youtube_url: string;
  trek_id?: string;
  title?: string;
}

export async function addVideo(
  data: AddVideoData,
): Promise<{ success: true; videoId: string } | { error: string }> {
  try {
    const { supabase, user } = await requireAuth();
    const videoRepo = new VideoRepository(supabase);

    if (!data.youtube_url?.trim()) return { error: "YouTube URL is required." };

    const youtubeId = extractYouTubeId(data.youtube_url.trim());
    if (!youtubeId) return { error: "Invalid YouTube URL. Please provide a valid YouTube link." };

    if (!data.trek_id) return { error: "Trek ID is required." };

    // Verify user has a completed booking for this trek
    const { data: bookingRaw } = await (supabase as any)
      .from("bookings")
      .select("id, trek_events!inner(trek_id)")
      .eq("trekker_id", user.id)
      .eq("status", "completed")
      .eq("trek_events.trek_id", data.trek_id)
      .limit(1)
      .single();

    if (!bookingRaw) {
      return { error: "You must have completed this trek to add a video." };
    }

    const video = await videoRepo.create({
      trekker_id: user.id,
      youtube_url: data.youtube_url.trim(),
      trek_id: data.trek_id,
      title: data.title?.trim() ?? null,
    });

    return { success: true, videoId: (video as any).id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to add video." };
  }
}

// ─── updateVideo ──────────────────────────────────────────────────────────────

export interface UpdateVideoData {
  youtube_url?: string;
  title?: string;
}

export async function updateVideo(
  videoId: string,
  data: UpdateVideoData,
): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, user } = await requireAuth();
    const videoRepo = new VideoRepository(supabase);

    const updates: Record<string, unknown> = {};

    if (data.youtube_url !== undefined) {
      const youtubeId = extractYouTubeId(data.youtube_url.trim());
      if (!youtubeId) return { error: "Invalid YouTube URL." };
      updates.youtube_url = data.youtube_url.trim();
      updates.is_published = false; // reset approval on URL change
    }

    if (data.title !== undefined) {
      updates.title = data.title.trim() || null;
    }

    if (Object.keys(updates).length === 0) return { error: "No fields to update." };

    await videoRepo.update(videoId, user.id, updates);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update video." };
  }
}

// ─── deleteVideo ──────────────────────────────────────────────────────────────

export async function deleteVideo(
  videoId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, user } = await requireAuth();
    const videoRepo = new VideoRepository(supabase);

    await videoRepo.delete(videoId, user.id);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete video." };
  }
}

// ─── getTrekkerVideos ─────────────────────────────────────────────────────────

export interface TrekkerVideoItem extends TrekkerVideo {
  trek_title: string;
  trek_slug: string;
}

export async function getTrekkerVideos(): Promise<{
  data: TrekkerVideoItem[];
  error?: string;
}> {
  try {
    const { supabase, user } = await requireAuth();
    const videoRepo = new VideoRepository(supabase);

    const data = await videoRepo.findByTrekkerId(user.id);

    const result: TrekkerVideoItem[] = (data as any[]).map((v: any) => {
      const trek = Array.isArray(v.treks) ? v.treks[0] : v.treks;
      return {
        ...v,
        trek_title: trek?.title ?? "",
        trek_slug: trek?.slug ?? "",
      } as TrekkerVideoItem;
    });

    return { data: result };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch videos.",
    };
  }
}

// ─── getVideosByTrek ──────────────────────────────────────────────────────────

export interface PublicVideoItem extends TrekkerVideo {
  user_name: string | null;
}

export async function getVideosByTrek(trekId: string): Promise<{
  data: PublicVideoItem[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const videoRepo = new VideoRepository(supabase);

    const data = await videoRepo.findByTrekId(trekId);

    // The repo returns published videos but without user names,
    // so we need a slightly different query for the public view
    const { data: publicData } = await (supabase as any)
      .from("trekker_videos")
      .select("*, profiles(full_name)")
      .eq("trek_id", trekId)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    const result: PublicVideoItem[] = ((publicData as any[]) ?? []).map((v: any) => {
      const profile = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles;
      return {
        ...v,
        user_name: profile?.full_name ?? null,
      } as PublicVideoItem;
    });

    return { data: result };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch videos.",
    };
  }
}
