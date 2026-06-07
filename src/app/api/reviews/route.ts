/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── GET /api/reviews — List reviews for current user (auth: trekker) ─────────

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: reviews, error } = await (supabase as any)
      .from("reviews")
      .select(`
        *,
        bookings (
          id,
          trek_events (
            id,
            event_date,
            treks (
              id,
              title,
              slug
            )
          )
        )
      `)
      .eq("trekker_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/reviews] DB error:", error.message);
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }

    return NextResponse.json({ reviews: reviews ?? [] });
  } catch (err) {
    console.error("[GET /api/reviews] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/reviews — Create review (auth: trekker) ───────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { booking_id, rating, comment } = body as {
      booking_id: string;
      rating: number;
      comment?: string;
    };

    if (!booking_id || rating === undefined) {
      return NextResponse.json({ error: "booking_id and rating are required" }, { status: 400 });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be an integer between 1 and 5" }, { status: 400 });
    }

    // Validate booking belongs to user and is completed
    const { data: bookingRaw, error: bookingError } = await (supabase as any)
      .from("bookings")
      .select("id, trekker_id, status, trek_events(trek_id)")
      .eq("id", booking_id)
      .single();

    if (bookingError || !bookingRaw) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingRaw as {
      id: string;
      trekker_id: string;
      status: string;
      trek_events: { trek_id: string } | null;
    };

    if (booking.trekker_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status !== "completed") {
      return NextResponse.json(
        { error: "Reviews can only be submitted for completed bookings" },
        { status: 422 }
      );
    }

    // Check no existing review for this booking
    const { data: existingReview } = await (supabase as any)
      .from("reviews")
      .select("id")
      .eq("booking_id", booking_id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: "A review already exists for this booking" },
        { status: 409 }
      );
    }

    const trekId = booking.trek_events?.trek_id ?? null;

    const { data: review, error: insertError } = await (supabase as any)
      .from("reviews")
      .insert({
        trekker_id: user.id,
        booking_id,
        trek_id: trekId,
        rating,
        comment: comment ?? null,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("[POST /api/reviews] Insert error:", insertError.message);
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
    }

    // Note: organizer avg_rating and total_reviews are updated by DB trigger (update_organizer_rating)

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/reviews] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
