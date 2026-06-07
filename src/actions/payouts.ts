"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMMISSION_RATE } from "@/lib/constants";
import type { Payout } from "@/types/database";

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

/**
 * Verifies the current user is a platform admin.
 * Admins are identified by their email matching ADMIN_EMAIL env var,
 * or by a role stored in user metadata.
 */
function assertAdmin(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): void {
  const adminEmail = process.env.ADMIN_EMAIL;
  const isAdminByEmail = adminEmail && user.email === adminEmail;
  const isAdminByMeta = user.user_metadata?.role === "admin";
  if (!isAdminByEmail && !isAdminByMeta) {
    throw new Error("Admin access required.");
  }
}

// ─── getPendingPayouts ────────────────────────────────────────────────────────

export interface PendingPayoutItem {
  id: string;
  organizer_id: string;
  trek_event_id: string;
  total_collected: number;
  commission: number;
  payout_amount: number;
  status: string;
  paid_at: string | null;
  reference_id: string | null;
  created_at: string;
  organizer_name: string;
  trek_title: string;
  event_date: string;
}

export async function getPendingPayouts(): Promise<{
  data: PendingPayoutItem[];
  error?: string;
}> {
  try {
    const { user } = await getAuthenticatedUser();
    assertAdmin(user);

    const supabase = createAdminClient();

    const { data, error } = await (supabase as any)
      .from("payouts")
      .select(
        `
        *,
        organizers(org_name),
        trek_events(
          event_date,
          treks(title)
        )
        `,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) return { data: [], error: error.message };

    const result: PendingPayoutItem[] = ((data as any[]) ?? []).map((p: any) => {
      const organizer = Array.isArray(p.organizers) ? p.organizers[0] : p.organizers;
      const events = Array.isArray(p.trek_events) ? p.trek_events[0] : p.trek_events;
      const trek = events
        ? Array.isArray(events.treks) ? events.treks[0] : events.treks
        : null;

      return {
        id: p.id,
        organizer_id: p.organizer_id,
        trek_event_id: p.trek_event_id,
        total_collected: p.total_collected,
        commission: p.commission,
        payout_amount: p.payout_amount,
        status: p.status,
        paid_at: p.paid_at,
        reference_id: p.reference_id,
        created_at: p.created_at,
        organizer_name: organizer?.org_name ?? "",
        trek_title: trek?.title ?? "",
        event_date: events?.event_date ?? "",
      } satisfies PendingPayoutItem;
    });

    return { data: result };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch pending payouts.",
    };
  }
}

// ─── processPayout ────────────────────────────────────────────────────────────

export async function processPayout(
  payoutId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const { user } = await getAuthenticatedUser();
    assertAdmin(user);

    const supabase = createAdminClient();

    // Fetch payout record
    const { data: payoutRaw, error: fetchError } = await (supabase as any)
      .from("payouts")
      .select("id, status, organizer_id, payout_amount, organizers(razorpay_fund_account_id)")
      .eq("id", payoutId)
      .single();

    if (fetchError || !payoutRaw) return { error: "Payout not found." };
    const payout = payoutRaw as {
      id: string;
      status: string;
      organizer_id: string;
      payout_amount: number;
      organizers: { razorpay_fund_account_id: string | null } | Array<{ razorpay_fund_account_id: string | null }>;
    };

    if (payout.status === "completed") return { error: "Payout has already been processed." };
    if (payout.status !== "pending") {
      return { error: `Payout is in '${payout.status}' state and cannot be processed.` };
    }

    const organizerData = Array.isArray(payout.organizers) ? payout.organizers[0] : payout.organizers;
    const fundAccountId = organizerData?.razorpay_fund_account_id;

    // Mark as processing
    await (supabase as any)
      .from("payouts")
      .update({ status: "processing" })
      .eq("id", payoutId);

    if (fundAccountId) {
      try {
        const razorpayKeyId = process.env.RAZORPAY_KEY_ID!;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET!;
        const authHeader = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");

        const response = await fetch("https://api.razorpay.com/v1/payouts", {
          method: "POST",
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/json",
            "X-Payout-Idempotency": payoutId,
          },
          body: JSON.stringify({
            account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
            fund_account_id: fundAccountId,
            amount: payout.payout_amount * 100, // paise
            currency: "INR",
            mode: "IMPS",
            purpose: "vendor_payout",
            queue_if_low_balance: true,
            reference_id: payoutId,
            narration: "TrekBooking Trek Payout",
          }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({})) as { description?: string };
          await (supabase as any)
            .from("payouts")
            .update({ status: "failed" })
            .eq("id", payoutId);
          return { error: errBody?.description ?? "Razorpay payout failed." };
        }

        const rpPayout = await response.json() as { id: string };

        await (supabase as any)
          .from("payouts")
          .update({
            status: "completed",
            reference_id: rpPayout.id,
            paid_at: new Date().toISOString(),
          })
          .eq("id", payoutId);
      } catch (rpErr) {
        await (supabase as any)
          .from("payouts")
          .update({ status: "failed" })
          .eq("id", payoutId);
        return { error: rpErr instanceof Error ? rpErr.message : "Payout processing failed." };
      }
    } else {
      // No fund account — mark as completed manually (offline payout)
      await (supabase as any)
        .from("payouts")
        .update({
          status: "completed",
          paid_at: new Date().toISOString(),
        })
        .eq("id", payoutId);
    }

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to process payout." };
  }
}

