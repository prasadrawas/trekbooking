import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/organizers/me/dashboard
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabase as any)
    .from("organizers")
    .select("id, org_name, avg_rating")
    .eq("profile_id", user.id)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
  }

  const today = new Date().toISOString();
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).toISOString();

  // Fetch organizer's trek IDs — needed to scope subsequent queries
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trekRows } = await (supabase as any)
    .from("treks")
    .select("id")
    .eq("organizer_id", org.id);

  const trekIds: string[] = (trekRows ?? []).map((t: { id: string }) => t.id);

  if (trekIds.length === 0) {
    return NextResponse.json({
      stats: { totalBookingsThisMonth: 0, revenueThisMonth: 0, upcomingTreksCount: 0, avgRating: org.avg_rating ?? 0 },
      upcomingTreks: [],
      recentBookings: [],
      orgName: org.org_name,
    });
  }

  // Fetch event IDs once — shared by booking count, revenue, and recent bookings queries
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: eventRows } = await (supabase as any)
    .from("trek_events")
    .select("id")
    .in("trek_id", trekIds);

  const eventIds: string[] = (eventRows ?? []).map((e: { id: string }) => e.id);

  // --- Run all independent queries in parallel ---
  type UpcomingTrekRow = {
    id: string;
    event_date: string;
    status: string;
    booked_seats: number;
    total_seats: number;
    treks: { title: string; difficulty: string; slug: string } | null;
  };
  type RecentBookingRow = {
    id: string;
    booking_number: string;
    booking_name: string;
    total_amount: number;
    status: string;
    created_at: string;
    trek_events: {
      event_date: string;
      treks: { title: string } | null;
    } | null;
  };

  const [
    bookingCountResult,
    revenueResult,
    upcomingCountResult,
    upcomingTreksResult,
    recentBookingsResult,
  ] = await Promise.all([
    // Booking count this month
    eventIds.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .in("trek_event_id", eventIds)
          .gte("created_at", monthStart)
      : Promise.resolve({ count: 0 }),

    // Revenue this month — select only the one column, bounded to 10k rows (HIGH-1)
    eventIds.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("bookings")
          .select("organizer_amount")
          .in("trek_event_id", eventIds)
          .eq("status", "confirmed")
          .gte("created_at", monthStart)
          .limit(10000)
      : Promise.resolve({ data: [] }),

    // Upcoming events count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("trek_events")
      .select("id", { count: "exact", head: true })
      .in("trek_id", trekIds)
      .gte("event_date", today)
      .eq("status", "upcoming"),

    // Upcoming treks (next 3)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("trek_events")
      .select("id, event_date, status, booked_seats, total_seats, treks(title, difficulty, slug)")
      .in("trek_id", trekIds)
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(3),

    // Recent bookings (last 5)
    eventIds.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("bookings")
          .select("id, booking_number, booking_name, total_amount, status, created_at, trek_events(event_date, treks(title))")
          .in("trek_event_id", eventIds)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  const totalBookingsThisMonth = bookingCountResult.count ?? 0;

  const revenueThisMonth = ((revenueResult.data ?? []) as { organizer_amount: number | null }[]).reduce(
    (sum, b) => sum + (b.organizer_amount ?? 0),
    0,
  );

  const upcomingTreksCount = upcomingCountResult.count ?? 0;

  const upcomingTreks = ((upcomingTreksResult.data ?? []) as UpcomingTrekRow[]).map((row) => ({
    id: row.id,
    event_date: row.event_date,
    status: row.status,
    booked_seats: row.booked_seats,
    total_seats: row.total_seats,
    trek: row.treks,
  }));

  const recentBookings = ((recentBookingsResult.data ?? []) as RecentBookingRow[]).map((b) => ({
    id: b.id,
    booking_number: b.booking_number,
    booking_name: b.booking_name,
    total_amount: b.total_amount,
    status: b.status,
    created_at: b.created_at,
    trek_title: b.trek_events?.treks?.title ?? null,
    event_date: b.trek_events?.event_date ?? null,
  }));

  return NextResponse.json({
    stats: {
      totalBookingsThisMonth,
      revenueThisMonth,
      upcomingTreksCount,
      avgRating: org.avg_rating ?? 0,
    },
    upcomingTreks,
    recentBookings,
    orgName: org.org_name,
  });
}
