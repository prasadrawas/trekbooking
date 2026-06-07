import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getUser(supabase: any) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

async function verifyTrekOwnership(supabase: any, slugOrId: string, userId: string) {
  // Support both slug and UUID lookup
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  const column = isUuid ? "id" : "slug";
  const { data: trek } = await (supabase as any)
    .from("treks")
    .select("id, slug, organizer_id, organizers!inner(profile_id)")
    .eq(column, slugOrId)
    .single();
  if (!trek || trek.organizers?.profile_id !== userId) return null;
  return trek;
}

// GET /api/treks/:slug — Get trek detail (public)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: slugOrId } = await params;
  // Use admin client for public read — bypasses RLS
  const supabase = createAdminClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

  const { data: trek, error } = await (supabase as any)
    .from("treks")
    .select(
      `
      *,
      trek_images(id, image_url, alt_text, is_cover, sort_order),
      organizers!inner(org_name, slug, is_verified, avg_rating, logo_url, created_at),
      trek_events(
        id, event_date, end_date, reporting_time, price, child_price,
        total_seats, booked_seats, status,
        pickup_points(id, label, address, pickup_time, maps_url)
      )
    `
    )
    .eq(isUuid ? "id" : "slug", slugOrId)
    .single();

  if (error || !trek) {
    return NextResponse.json({ error: "Trek not found" }, { status: 404 });
  }

  // Filter events for public view: only published upcoming events
  const now = new Date().toISOString();
  trek.trek_events = (trek.trek_events ?? [])
    .filter(
      (e: any) =>
        (e.status === "upcoming" || e.status === "full") && e.event_date >= now
    )
    .sort(
      (a: any, b: any) =>
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );

  return NextResponse.json({ trek });
}

// PUT /api/treks/:slug — Update trek (auth: owner organizer)
export async function PUT(
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

  // Prevent overwriting protected fields
  delete body.id;
  delete body.slug;
  delete body.organizer_id;
  delete body.created_at;

  const { data: trek, error } = await (supabase as any)
    .from("treks")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", owned.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ trek });
}

// DELETE /api/treks/:slug — Delete trek (auth: owner organizer)
// Only if no upcoming events with bookings
export async function DELETE(
  _request: NextRequest,
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

  // Check for upcoming events with bookings
  const now = new Date().toISOString();
  const { data: blockers } = await (supabase as any)
    .from("trek_events")
    .select("id, booked_seats")
    .eq("trek_id", owned.id)
    .gte("event_date", now)
    .neq("status", "cancelled")
    .gt("booked_seats", 0);

  if (blockers && blockers.length > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot delete trek: there are upcoming events with existing bookings.",
      },
      { status: 409 }
    );
  }

  const { error } = await (supabase as any)
    .from("treks")
    .delete()
    .eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
