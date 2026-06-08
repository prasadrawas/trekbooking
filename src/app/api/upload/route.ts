import { requireAuth, getUserRole } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

// Bucket allowlist with role-based permissions
const BUCKET_PERMISSIONS: Record<string, string[]> = {
  "avatars": ["trekker", "organizer", "admin"],
  "trek-images": ["organizer", "admin"],
  "organizer-logos": ["organizer", "admin"],
};

// Derive file extension from validated MIME type, not filename
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// POST /api/upload — Upload an image to Supabase Storage
export const POST = withErrorHandling(async (request) => {
  const { user } = await requireAuth();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const rawBucket = (formData.get("bucket") as string) || "avatars";
  const folder = (formData.get("folder") as string) || "";

  if (!file) return jsonError("No file provided", 400);

  if (!(rawBucket in BUCKET_PERMISSIONS)) {
    return jsonError(
      `Invalid bucket. Allowed: ${Object.keys(BUCKET_PERMISSIONS).join(", ")}`,
      400,
    );
  }

  const userRole = (user.user_metadata?.role as string) ?? "trekker";
  const allowedRoles = BUCKET_PERMISSIONS[rawBucket];
  if (!allowedRoles.includes(userRole)) {
    return jsonError("You don't have permission to upload to this bucket.", 403);
  }

  const allowedTypes = Object.keys(MIME_TO_EXT);
  if (!allowedTypes.includes(file.type)) {
    return jsonError("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.", 400);
  }

  if (file.size > 5 * 1024 * 1024) {
    return jsonError("File too large. Maximum size is 5MB.", 400);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const ext = MIME_TO_EXT[file.type] ?? "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const filename = `${timestamp}-${random}.${ext}`;
  const path = folder ? `${folder}/${filename}` : filename;

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(rawBucket)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) return jsonError(error.message, 500);

  const { data: urlData } = admin.storage.from(rawBucket).getPublicUrl(data.path);

  return jsonOk({
    success: true,
    url: urlData.publicUrl,
    path: data.path,
    size: file.size,
  });
});
