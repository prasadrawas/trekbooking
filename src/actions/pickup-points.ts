"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import type { PickupPoint } from "@/types/database";

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

async function getOrganizerForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ id: string }> {
  const { data, error } = await (supabase as any)
    .from("organizers")
    .select("id, status")
    .eq("profile_id", userId)
    .single();
  if (error || !data) throw new Error("Organizer profile not found");
  if ((data as any).status !== "active") throw new Error("Organizer account is not active");
  return data as { id: string };
}

/**
 * Returns the organizer_id for the trek that owns this event.
 */
async function getEventOrganizerId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
): Promise<string> {
  const { data, error } = await (supabase as any)
    .from("trek_events")
    .select("trek_id, treks!inner(organizer_id)")
    .eq("id", eventId)
    .single();
  if (error || !data) throw new Error("Event not found");
  const treks = (data as any).treks;
  return Array.isArray(treks) ? treks[0].organizer_id : treks.organizer_id;
}

/**
 * Returns the organizer_id for the trek that owns this pickup point's event.
 */
async function getPickupOrganizerId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pointId: string,
): Promise<string> {
  const { data, error } = await (supabase as any)
    .from("pickup_points")
    .select("trek_event_id, trek_events!inner(trek_id, treks!inner(organizer_id))")
    .eq("id", pointId)
    .single();
  if (error || !data) throw new Error("Pickup point not found");
  const events = (data as any).trek_events;
  const event = Array.isArray(events) ? events[0] : events;
  const treks = event?.treks;
  return Array.isArray(treks) ? treks[0].organizer_id : treks?.organizer_id;
}

// ─── addPickupPoint ───────────────────────────────────────────────────────────

export interface AddPickupPointData {
  label: string;
  address?: string;
  maps_url?: string;
  pickup_time: string;
  extra_charge?: number;
}

export async function addPickupPoint(
  eventId: string,
  data: AddPickupPointData,
): Promise<{ success: true; pointId: string } | { error: string }> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const organizer = await getOrganizerForUser(supabase, user.id);
    const eventOrgId = await getEventOrganizerId(supabase, eventId);
    if (eventOrgId !== organizer.id) return { error: "Access denied." };

    if (!data.label?.trim()) return { error: "Pickup label is required." };
    if (!data.pickup_time?.trim()) return { error: "Pickup time is required." };

    // Determine sort_order from existing points count
    const { count } = await (supabase as any)
      .from("pickup_points")
      .select("id", { count: "exact", head: true })
      .eq("trek_event_id", eventId);

    const { data: inserted, error } = await (supabase as any)
      .from("pickup_points")
      .insert({
        trek_event_id: eventId,
        label: data.label.trim(),
        address: data.address?.trim() ?? null,
        pickup_time: data.pickup_time.trim(),
        maps_url: data.maps_url ?? null,
        extra_charge: data.extra_charge ?? 0,
        sort_order: ((count as number) ?? 0) + 1,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    return { success: true, pointId: (inserted as { id: string }).id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to add pickup point." };
  }
}

// ─── updatePickupPoint ────────────────────────────────────────────────────────

export interface UpdatePickupPointData {
  label?: string;
  address?: string;
  maps_url?: string;
  pickup_time?: string;
  extra_charge?: number;
  sort_order?: number;
}

export async function updatePickupPoint(
  pointId: string,
  data: UpdatePickupPointData,
): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const organizer = await getOrganizerForUser(supabase, user.id);
    const pointOrgId = await getPickupOrganizerId(supabase, pointId);
    if (pointOrgId !== organizer.id) return { error: "Access denied." };

    const updates: Record<string, unknown> = {};
    if (data.label !== undefined) updates.label = data.label.trim();
    if (data.address !== undefined) updates.address = data.address?.trim() || null;
    if (data.maps_url !== undefined) updates.maps_url = data.maps_url || null;
    if (data.pickup_time !== undefined) updates.pickup_time = data.pickup_time.trim();
    if (data.sort_order !== undefined) updates.sort_order = data.sort_order;
    if (data.extra_charge !== undefined) updates.extra_charge = data.extra_charge;

    if (Object.keys(updates).length === 0) return { error: "No fields to update." };

    const { error } = await (supabase as any)
      .from("pickup_points")
      .update(updates)
      .eq("id", pointId);
    if (error) return { error: error.message };

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update pickup point." };
  }
}

// ─── deletePickupPoint ────────────────────────────────────────────────────────

export async function deletePickupPoint(
  pointId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const organizer = await getOrganizerForUser(supabase, user.id);
    const pointOrgId = await getPickupOrganizerId(supabase, pointId);
    if (pointOrgId !== organizer.id) return { error: "Access denied." };

    const { error } = await (supabase as any)
      .from("pickup_points")
      .delete()
      .eq("id", pointId);
    if (error) return { error: error.message };

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete pickup point." };
  }
}

// ─── getPickupPoints ──────────────────────────────────────────────────────────

export async function getPickupPoints(eventId: string): Promise<{
  data: PickupPoint[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("pickup_points")
      .select("*")
      .eq("trek_event_id", eventId)
      .order("sort_order", { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as PickupPoint[] };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch pickup points.",
    };
  }
}

// ─── copyPickupPointsFromEvent ────────────────────────────────────────────────

export async function copyPickupPointsFromEvent(
  sourceEventId: string,
  targetEventId: string,
): Promise<{ success: true; count: number } | { error: string }> {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const organizer = await getOrganizerForUser(supabase, user.id);

    // Verify organizer owns both events
    const [sourceOrgId, targetOrgId] = await Promise.all([
      getEventOrganizerId(supabase, sourceEventId),
      getEventOrganizerId(supabase, targetEventId),
    ]);

    if (sourceOrgId !== organizer.id || targetOrgId !== organizer.id) {
      return { error: "Access denied." };
    }

    // Fetch source pickup points
    const { data: sourcePoints, error: fetchError } = await (supabase as any)
      .from("pickup_points")
      .select("*")
      .eq("trek_event_id", sourceEventId)
      .order("sort_order", { ascending: true });

    if (fetchError) return { error: fetchError.message };
    if (!sourcePoints || (sourcePoints as any[]).length === 0) {
      return { error: "No pickup points found in source event." };
    }

    // Delete existing points in target event before copying
    await (supabase as any)
      .from("pickup_points")
      .delete()
      .eq("trek_event_id", targetEventId);

    // Insert copies
    const copies = (sourcePoints as Array<{
      label: string;
      address: string | null;
      pickup_time: string;
      maps_url: string | null;
      extra_charge: number;
      sort_order: number;
    }>).map((p) => ({
      trek_event_id: targetEventId,
      label: p.label,
      address: p.address,
      pickup_time: p.pickup_time,
      maps_url: p.maps_url,
      extra_charge: p.extra_charge,
      sort_order: p.sort_order,
    }));

    const { error: insertError } = await (supabase as any)
      .from("pickup_points")
      .insert(copies);
    if (insertError) return { error: insertError.message };

    return { success: true, count: copies.length };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to copy pickup points." };
  }
}
