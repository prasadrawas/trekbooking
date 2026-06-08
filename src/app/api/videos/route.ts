import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { VideoRepository } from "@/lib/repositories";

const YOUTUBE_URL_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{11}([&?][\w=&-]*)?$/;

function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_URL_REGEX.test(url);
}

// GET /api/videos — List videos for current user (auth: trekker)
export const GET = withErrorHandling(async () => {
  const { supabase, user } = await requireAuth();
  const repo = new VideoRepository(supabase);
  const videos = await repo.findByTrekkerId(user.id);
  return jsonOk({ videos });
});

// POST /api/videos — Add video (auth: trekker)
export const POST = withErrorHandling(async (request) => {
  const { supabase, user } = await requireAuth();
  const repo = new VideoRepository(supabase);

  const body = await request.json();
  const { youtube_url, trek_id, title } = body;

  if (!youtube_url) return jsonError("youtube_url is required", 400);
  if (!isValidYouTubeUrl(youtube_url)) return jsonError("Invalid YouTube URL", 422);

  // If trek_id provided, verify it exists
  if (trek_id) {
    const trek = await repo.findTrekById(trek_id);
    if (!trek) return jsonError("Trek not found", 404);
  }

  const video = await repo.create({
    trekker_id: user.id,
    youtube_url,
    trek_id: trek_id ?? null,
    title: title ?? null,
  });

  return jsonOk({ video }, 201);
});
