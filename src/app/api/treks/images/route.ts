import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { TrekImageRepository } from "@/lib/repositories";

// POST /api/treks/images — Save trek image records after uploading to storage
export const POST = withErrorHandling(async (request) => {
  const { user, supabase } = await requireAuth();
  const body = await request.json();
  const { trek_id, images } = body;

  if (!trek_id || !images || !Array.isArray(images) || images.length === 0) {
    return jsonError("trek_id and images array are required", 400);
  }

  const repo = new TrekImageRepository(supabase);
  const owned = await repo.verifyTrekOwnership(trek_id, user.id);
  if (!owned) return jsonError("Trek not found or access denied", 404);

  const rows = images.map((img: { image_url: string; alt_text?: string; is_cover?: boolean; sort_order?: number }, i: number) => ({
    trek_id,
    image_url: img.image_url,
    alt_text: img.alt_text || null,
    is_cover: img.is_cover ?? (i === 0),
    sort_order: img.sort_order ?? i,
  }));

  // Use admin client to bypass RLS for insert
  const adminRepo = new TrekImageRepository(createAdminClient());
  const data = await adminRepo.createBatch(rows);

  return jsonOk({ success: true, images: data });
});

// DELETE /api/treks/images — Delete a trek image record and storage file
export const DELETE = withErrorHandling(async (request) => {
  const { user, supabase } = await requireAuth();
  const body = await request.json();
  const { image_id, storage_path } = body;

  if (!image_id) return jsonError("image_id is required", 400);

  const repo = new TrekImageRepository(supabase);
  const img = await repo.findWithOwnership(image_id);
  if (!img) return jsonError("Image not found", 404);

  const trek = Array.isArray(img.treks) ? (img.treks as any)[0] : img.treks;
  const org = trek ? (Array.isArray(trek.organizers) ? trek.organizers[0] : trek.organizers) : null;
  if (org?.profile_id !== user.id) return jsonError("Access denied", 403);

  if (storage_path) {
    await supabase.storage.from("trek-images").remove([storage_path]);
  }

  await repo.delete(image_id);
  return jsonOk({ success: true });
});
