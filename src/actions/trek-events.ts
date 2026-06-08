"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireOrganizer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TrekEventRepository, PickupPointRepository } from "@/lib/repositories";
import type { TrekEvent } from "@/types/database";

// ─── createEvent ──────────────────────────────────────────────────────────────

export interface CreateEventData {
  event_date: string;
  end_date?: string;
  reporting_time?: string;
  price: number;
  child_price?: number;
  total_seats: number;
  notes?: string;
}

export async function createEvent(
  trekId: string,
  data: CreateEventData,
): Promise<{ success: true; eventId: string } | { error: string }> {
  try {
    const { supabase, organizerId } = await requireOrganizer();

    // Verify trek ownership
    const { data: trek } = await (supabase as any)
      .from("treks")
      .select("id")
      .eq("id", trekId)
      .eq("organizer_id", organizerId)
      .single();
    if (!trek) return { error: "Trek not found or access denied" };

    if (!data.event_date) return { error: "Event date is required." };
    if (!data.price || data.price <= 0) return { error: "Price must be greater than zero." };
    if (!data.total_seats || data.total_seats <= 0) return { error: "Total seats must be greater than zero." };

    const eventRepo = new TrekEventRepository(supabase);
    const endDate = data.end_date ?? data.event_date;

    const inserted = await eventRepo.create({
      trek_id: trekId,
      event_date: data.event_date,
      end_date: endDate,
      reporting_time: data.reporting_time ?? "06:00",
      price: data.price,
      child_price: data.child_price ?? null,
      total_seats: data.total_seats,
      booked_seats: 0,
      status: "upcoming",
    } as any);

    return { success: true, eventId: inserted.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create event." };
  }
}

// ─── createBatchEvents ────────────────────────────────────────────────────────

export type ScheduleType = "single" | "weekly" | "biweekly" | "monthly" | "custom";

export interface BatchEventData {
  schedule_type: ScheduleType;
  event_date?: string;
  day_of_week?: number;
  start_date?: string;
  end_date_range?: string;
  day_of_month?: number;
  custom_dates?: string[];
  reporting_time: string;
  price: number;
  child_price?: number;
  total_seats: number;
  duration_days?: number;
}

function generateDates(data: BatchEventData): string[] {
  const dates: string[] = [];

  if (data.schedule_type === "single") {
    if (data.event_date) dates.push(data.event_date);
  } else if (data.schedule_type === "custom") {
    if (data.custom_dates) dates.push(...data.custom_dates);
  } else if (data.schedule_type === "weekly" || data.schedule_type === "biweekly") {
    if (data.day_of_week == null || !data.start_date || !data.end_date_range) return dates;
    const start = new Date(data.start_date);
    const end = new Date(data.end_date_range);
    const step = data.schedule_type === "biweekly" ? 14 : 7;
    const current = new Date(start);
    while (current.getDay() !== data.day_of_week) {
      current.setDate(current.getDate() + 1);
    }
    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + step);
    }
  } else if (data.schedule_type === "monthly") {
    if (data.day_of_month == null || !data.start_date || !data.end_date_range) return dates;
    const start = new Date(data.start_date);
    const end = new Date(data.end_date_range);
    const targetDay = Math.min(data.day_of_month, 28);
    const current = new Date(start.getFullYear(), start.getMonth(), targetDay);
    if (current < start) current.setMonth(current.getMonth() + 1);
    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setMonth(current.getMonth() + 1);
    }
  }

  const today = new Date().toISOString().split("T")[0];
  return dates.filter((d) => d >= today).sort();
}

