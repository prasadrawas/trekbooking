/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Bucket allowlist with role-based permissions ────────────────────────────

const BUCKET_PERMISSIONS: Record<string, string[]> = {
  "avatars": ["trekker", "organizer", "admin"],
  "trek-images": ["organizer", "admin"],
  "organizer-logos": ["organizer", "admin"],
};

// ── Derive file extension from validated MIME type, not filename ────────────

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * POST /api/upload
 * Upload an image to Supabase Storage.
 * Body: multipart/form-data with fields:
 *   - file: the image file
 *   - bucket: storage bucket name (must be in allowlist)
 *   - folder: optional subfolder path (e.g., "treks/abc123")
 */
export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const rawBucket = (formData.get("bucket") as string) || "avatars";
  const folder = (formData.get("folder") as string) || "";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // ── SECURITY: Validate bucket against allowlist ───────────────────────
  if (!(rawBucket in BUCKET_PERMISSIONS)) {
    return NextResponse.json(
      { error: `Invalid bucket. Allowed: ${Object.keys(BUCKET_PERMISSIONS).join(", ")}` },
      { status: 400 }
    );
  }

  // ── SECURITY: Check user role has permission for this bucket ──────────
  const userRole = user.user_metadata?.role as string ?? "trekker";
  const allowedRoles = BUCKET_PERMISSIONS[rawBucket];
  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json(
      { error: "You don't have permission to upload to this bucket." },
      { status: 403 }
    );
  }

  // Validate file type
  const allowedTypes = Object.keys(MIME_TO_EXT);
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
      { status: 400 }
    );
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5MB." },
      { status: 400 }
    );
  }

  // Convert File to Buffer for server-side upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // ── SECURITY: Derive extension from MIME type, not filename ───────────
  const ext = MIME_TO_EXT[file.type] ?? "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const filename = `${timestamp}-${random}.${ext}`;
  const path = folder ? `${folder}/${filename}` : filename;

  // Upload via admin client
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(rawBucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = admin.storage
    .from(rawBucket)
    .getPublicUrl(data.path);

  return NextResponse.json({
    success: true,
    url: urlData.publicUrl,
    path: data.path,
    size: file.size,
  });
}
