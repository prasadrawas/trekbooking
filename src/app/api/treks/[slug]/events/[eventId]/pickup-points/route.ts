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

async function resolveEvent(supabase: any, trekId: string, eventId: string) {
  const { data: event } = await (supabase as any)
    .from("trek_events")
    .select("id")
    .eq("id", eventId)
    .eq("trek_id", trekId)
    .single();
  return event ?? null;
}

// GET /api/treks/:slug/events/:eventId/pickup-points — List pickup points for event (public)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; eventId: string }> }
) {
  const { slug, eventId } = await params;
  const supabase = await createClient();

  const { data: trek } = await (supabase as any)
    .from("treks")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!trek) {
    return NextResponse.json({ error: "Trek not found" }, { status: 404 });
  }

  const event = await resolveEvent(supabase, trek.id, eventId);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { data: pickupPoints, error } = await (supabase as any)
    .from("pickup_points")
    .select("id, label, address, pickup_time, maps_url, extra_charge, sort_order")
    .eq("trek_event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pickup_points: pickupPoints ?? [] });
}

// POST /api/treks/:slug/events/:eventId/pickup-points — Add pickup point (auth: owner)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; eventId: string }> }
) {
  const { slug, eventId } = await params;
  const supabase = await createClient();

  const user = await getUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owned = await verifyTrekOwnership(supabase, slug, user.id);
  if (!owned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const event = await resolveEvent(supabase, owned.id, eventId);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { label, address, pickup_time, maps_url, extra_charge, sort_order } = body;

  if (!label) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  if (!pickup_time) {
    return NextResponse.json({ error: "pickup_time is required" }, { status: 400 });
  }

  const { data: pickupPoint, error } = await (supabase as any)
    .from("pickup_points")
    .insert({
      trek_event_id: eventId,
      label,
      address: address ?? null,
      pickup_time,
      maps_url: maps_url ?? null,
      extra_charge: extra_charge ?? 0,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pickup_point: pickupPoint }, { status: 201 });
}
