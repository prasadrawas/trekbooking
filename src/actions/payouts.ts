"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireAuth, assertAdmin } from "@/lib/auth";
import { requireOrganizer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { COMMISSION_RATE } from "@/lib/constants";
import { PayoutRepository, OrganizerRepository } from "@/lib/repositories";

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
    const { user } = await requireAuth();
    assertAdmin(user);

    const supabase = createAdminClient();
    const payoutRepo = new PayoutRepository(supabase);

    const { payouts } = await payoutRepo.findPaginated({
      status: "pending",
      page: 1,
      limit: 100,
    });

    const result: PendingPayoutItem[] = (payouts as any[]).map((p: any) => {
      const organizer = Array.isArray(p.organizers) ? p.organizers[0] : p.organizers;
      const events = Array.isArray(p.trek_events) ? p.trek_events[0] : p.trek_events;
      const trek = events
        ? Array.isArray(events.treks) ? events.treks[0] : events.treks
        : null;

      return {
        id: p.id,
        organizer_id: p.organizer_id ?? organizer?.id ?? "",
        trek_event_id: p.trek_event_id ?? events?.id ?? "",
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
    const { user } = await requireAuth();
    assertAdmin(user);

    const supabase = createAdminClient();
    const payoutRepo = new PayoutRepository(supabase);

    // Fetch payout record
    const { data: payoutRaw } = await (supabase as any)
      .from("payouts")
      .select("id, status, organizer_id, payout_amount, organizers(razorpay_fund_account_id)")
      .eq("id", payoutId)
      .single();

    if (!payoutRaw) return { error: "Payout not found." };
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
    await payoutRepo.updateStatus(payoutId, { status: "processing" });

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
          await payoutRepo.updateStatus(payoutId, { status: "failed" });
          return { error: errBody?.description ?? "Razorpay payout failed." };
        }

        const rpPayout = await response.json() as { id: string };

        await payoutRepo.updateStatus(payoutId, {
          status: "completed",
          reference_id: rpPayout.id,
          paid_at: new Date().toISOString(),
        });
      } catch (rpErr) {
        await payoutRepo.updateStatus(payoutId, { status: "failed" });
        return { error: rpErr instanceof Error ? rpErr.message : "Payout processing failed." };
      }
    } else {
      // No fund account — mark as completed manually (offline payout)
      await payoutRepo.updateStatus(payoutId, {
        status: "completed",
        paid_at: new Date().toISOString(),
      });
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
    const { user } = await requireAuth();
    assertAdmin(user);

    const supabase = createAdminClient();
    const payoutRepo = new PayoutRepository(supabase);

    // Fetch event with its trek's organizer
    const { data: eventRaw, error: eventError } = await (supabase as any)
      .from("trek_events")
      .select(
        `id, trek_id, status,
        treks(organizer_id, organizers(id, commission_rate, free_period_ends_at))`,
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

    // Determine effective commission
    let effectiveCommission = COMMISSION_RATE;
    if (freePeriodEndsAt && new Date() <= new Date(freePeriodEndsAt)) {
      effectiveCommission = 0;
    } else if (commissionRate != null) {
      effectiveCommission = commissionRate;
    }

    // Fetch confirmed bookings
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

    // Check if payout already exists for this event
    const { payouts: existingPayouts } = await payoutRepo.findPaginated({
      organizerId,
      status: null,
      page: 1,
      limit: 1,
    });
    const hasExisting = (existingPayouts as any[]).some(
      (p: any) => (p.trek_events?.id ?? p.trek_event_id) === eventId,
    );
    if (hasExisting) {
      return { error: "A payout already exists for this event." };
    }

    // Aggregate totals
    const totalCollected = bookings.reduce((sum, b) => sum + b.total_amount, 0);
    const commission = Math.round(totalCollected * effectiveCommission * 100) / 100;
    const payoutAmount = totalCollected - commission;

    await payoutRepo.create({
      organizer_id: organizerId,
      trek_event_id: eventId,
      total_collected: totalCollected,
      commission: commission,
      payout_amount: payoutAmount,
      status: "pending",
    });

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
    const { supabase, organizerId } = await requireOrganizer();
    const payoutRepo = new PayoutRepository(supabase);

    const { payouts } = await payoutRepo.findPaginated({
      organizerId,
      status: null,
      page: 1,
      limit: 100,
    });

    const result: OrganizerPayoutItem[] = (payouts as any[]).map((p: any) => {
      const events = Array.isArray(p.trek_events) ? p.trek_events[0] : p.trek_events;
      const trek = events
        ? Array.isArray(events.treks) ? events.treks[0] : events.treks
        : null;

      return {
        id: p.id,
        organizer_id: p.organizer_id ?? organizerId,
        trek_event_id: p.trek_event_id ?? events?.id ?? "",
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