// ─── createPayoutForEvent ─────────────────────────────────────────────────────

export async function createPayoutForEvent(
  eventId: string,
): Promise<{ success: true; payoutsCreated: number } | { error: string }> {
  try {
    const { user } = await getAuthenticatedUser();
    assertAdmin(user);

    const supabase = createAdminClient();

    // Fetch event with its trek's organizer
    const { data: eventRaw, error: eventError } = await (supabase as any)
      .from("trek_events")
      .select(
        `
        id, trek_id, status,
        treks(organizer_id, organizers(id, commission_rate, free_period_ends_at))
        `,
      )
      .eq("id", eventId)
      .single();

    if (eventError || !eventRaw) return { error: "Event not found." };
    const event = eventRaw as { id: string; trek_id: string; status: string; treks: any };

    if (event.status !== "completed") return { error: "Payouts can only be created for completed events." };

    const treks = Array.isArray(event.treks) ? event.treks[0] : event.treks;
    const organizers = treks
      ? Array.isArray(treks.organizers) ? treks.organizers[0] : treks.organizers
      : null;

    if (!organizers) return { error: "Organizer not found for this event." };

    const organizerId: string = organizers.id;
    const commissionRate: number = organizers.commission_rate;
    const freePeriodEndsAt: string | null = organizers.free_period_ends_at;

    // Determine effective commission — respect free period
    let effectiveCommission = COMMISSION_RATE;
    if (freePeriodEndsAt && new Date() <= new Date(freePeriodEndsAt)) {
      effectiveCommission = 0;
    } else if (commissionRate != null) {
      effectiveCommission = commissionRate;
    }

    // Fetch all confirmed bookings for this event
    const { data: bookingsRaw, error: bookingsError } = await (supabase as any)
      .from("bookings")
      .select("id, total_amount")
      .eq("trek_event_id", eventId)
      .eq("status", "confirmed");

    if (bookingsError) return { error: bookingsError.message };
    const bookings = (bookingsRaw as Array<{ id: string; total_amount: number }> | null) ?? [];
    if (bookings.length === 0) {
      return { error: "No confirmed bookings found for this event." };
    }

    // Check which bookings already have a payout for this event
    const { data: existingPayoutsRaw } = await (supabase as any)
      .from("payouts")
      .select("trek_event_id")
      .eq("organizer_id", organizerId)
      .eq("trek_event_id", eventId);

    // If a payout already exists for this event, skip
    if (existingPayoutsRaw && (existingPayoutsRaw as any[]).length > 0) {
      return { error: "A payout already exists for this event." };
    }

    // Aggregate totals for a single event-level payout record
    const totalCollected = bookings.reduce((sum, b) => sum + b.total_amount, 0);
    const commission = Math.round(totalCollected * effectiveCommission * 100) / 100;
    const payoutAmount = totalCollected - commission;

    const { error: insertError } = await (supabase as any).from("payouts").insert({
      organizer_id: organizerId,
      trek_event_id: eventId,
      total_collected: totalCollected,
      commission: commission,
      payout_amount: payoutAmount,
      status: "pending",
    });

    if (insertError) return { error: insertError.message };

    return { success: true, payoutsCreated: 1 };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create payouts." };
  }
}

// ─── getOrganizerPayouts ──────────────────────────────────────────────────────

export interface OrganizerPayoutItem {
  id: string;
  organizer_id: string;
  trek_event_id: string;
  total_collected: number;
  commission: number;
  payout_amount: number;
  status: string;
  paid_at: string | null;
  reference_id: string | null;
  created_at: string;
  trek_title: string;
  event_date: string;
}

export async function getOrganizerPayouts(): Promise<{
  data: OrganizerPayoutItem[];
  error?: string;
}> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    // Get organizer record
    const { data: organizerRaw, error: orgError } = await (supabase as any)
      .from("organizers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (orgError || !organizerRaw) return { data: [], error: "Organizer profile not found." };
    const organizer = organizerRaw as { id: string };

    const { data, error } = await (supabase as any)
      .from("payouts")
      .select(
        `
        *,
        trek_events(
          event_date,
          treks(title)
        )
        `,
      )
      .eq("organizer_id", organizer.id)
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };

    const result: OrganizerPayoutItem[] = ((data as any[]) ?? []).map((p: any) => {
      const events = Array.isArray(p.trek_events) ? p.trek_events[0] : p.trek_events;
      const trek = events
        ? Array.isArray(events.treks) ? events.treks[0] : events.treks
        : null;

      return {
        id: p.id,
        organizer_id: p.organizer_id,
        trek_event_id: p.trek_event_id,
        total_collected: p.total_collected,
        commission: p.commission,
        payout_amount: p.payout_amount,
        status: p.status,
        paid_at: p.paid_at,
        reference_id: p.reference_id,
        created_at: p.created_at,
        trek_title: trek?.title ?? "",
        event_date: events?.event_date ?? "",
      } satisfies OrganizerPayoutItem;
    });

    return { data: result };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch payouts.",
    };
  }
}
