"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ReviewRepository } from "@/lib/repositories";
import type { Review } from "@/types/database";

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
    const { supabase, user } = await requireAuth();
    const reviewRepo = new ReviewRepository(supabase);

    if (data.rating < 1 || data.rating > 5) return { error: "Rating must be between 1 and 5." };
    if (!data.comment?.trim()) return { error: "Review comment is required." };

    // Verify booking belongs to user and is completed
    const booking = await reviewRepo.findBookingForReview(bookingId);
    if (!booking || (booking as any).trekker_id !== user.id) {
      return { error: "Booking not found." };
    }
    if ((booking as any).status !== "completed") {
      return { error: "You can only review a completed trek." };
    }

    const events = Array.isArray((booking as any).trek_events)
      ? (booking as any).trek_events
      : [(booking as any).trek_events];
    const trekId = events[0]?.trek_id;
    if (!trekId) return { error: "Could not determine trek for this booking." };

    // Check if review already exists for this booking
    const existing = await reviewRepo.findByBookingId(bookingId);
    if (existing) return { error: "You have already reviewed this trek for this booking." };

    // Insert review
    const review = await reviewRepo.create({
      trek_id: trekId,
      trekker_id: user.id,
      booking_id: bookingId,
      rating: data.rating,
      comment: data.comment.trim(),
    });

    return { success: true, reviewId: (review as any).id };
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
    const { supabase, user } = await requireAuth();
    const reviewRepo = new ReviewRepository(supabase);

    if (data.rating < 1 || data.rating > 5) return { error: "Rating must be between 1 and 5." };
    if (!data.comment?.trim()) return { error: "Review comment is required." };

    await reviewRepo.update(reviewId, user.id, {
      rating: data.rating,
      comment: data.comment.trim(),
    });

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
    const reviewRepo = new ReviewRepository(supabase);

    const data = await reviewRepo.findByTrekId(trekId);

    const result: PublicReview[] = (data as any[]).map((r: any) => {
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
    const { supabase, user } = await requireAuth();
    const reviewRepo = new ReviewRepository(supabase);

    const data = await reviewRepo.findByTrekkerId(user.id);

    const result: TrekkerReview[] = (data as any[]).map((r: any) => {
      const booking = Array.isArray(r.bookings) ? r.bookings[0] : r.bookings;
      const event = booking?.trek_events;
      const eventData = Array.isArray(event) ? event[0] : event;
      const trek = eventData?.treks;
      const trekData = Array.isArray(trek) ? trek[0] : trek;
      return {
        ...r,
        trek_title: trekData?.title ?? "",
        trek_slug: trekData?.slug ?? "",
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
