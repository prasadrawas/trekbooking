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

// GET /api/treks/:slug/events — List events for a trek
// Public: only published upcoming events; owner: all events
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  // Resolve trek id
  const { data: trek } = await (supabase as any)
    .from("treks")
    .select("id, organizers!inner(profile_id)")
    .eq("slug", slug)
    .single();

  if (!trek) {
    return NextResponse.json({ error: "Trek not found" }, { status: 404 });
  }

  const user = await getUser(supabase);
  const isOwner = user && trek.organizers?.profile_id === user.id;

  let query = (supabase as any)
    .from("trek_events")
    .select(
      `
      id, event_date, end_date, reporting_time, price, child_price,
      total_seats, booked_seats, status, created_at,
      pickup_points(id, label, address, pickup_time, maps_url)
    `
    )
    .eq("trek_id", trek.id)
    .order("event_date", { ascending: true });

  if (!isOwner) {
    const now = new Date().toISOString();
    query = query.in("status", ["upcoming", "full"]).gte("event_date", now);
  }

  const { data: events, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: events ?? [] });
}

// POST /api/treks/:slug/events — Create event (auth: owner organizer)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
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

  const {
    event_date,
    end_date,
    reporting_time,
    price,
    child_price,
    total_seats,
  } = body;

  if (!event_date || price == null || !total_seats) {
    return NextResponse.json(
      { error: "event_date, price, and total_seats are required" },
      { status: 400 }
    );
  }

  const { data: event, error } = await (supabase as any)
    .from("trek_events")
    .insert({
      trek_id: owned.id,
      event_date,
      end_date: end_date ?? null,
      reporting_time: reporting_time ?? null,
      price,
      child_price: child_price ?? null,
      total_seats,
      booked_seats: 0,
      status: "upcoming",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event }, { status: 201 });
}
