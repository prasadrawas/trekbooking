/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── PUT /api/reviews/:id — Update review (auth: owner) ──────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch review and verify ownership
    const { data: existing, error: fetchError } = await (supabase as any)
      .from("reviews")
      .select("id, trekker_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const review = existing as { id: string; trekker_id: string };
    if (review.trekker_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { rating, comment } = body as { rating?: number; comment?: string };

    if (rating !== undefined) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ error: "rating must be an integer between 1 and 5" }, { status: 400 });
      }
    }

    const updates: Record<string, unknown> = {};
    if (rating !== undefined) updates.rating = rating;
    if (comment !== undefined) updates.comment = comment;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const { data: updated, error: updateError } = await (supabase as any)
      .from("reviews")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      console.error("[PUT /api/reviews/:id] Update error:", updateError.message);
      return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
    }

    // Note: organizer avg_rating is updated by DB trigger (on_review_upsert)

    return NextResponse.json({ review: updated });
  } catch (err) {
    console.error("[PUT /api/reviews/:id] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/reviews/:id — Delete review (auth: owner) ───────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch review to verify ownership
    const { data: existing, error: fetchError } = await (supabase as any)
      .from("reviews")
      .select("id, trekker_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const review = existing as { id: string; trekker_id: string };
    if (review.trekker_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: deleteError } = await (supabase as any)
      .from("reviews")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[DELETE /api/reviews/:id] Delete error:", deleteError.message);
      return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
    }

    // Note: organizer avg_rating is updated by DB trigger (on_review_delete)

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/reviews/:id] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
