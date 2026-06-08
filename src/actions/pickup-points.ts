"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireOrganizer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PickupPointRepository } from "@/lib/repositories";
import type { PickupPoint } from "@/types/database";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    const { supabase, organizerId } = await requireOrganizer();
    const eventOrgId = await getEventOrganizerId(supabase, eventId);
    if (eventOrgId !== organizerId) return { error: "Access denied." };

    if (!data.label?.trim()) return { error: "Pickup label is required." };
    if (!data.pickup_time?.trim()) return { error: "Pickup time is required." };

    const pickupRepo = new PickupPointRepository(supabase);

    // Determine sort_order from existing points count
    const existing = await pickupRepo.findByEventId(eventId);

    const inserted = await pickupRepo.create({
      trek_event_id: eventId,
      label: data.label.trim(),
      address: data.address?.trim() ?? null,
      pickup_time: data.pickup_time.trim(),
      maps_url: data.maps_url ?? null,
      extra_charge: data.extra_charge ?? 0,
      sort_order: existing.length + 1,
    });

    return { success: true, pointId: (inserted as any).id };
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
    const { supabase, organizerId } = await requireOrganizer();
    const pointOrgId = await getPickupOrganizerId(supabase, pointId);
    if (pointOrgId !== organizerId) return { error: "Access denied." };

    const updates: Record<string, unknown> = {};
    if (data.label !== undefined) updates.label = data.label.trim();
    if (data.address !== undefined) updates.address = data.address?.trim() || null;
    if (data.maps_url !== undefined) updates.maps_url = data.maps_url || null;
    if (data.pickup_time !== undefined) updates.pickup_time = data.pickup_time.trim();
    if (data.sort_order !== undefined) updates.sort_order = data.sort_order;
    if (data.extra_charge !== undefined) updates.extra_charge = data.extra_charge;

    if (Object.keys(updates).length === 0) return { error: "No fields to update." };

    // Get event ID for the pickup point
    const { data: ppData } = await (supabase as any)
      .from("pickup_points")
      .select("trek_event_id")
      .eq("id", pointId)
      .single();

    const pickupRepo = new PickupPointRepository(supabase);
    await pickupRepo.update(pointId, ppData.trek_event_id, updates);

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
    const { supabase, organizerId } = await requireOrganizer();
    const pointOrgId = await getPickupOrganizerId(supabase, pointId);
    if (pointOrgId !== organizerId) return { error: "Access denied." };

    // Get event ID for the pickup point
    const { data: ppData } = await (supabase as any)
      .from("pickup_points")
      .select("trek_event_id")
      .eq("id", pointId)
      .single();

    const pickupRepo = new PickupPointRepository(supabase);
    await pickupRepo.delete(pointId, ppData.trek_event_id);

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
    const pickupRepo = new PickupPointRepository(supabase);
    const data = await pickupRepo.findByEventId(eventId);
    return { data: data as PickupPoint[] };
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
    const { supabase, organizerId } = await requireOrganizer();

    // Verify organizer owns both events
    const [sourceOrgId, targetOrgId] = await Promise.all([
      getEventOrganizerId(supabase, sourceEventId),
      getEventOrganizerId(supabase, targetEventId),
    ]);

    if (sourceOrgId !== organizerId || targetOrgId !== organizerId) {
      return { error: "Access denied." };
    }

    const pickupRepo = new PickupPointRepository(supabase);

    // Fetch source pickup points
    const sourcePoints = await pickupRepo.findByEventId(sourceEventId);
    if (sourcePoints.length === 0) {
      return { error: "No pickup points found in source event." };
    }

    // Delete existing points in target event before copying
    const targetPoints = await pickupRepo.findByEventId(targetEventId);
    for (const tp of targetPoints) {
      await pickupRepo.delete((tp as any).id, targetEventId);
    }

    // Insert copies
    for (const p of sourcePoints) {
      await pickupRepo.create({
        trek_event_id: targetEventId,
        label: (p as any).label,
        address: (p as any).address,
        pickup_time: (p as any).pickup_time,
        maps_url: (p as any).maps_url,
        extra_charge: (p as any).extra_charge,
        sort_order: (p as any).sort_order,
      });
    }

    return { success: true, count: sourcePoints.length };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to copy pickup points." };
  }
}
