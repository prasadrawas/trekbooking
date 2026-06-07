"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import type { Review } from "@/types/database";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return { supabase, user };
}

// ─── createReview ─────────────────────────────────────────────────────────────

export interface CreateReviewData {
  rating: number;
  comment: string;
}

export async function createReview(
  bookingId: string,
  data: CreateReviewData,
): Promise<{ success: true; reviewId: string } | { error: string }> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    if (data.rating < 1 || data.rating > 5) return { error: "Rating must be between 1 and 5." };
    if (!data.comment?.trim()) return { error: "Review comment is required." };

    // Verify booking belongs to user and is completed
    const { data: bookingRaw, error: bookingError } = await (supabase as any)
      .from("bookings")
      .select("id, trekker_id, status, trek_events(trek_id)")
      .eq("id", bookingId)
      .eq("trekker_id", user.id)
      .single();

    if (bookingError || !bookingRaw) return { error: "Booking not found." };
    const booking = bookingRaw as { id: string; trekker_id: string; status: string; trek_events: any };

    if (booking.status !== "completed") {
      return { error: "You can only review a completed trek." };
    }

    const events = Array.isArray(booking.trek_events)
      ? booking.trek_events
      : [booking.trek_events];
    const trekId = (events[0] as { trek_id: string } | null)?.trek_id;
    if (!trekId) return { error: "Could not determine trek for this booking." };

    // Check if review already exists for this booking
    const { data: existing } = await (supabase as any)
      .from("reviews")
      .select("id")
      .eq("booking_id", bookingId)
      .single();

    if (existing) return { error: "You have already reviewed this trek for this booking." };

    // Insert review
    const { data: reviewRaw, error: insertError } = await (supabase as any)
      .from("reviews")
      .insert({
        trek_id: trekId,
        trekker_id: user.id,
        booking_id: bookingId,
        rating: data.rating,
        comment: data.comment.trim(),
        is_published: true,
      })
      .select("id")
      .single();

    if (insertError) return { error: insertError.message };

    return { success: true, reviewId: (reviewRaw as { id: string }).id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create review." };
  }
}

// ─── updateReview ─────────────────────────────────────────────────────────────

export async function updateReview(
  reviewId: string,
  data: CreateReviewData,
): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    if (data.rating < 1 || data.rating > 5) return { error: "Rating must be between 1 and 5." };
    if (!data.comment?.trim()) return { error: "Review comment is required." };

    // Verify review belongs to user
    const { data: reviewRaw, error: fetchError } = await (supabase as any)
      .from("reviews")
      .select("id, trekker_id, trek_id")
      .eq("id", reviewId)
      .single();

    if (fetchError || !reviewRaw) return { error: "Review not found." };
    const review = reviewRaw as { id: string; trekker_id: string; trek_id: string };
    if (review.trekker_id !== user.id) return { error: "Access denied." };

    const { error: updateError } = await (supabase as any)
      .from("reviews")
      .update({
        rating: data.rating,
        comment: data.comment.trim(),
      })
      .eq("id", reviewId);

    if (updateError) return { error: updateError.message };

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update review." };
  }
}

// ─── getReviewsByTrek ─────────────────────────────────────────────────────────

export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name: string | null;
  user_avatar: string | null;
}

export async function getReviewsByTrek(trekId: string): Promise<{
  data: PublicReview[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("reviews")
      .select("id, rating, comment, created_at, profiles(full_name, avatar_url)")
      .eq("trek_id", trekId)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };

    const result: PublicReview[] = ((data as any[]) ?? []).map((r: any) => {
      const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        user_name: profile?.full_name ?? null,
        user_avatar: profile?.avatar_url ?? null,
      };
    });

    return { data: result };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch reviews.",
    };
  }
}

// ─── getTrekkerReviews ────────────────────────────────────────────────────────

export interface TrekkerReview extends Review {
  trek_title: string;
  trek_slug: string;
}

export async function getTrekkerReviews(): Promise<{
  data: TrekkerReview[];
  error?: string;
}> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { data, error } = await (supabase as any)
      .from("reviews")
      .select("*, treks(title, slug)")
      .eq("trekker_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };

    const result: TrekkerReview[] = ((data as any[]) ?? []).map((r: any) => {
      const trek = Array.isArray(r.treks) ? r.treks[0] : r.treks;
      return {
        ...r,
        trek_title: trek?.title ?? "",
        trek_slug: trek?.slug ?? "",
      } as TrekkerReview;
    });

    return { data: result };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch reviews.",
    };
  }
}
