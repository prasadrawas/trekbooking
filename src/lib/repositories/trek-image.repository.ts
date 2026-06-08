/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TrekImage } from "@/types/database";

// ─── Types for query results ────────────────────────────────────────────────

export interface TrekImageRow {
  id: string;
  image_url: string;
  is_cover: boolean;
  sort_order: number;
}

export interface TrekImageOwnershipRow {
  id: string;
  trek_id: string;
  treks: {
    organizer_id: string;
    organizers: { profile_id: string } | null;
  } | null;
}

export class TrekImageRepository {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Fetch all images for a trek, ordered by sort_order.
   */
  async findByTrekId(trekId: string): Promise<TrekImage[]> {
    const { data, error } = await (this.client as any)
      .from("trek_images")
      .select("*")
      .eq("trek_id", trekId)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(`TrekImageRepository.findByTrekId: ${error.message}`);
    return (data ?? []) as TrekImage[];
  }

  /**
   * Insert multiple image records in a single batch.
   * Returns the inserted rows with id, image_url, is_cover, sort_order.
   */
  async createBatch(
    images: {
      trek_id: string;
      image_url: string;
      alt_text: string | null;
      is_cover: boolean;
      sort_order: number;
    }[]
  ): Promise<TrekImageRow[]> {
    const { data, error } = await (this.client as any)
      .from("trek_images")
      .insert(images)
      .select("id, image_url, is_cover, sort_order");

    if (error) throw new Error(`TrekImageRepository.createBatch: ${error.message}`);
    return (data ?? []) as TrekImageRow[];
  }

  /**
   * Delete a single image record by its ID.
   */
  async delete(imageId: string): Promise<void> {
    const { error } = await (this.client as any)
      .from("trek_images")
      .delete()
      .eq("id", imageId);

    if (error) throw new Error(`TrekImageRepository.delete: ${error.message}`);
  }

  /**
   * Fetch an image with its trek ownership chain (trek -> organizer -> profile_id).
   * Used to verify that the requesting user owns the image before deletion.
   */
  async findWithOwnership(imageId: string): Promise<TrekImageOwnershipRow | null> {
    const { data, error } = await (this.client as any)
      .from("trek_images")
      .select("id, trek_id, treks!inner(organizer_id, organizers!inner(profile_id))")
      .eq("id", imageId)
      .single();

    if (error || !data) return null;
    return data as TrekImageOwnershipRow;
  }

  /**
   * Verify trek ownership for image upload. Returns the trek row with
   * organizer profile_id, or null if not found.
   */
  async verifyTrekOwnership(
    trekId: string,
    userId: string
  ): Promise<{ id: string } | null> {
    const { data } = await (this.client as any)
      .from("treks")
      .select("id, organizer_id, organizers!inner(profile_id)")
      .eq("id", trekId)
      .single();

    if (!data) return null;

    const org = Array.isArray(data.organizers) ? data.organizers[0] : data.organizers;
    if (org?.profile_id !== userId) return null;

    return { id: data.id } as { id: string };
  }
}