export async function createBatchEvents(
  trekId: string,
  data: BatchEventData,
): Promise<{ success: true; count: number } | { error: string }> {
  try {
    const { supabase, organizerId } = await requireOrganizer();

    // Verify trek ownership
    const { data: trek } = await (supabase as any)
      .from("treks")
      .select("id")
      .eq("id", trekId)
      .eq("organizer_id", organizerId)
      .single();
    if (!trek) return { error: "Trek not found or access denied" };

    if (!data.price || data.price <= 0) return { error: "Price must be greater than zero." };
    if (!data.total_seats || data.total_seats <= 0) return { error: "Total seats must be greater than zero." };
    if (!data.reporting_time) return { error: "Reporting time is required." };

    const dates = generateDates(data);
    if (dates.length === 0) return { error: "No valid dates generated. Check your schedule settings." };
    if (dates.length > 52) return { error: "Cannot create more than 52 events at once." };

    const durationDays = data.duration_days ?? 1;
    const eventRepo = new TrekEventRepository(supabase);
    const pickupRepo = new PickupPointRepository(supabase);

    const rows = dates.map((eventDate) => {
      const endDate = new Date(eventDate);
      endDate.setDate(endDate.getDate() + durationDays - 1);
      return {
        trek_id: trekId,
        event_date: eventDate,
        end_date: durationDays > 1 ? endDate.toISOString().split("T")[0] : eventDate,
        reporting_time: data.reporting_time,
        price: data.price,
        child_price: data.child_price ?? null,
        total_seats: data.total_seats,
        booked_seats: 0,
        status: "upcoming",
      };
    });

    const insertedEvents = await eventRepo.createBatch(rows as any[]);

    // Auto-copy default pickup points from the trek to each new event
    const { data: trekData } = await (supabase as any)
      .from("treks")
      .select("default_pickup_points")
      .eq("id", trekId)
      .single();

    const defaultPickups = (trekData?.default_pickup_points ?? []) as Array<{
      label: string;
      address?: string;
      maps_url?: string;
      pickup_time: string;
      extra_charge?: number;
    }>;

    if (defaultPickups.length > 0 && insertedEvents.length > 0) {
      const pickupRows = insertedEvents.flatMap((event) =>
        defaultPickups.map((p, i) => ({
          trek_event_id: event.id,
          label: p.label,
          address: p.address ?? null,
          maps_url: p.maps_url ?? null,
          pickup_time: p.pickup_time,
          extra_charge: p.extra_charge ?? 0,
          sort_order: i,
        }))
      );

      await (supabase as any).from("pickup_points").insert(pickupRows);
    }

    return { success: true, count: rows.length };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create events." };
  }
}

// ─── updateEvent ──────────────────────────────────────────────────────────────

export interface UpdateEventData {
  event_date?: string;
  end_date?: string;
  price?: number;
  child_price?: number;
  total_seats?: number;
  notes?: string;
}

export async function updateEvent(
  eventId: string,
  data: UpdateEventData,
): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, organizerId } = await requireOrganizer();

    // Verify event ownership via trek
    const { data: eventRow } = await (supabase as any)
      .from("trek_events")
      .select("trek_id, treks!inner(organizer_id)")
      .eq("id", eventId)
      .single();
    if (!eventRow) return { error: "Event not found" };

    const treks = (eventRow as any).treks;
    const orgId = Array.isArray(treks) ? treks[0]?.organizer_id : treks?.organizer_id;
    if (orgId !== organizerId) return { error: "Access denied" };

    const updates: Record<string, unknown> = {};
    if (data.event_date !== undefined) updates.event_date = data.event_date;
    if (data.end_date !== undefined) updates.end_date = data.end_date;
    if (data.price !== undefined) {
      if (data.price <= 0) return { error: "Price must be greater than zero." };
      updates.price = data.price;
    }
    if (data.total_seats !== undefined) {
      if (data.total_seats <= 0) return { error: "Total seats must be greater than zero." };
      updates.total_seats = data.total_seats;
    }
    if (data.child_price !== undefined) updates.child_price = data.child_price;

    if (Object.keys(updates).length === 0) return { error: "No fields to update." };

    const eventRepo = new TrekEventRepository(supabase);
    await eventRepo.update(eventId, eventRow.trek_id, updates);

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update event." };
  }
}

// ─── cancelEvent ──────────────────────────────────────────────────────────────

export async function cancelEvent(
  eventId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, organizerId } = await requireOrganizer();

    // Verify event ownership via trek
    const { data: eventRow } = await (supabase as any)
      .from("trek_events")
      .select("trek_id, treks!inner(organizer_id)")
      .eq("id", eventId)
      .single();
    if (!eventRow) return { error: "Event not found" };

    const treks = (eventRow as any).treks;
    const orgId = Array.isArray(treks) ? treks[0]?.organizer_id : treks?.organizer_id;
    if (orgId !== organizerId) return { error: "Access denied" };

    // Cancel all confirmed bookings for this event
    const { data: confirmedBookings } = await (supabase as any)
      .from("bookings")
      .select("id")
      .eq("trek_event_id", eventId)
      .eq("status", "confirmed")
      .limit(1);

    if (confirmedBookings && (confirmedBookings as any[]).length > 0) {
      const { error: bookingError } = await (supabase as any)
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("trek_event_id", eventId)
        .eq("status", "confirmed");

      if (bookingError) return { error: bookingError.message };
    }

    const eventRepo = new TrekEventRepository(supabase);
    await eventRepo.delete(eventId, eventRow.trek_id);

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to cancel event." };
  }
}

// ─── getEventsByTrek ──────────────────────────────────────────────────────────

export interface EventWithPickups extends TrekEvent {
  pickup_points: Array<{ id: string; label: string; pickup_time: string; sort_order: number }>;
}

export async function getEventsByTrek(trekId: string): Promise<{
  data: EventWithPickups[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const eventRepo = new TrekEventRepository(supabase);

    const data = await eventRepo.findByTrekId(trekId);
    return { data: data as unknown as EventWithPickups[] };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch events.",
    };
  }
}
