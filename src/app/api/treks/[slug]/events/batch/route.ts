import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScheduleType = "single" | "weekly" | "biweekly" | "monthly" | "custom";

interface BatchEventBody {
  schedule_type: ScheduleType;
  // For single
  event_date?: string;
  // For weekly / biweekly
  day_of_week?: number; // 0=Sunday … 6=Saturday
  start_date?: string;
  end_date_range?: string;
  // For monthly
  day_of_month?: number; // 1–28
  // For custom
  custom_dates?: string[];
  // Common
  reporting_time: string;
  price: number;
  child_price?: number;
  total_seats: number;
  // For multi-day treks
  duration_days?: number;
}

// ─── Date generation (mirrors createBatchEvents logic) ────────────────────────

function generateDates(data: BatchEventBody): string[] {
  const dates: string[] = [];

  if (data.schedule_type === "single") {
    if (data.event_date) dates.push(data.event_date);
  } else if (data.schedule_type === "custom") {
    if (data.custom_dates) dates.push(...data.custom_dates);
  } else if (
    data.schedule_type === "weekly" ||
    data.schedule_type === "biweekly"
  ) {
    if (
      data.day_of_week == null ||
      !data.start_date ||
      !data.end_date_range
    ) {
      return dates;
    }
    const start = new Date(data.start_date);
    const end = new Date(data.end_date_range);
    const step = data.schedule_type === "biweekly" ? 14 : 7;

    // Find the first occurrence of the target day
    const current = new Date(start);
    const targetDay = data.day_of_week;
    while (current.getDay() !== targetDay) {
      current.setDate(current.getDate() + 1);
    }

    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + step);
    }
  } else if (data.schedule_type === "monthly") {
    if (data.day_of_month == null || !data.start_date || !data.end_date_range) {
      return dates;
    }
    const start = new Date(data.start_date);
    const end = new Date(data.end_date_range);
    const targetDay = Math.min(data.day_of_month, 28);

    const current = new Date(start.getFullYear(), start.getMonth(), targetDay);
    if (current < start) current.setMonth(current.getMonth() + 1);

    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setMonth(current.getMonth() + 1);
    }
  }

  // Filter out past dates
  const today = new Date().toISOString().split("T")[0];
  return dates.filter((d) => d >= today).sort();
}

// ─── POST /api/treks/:slug/events/batch ───────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createClient();

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get organizer record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabase as any)
    .from("organizers")
    .select("id, status")
    .eq("profile_id", user.id)
    .single();

  if (!org) {
    return NextResponse.json(
      { error: "Organizer profile not found" },
      { status: 403 },
    );
  }

  if (org.status !== "active") {
    return NextResponse.json(
      { error: "Organizer account is not active" },
      { status: 403 },
    );
  }

  // Resolve trek and verify ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trek } = await (supabase as any)
    .from("treks")
    .select("id, organizer_id, default_pickup_points")
    .eq("slug", slug)
    .single();

  if (!trek) {
    return NextResponse.json({ error: "Trek not found" }, { status: 404 });
  }

  if (trek.organizer_id !== org.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse body
  let body: BatchEventBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate common fields
  if (!body.price || body.price <= 0) {
    return NextResponse.json(
      { error: "Price must be greater than zero." },
      { status: 400 },
    );
  }
  if (!body.total_seats || body.total_seats <= 0) {
    return NextResponse.json(
      { error: "Total seats must be greater than zero." },
      { status: 400 },
    );
  }
  if (!body.reporting_time) {
    return NextResponse.json(
      { error: "Reporting time is required." },
      { status: 400 },
    );
  }

  // Generate dates
  const dates = generateDates(body);
  if (dates.length === 0) {
    return NextResponse.json(
      { error: "No valid dates generated. Check your schedule settings." },
      { status: 400 },
    );
  }
  if (dates.length > 52) {
    return NextResponse.json(
      { error: "Cannot create more than 52 events at once." },
      { status: 400 },
    );
  }

  const durationDays = body.duration_days ?? 1;

  const rows = dates.map((eventDate) => {
    const endDate = new Date(eventDate);
    endDate.setDate(endDate.getDate() + durationDays - 1);

    return {
      trek_id: trek.id,
      event_date: eventDate,
      end_date:
        durationDays > 1 ? endDate.toISOString().split("T")[0] : eventDate,
      reporting_time: body.reporting_time,
      price: body.price,
      child_price: body.child_price ?? null,
      total_seats: body.total_seats,
      booked_seats: 0,
      status: "upcoming",
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: insertedEvents, error: insertError } = await (supabase as any)
    .from("trek_events")
    .insert(rows)
    .select("id");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Auto-copy default pickup points from the trek to each new event
  const defaultPickups = (trek.default_pickup_points ?? []) as Array<{
    label: string;
    address?: string;
    maps_url?: string;
    pickup_time: string;
    extra_charge?: number;
  }>;

  if (defaultPickups.length > 0 && insertedEvents) {
    const pickupRows = (insertedEvents as Array<{ id: string }>).flatMap(
      (event, _i) =>
        defaultPickups.map((p, i) => ({
          trek_event_id: event.id,
          label: p.label,
          address: p.address ?? null,
          maps_url: p.maps_url ?? null,
          pickup_time: p.pickup_time,
          extra_charge: p.extra_charge ?? 0,
          sort_order: i,
        })),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("pickup_points").insert(pickupRows);
  }

  return NextResponse.json({ success: true, count: rows.length }, { status: 201 });
}
