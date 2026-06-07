/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/treks/images
 * Save trek image records after uploading to storage.
 * Body JSON: { trek_id, images: [{ image_url, alt_text?, is_cover, sort_order }] }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { trek_id, images } = body;

  if (!trek_id || !images || !Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: "trek_id and images array are required" }, { status: 400 });
  }

  // Verify trek ownership
  const { data: trek } = await (supabase as any)
    .from("treks")
    .select("id, organizer_id, organizers!inner(profile_id)")
    .eq("id", trek_id)
    .single();

  if (!trek) {
    return NextResponse.json({ error: "Trek not found" }, { status: 404 });
  }

  const org = Array.isArray(trek.organizers) ? trek.organizers[0] : trek.organizers;
  if (org?.profile_id !== user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Insert image records
  const rows = images.map((img: any, i: number) => ({
    trek_id,
    image_url: img.image_url,
    alt_text: img.alt_text || null,
    is_cover: img.is_cover ?? (i === 0),
    sort_order: img.sort_order ?? i,
  }));

  // Use admin client to bypass RLS for insert
  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("trek_images")
    .insert(rows)
    .select("id, image_url, is_cover, sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, images: data });
}

/**
 * DELETE /api/treks/images
 * Delete a trek image record and storage file.
 * Body JSON: { image_id, storage_path? }
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { image_id, storage_path } = body;

  if (!image_id) {
    return NextResponse.json({ error: "image_id is required" }, { status: 400 });
  }

  // Verify ownership through trek
  const { data: img } = await (supabase as any)
    .from("trek_images")
    .select("id, trek_id, treks!inner(organizer_id, organizers!inner(profile_id))")
    .eq("id", image_id)
    .single();

  if (!img) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const trek = Array.isArray(img.treks) ? img.treks[0] : img.treks;
  const org = trek ? (Array.isArray(trek.organizers) ? trek.organizers[0] : trek.organizers) : null;
  if (org?.profile_id !== user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Delete from storage if path provided
  if (storage_path) {
    await supabase.storage.from("trek-images").remove([storage_path]);
  }

  // Delete DB record
  const { error } = await (supabase as any)
    .from("trek_images")
    .delete()
    .eq("id", image_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
