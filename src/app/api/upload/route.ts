/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/upload
 * Upload an image to Supabase Storage.
 * Body: multipart/form-data with fields:
 *   - file: the image file
 *   - bucket: storage bucket name (default: "trek-images")
 *   - folder: optional subfolder path (e.g., "treks/abc123")
 */
export async function POST(request: NextRequest) {
  // Auth check with user client
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bucket = (formData.get("bucket") as string) || "trek-images";
  const folder = (formData.get("folder") as string) || "";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
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

  // Generate unique filename
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const filename = `${timestamp}-${random}.${ext}`;
  const path = folder ? `${folder}/${filename}` : filename;

  // Use admin client to bypass RLS for storage upload
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = admin.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return NextResponse.json({
    success: true,
    url: urlData.publicUrl,
    path: data.path,
    size: file.size,
  });
}
