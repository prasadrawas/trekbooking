/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Encapsulates all Supabase queries for the `trekker_videos` table.
 */
export class VideoRepository {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * List videos for a trekker (owner view, includes unpublished).
   */
  async findByTrekkerId(trekkerId: string) {
    const { data, error } = await (this.client as any)
      .from("trekker_videos")
      .select(`
        id,
        youtube_url,
        title,
        sort_order,
        is_published,
        created_at,
        treks (
          id,
          title,
          slug
        )
      `)
      .eq("trekker_id", trekkerId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(`VideoRepository.findByTrekkerId: ${error.message}`);
    return data ?? [];
  }

  /**
   * List published videos for a trek by trek ID (public view).
   */
  async findByTrekId(trekId: string) {
    const { data, error } = await (this.client as any)
      .from("trekker_videos")
      .select("id, title, youtube_url, sort_order, created_at")
      .eq("trek_id", trekId)
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(`VideoRepository.findByTrekId: ${error.message}`);
    return data ?? [];
  }

  /**
   * Create a new video. Returns the full inserted row.
   */
  async create(values: {
    trekker_id: string;
    youtube_url: string;
    trek_id?: string | null;
    title?: string | null;
  }) {
    const { data, error } = await (this.client as any)
      .from("trekker_videos")
      .insert({
        trekker_id: values.trekker_id,
        youtube_url: values.youtube_url,
        trek_id: values.trek_id ?? null,
        title: values.title ?? null,
      })
      .select("*")
      .single();

    if (error) throw new Error(`VideoRepository.create: ${error.message}`);
    return data;
  }

  /**
   * Update a video by ID, scoped to the owning trekker.
   * Returns the updated row, or null if not found/forbidden.
   */
  async update(id: string, trekkerId: string, updates: Record<string, unknown>) {
    const { data, error } = await (this.client as any)
      .from("trekker_videos")
      .update(updates)
      .eq("id", id)
      .eq("trekker_id", trekkerId)
      .select("*")
      .single();

    if (error) throw new Error(`VideoRepository.update: ${error.message}`);
    return data;
  }

  /**
   * Delete a video by ID, scoped to the owning trekker.
   * Returns the count of deleted rows.
   */
  async delete(id: string, trekkerId: string) {
    const { error, count } = await (this.client as any)
      .from("trekker_videos")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("trekker_id", trekkerId);

    if (error) throw new Error(`VideoRepository.delete: ${error.message}`);
    return count ?? 0;
  }

  /**
   * Verify a trek exists by ID. Returns { id } or throws.
   */
  async findTrekById(trekId: string) {
    const { data, error } = await (this.client as any)
      .from("treks")
      .select("id")
      .eq("id", trekId)
      .single();

    if (error) throw new Error(`VideoRepository.findTrekById: ${error.message}`);
    return data;
  }

  /**
   * Resolve a trek by slug, returning only its ID.
   */
  async findTrekIdBySlug(slug: string) {
    const { data, error } = await (this.client as any)
      .from("treks")
      .select("id")
      .eq("slug", slug)
      .single();

    if (error) throw new Error(`VideoRepository.findTrekIdBySlug: ${error.message}`);
    return data;
  }
}
