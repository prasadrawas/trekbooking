/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Encapsulates all Supabase queries for the `profiles` table.
 */
export class ProfileRepository {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * Get a full profile by user ID.
   */
  async findById(userId: string) {
    const { data, error } = await (this.client as any)
      .from("profiles")
      .select("id, role, full_name, phone, avatar_url, city, youtube_channel_url")
      .eq("id", userId)
      .single();

    if (error) throw new Error(`ProfileRepository.findById: ${error.message}`);
    return data;
  }

  /**
   * Get only the role for a user (used in authorization checks).
   */
  async findRoleById(userId: string) {
    const { data, error } = await (this.client as any)
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) throw new Error(`ProfileRepository.findRoleById: ${error.message}`);
    return data as { role: string } | null;
  }

  /**
   * Check if a profile exists for a user ID. Returns { id } or null.
   */
  async existsById(userId: string) {
    const { data, error } = await (this.client as any)
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`ProfileRepository.existsById: ${error.message}`);
    }
    return data;
  }

  /**
   * Update a profile by user ID. Automatically sets updated_at.
   * Returns the updated profile fields.
   */
  async update(userId: string, updates: Record<string, unknown>) {
    const { data, error } = await (this.client as any)
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("id, role, full_name, phone, avatar_url, city, youtube_channel_url")
      .single();

    if (error) throw new Error(`ProfileRepository.update: ${error.message}`);
    return data;
  }
}
