import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getUser(supabase: any) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

async function verifyTrekOwnership(supabase: any, slug: string, userId: string) {
  const { data: trek } = await (supabase as any)
    .from("treks")
    .select("id, organizer_id, organizers!inner(profile_id)")
    .eq("slug", slug)
    .single();
  if (!trek || trek.organizers?.profile_id !== userId) return null;
  return trek;
}

async function resolvePickupPoint(
  supabase: any,
  trekId: string,
  eventId: string,
  pointId: string
) {
  // Verify the event belongs to the trek
  const { data: event } = await (supabase as any)
    .from("trek_events")
    .select("id")
    .eq("id", eventId)
    .eq("trek_id", trekId)
    .single();

  if (!event) return null;

  // Verify the pickup point belongs to the event
  const { data: point } = await (supabase as any)
    .from("pickup_points")
    .select("id")
    .eq("id", pointId)
    .eq("event_id", eventId)
    .single();

  return point ?? null;
}

// PUT /api/treks/:slug/events/:eventId/pickup-points/:pointId — Update pickup point (auth: owner)
export async function PUT(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ slug: string; eventId: string; pointId: string }> }
) {
  const { slug, eventId, pointId } = await params;
  const supabase = await createClient();

  const user = await getUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owned = await verifyTrekOwnership(supabase, slug, user.id);
  if (!owned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const point = await resolvePickupPoint(supabase, owned.id, eventId, pointId);
  if (!point) {
    return NextResponse.json({ error: "Pickup point not found" }, { status: 404 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Prevent overwriting protected fields
  delete body.id;
  delete body.event_id;

  const { data: updatedPoint, error } = await (supabase as any)
    .from("pickup_points")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", pointId)
    .eq("event_id", eventId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pickup_point: updatedPoint });
}

// DELETE /api/treks/:slug/events/:eventId/pickup-points/:pointId — Delete pickup point (auth: owner)
export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ slug: string; eventId: string; pointId: string }> }
) {
  const { slug, eventId, pointId } = await params;
  const supabase = await createClient();

  const user = await getUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owned = await verifyTrekOwnership(supabase, slug, user.id);
  if (!owned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const point = await resolvePickupPoint(supabase, owned.id, eventId, pointId);
  if (!point) {
    return NextResponse.json({ error: "Pickup point not found" }, { status: 404 });
  }

  const { error } = await (supabase as any)
    .from("pickup_points")
    .delete()
    .eq("id", pointId)
    .eq("event_id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
