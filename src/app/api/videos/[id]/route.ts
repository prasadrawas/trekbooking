import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { VideoRepository } from "@/lib/repositories";

const YOUTUBE_URL_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{11}([&?][\w=&-]*)?$/;

function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_URL_REGEX.test(url);
}

// PUT /api/videos/:id — Update video (auth: owner)
export const PUT = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const { supabase, user } = await requireAuth();
  const repo = new VideoRepository(supabase);

  const body = await request.json();
  const { youtube_url, trek_id, title } = body;

  if (youtube_url !== undefined && !isValidYouTubeUrl(youtube_url)) {
    return jsonError("Invalid YouTube URL", 422);
  }

  if (trek_id) {
    const trek = await repo.findTrekById(trek_id);
    if (!trek) return jsonError("Trek not found", 404);
  }

  const updates: Record<string, unknown> = {};
  if (youtube_url !== undefined) updates.youtube_url = youtube_url;
  if (trek_id !== undefined) updates.trek_id = trek_id;
  if (title !== undefined) updates.title = title;

  if (Object.keys(updates).length === 0) {
    return jsonError("No updatable fields provided", 400);
  }

  const video = await repo.update(id, user.id, updates);
  if (!video) return jsonError("Video not found or forbidden", 404);

  return jsonOk({ video });
});

// DELETE /api/videos/:id — Delete video (auth: owner)
export const DELETE = withErrorHandling(async (_request, { params }) => {
  const { id } = await params;
  const { supabase, user } = await requireAuth();
  const repo = new VideoRepository(supabase);

  const count = await repo.delete(id, user.id);
  if (count === 0) return jsonError("Video not found or forbidden", 404);

  return jsonOk({ success: true });
});
