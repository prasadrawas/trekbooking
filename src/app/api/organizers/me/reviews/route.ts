import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/organizers/me/reviews
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
    .select("id, avg_rating, total_reviews")
    .eq("profile_id", user.id)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
  }

  // Get trek IDs for this organizer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trekRows } = await (supabase as any)
    .from("treks")
    .select("id")
    .eq("organizer_id", org.id);

  const trekIds: string[] = (trekRows ?? []).map((t: { id: string }) => t.id);

  if (trekIds.length === 0) {
    return NextResponse.json({
      reviews: [],
      breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      avgRating: 0,
      totalReviews: 0,
    });
  }

  type RawReview = {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    bookings: {
      booking_name: string | null;
      trek_events: {
        treks: { title: string } | null;
      } | null;
    } | null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reviewRows, error } = await (supabase as any)
    .from("reviews")
    .select(
      "id, rating, comment, created_at, bookings(booking_name, trek_events(treks(title)))",
    )
    .in("trek_id", trekIds)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reviews = (reviewRows ?? []).map((r: RawReview) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    trekker_name: r.bookings?.booking_name ?? null,
    trek_title: r.bookings?.trek_events?.treks?.title ?? null,
  }));

  // Rating breakdown per star (1–5)
  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const star = Math.round(r.rating);
    if (star >= 1 && star <= 5) breakdown[star] = (breakdown[star] ?? 0) + 1;
  }

  return NextResponse.json({
    reviews,
    breakdown,
    avgRating: org.avg_rating ?? 0,
    totalReviews: org.total_reviews ?? reviews.length,
  });
}
