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

// GET /api/treks/:slug/events/:eventId — Get event detail with pickup points
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; eventId: string }> }
) {
  const { slug, eventId } = await params;
  const supabase = await createClient();

  // Verify event belongs to the trek identified by slug
  const { data: trek } = await (supabase as any)
    .from("treks")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!trek) {
    return NextResponse.json({ error: "Trek not found" }, { status: 404 });
  }

  const { data: event, error } = await (supabase as any)
    .from("trek_events")
    .select(
      `
      id, event_date, end_date, reporting_time, price, child_price,
      total_seats, booked_seats, status, created_at,
      pickup_points(id, label, address, pickup_time, maps_url)
    `
    )
    .eq("id", eventId)
    .eq("trek_id", trek.id)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ event });
}

// PUT /api/treks/:slug/events/:eventId — Update event (auth: owner)
export async function PUT(
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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Prevent overwriting protected fields
  delete body.id;
  delete body.trek_id;
  delete body.booked_seats;
  delete body.created_at;

  const { data: event, error } = await (supabase as any)
    .from("trek_events")
    .update({ ...body })
    .eq("id", eventId)
    .eq("trek_id", owned.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ event });
}

// DELETE /api/treks/:slug/events/:eventId — Cancel event (auth: owner)
// Sets status to 'cancelled'
export async function DELETE(
  _request: NextRequest,
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

  const { error } = await (supabase as any)
    .from("trek_events")
    .update({ status: "cancelled" })
    .eq("id", eventId)
    .eq("trek_id", owned.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
