/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Encapsulates all Supabase queries for the `payouts` table.
 */
export class PayoutRepository {
  constructor(private client: SupabaseClient<Database>) {}

  /**
   * List payouts with pagination, optional organizer and status filters.
   * Includes related organizer and trek event info.
   */
  async findPaginated({
    organizerId,
    status,
    page,
    limit,
  }: {
    organizerId?: string | null;
    status?: string | null;
    page: number;
    limit: number;
  }) {
    const offset = (page - 1) * limit;

    let query = (this.client as any)
      .from("payouts")
      .select(`
        id,
        total_collected,
        commission,
        payout_amount,
        status,
        paid_at,
        reference_id,
        created_at,
        organizers (
          id,
          org_name,
          slug
        ),
        trek_events (
          id,
          event_date,
          treks (
            id,
            title,
            slug
          )
        )
      `, { count: "exact" });

    if (organizerId) {
      query = query.eq("organizer_id", organizerId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`PayoutRepository.findPaginated: ${error.message}`);
    return { payouts: data ?? [], total: count ?? 0 };
  }

  /**
   * Fetch summary totals (payout_amount and status) for an organizer.
   * Used to compute totalEarned and pendingAmount.
   */
  async findSummary(organizerId?: string | null) {
    let query = (this.client as any)
      .from("payouts")
      .select("payout_amount, status")
      .limit(10000);

    if (organizerId) {
      query = query.eq("organizer_id", organizerId);
    }

    const { data, error } = await query;

    if (error) throw new Error(`PayoutRepository.findSummary: ${error.message}`);
    return (data ?? []) as { payout_amount: number; status: string }[];
  }

  /**
   * Create a new payout record. Returns the full inserted row.
   */
  async create(values: {
    organizer_id: string;
    trek_event_id: string;
    total_collected: number;
    commission: number;
    payout_amount: number;
    status?: string;
    reference_id?: string | null;
  }) {
    const { data, error } = await (this.client as any)
      .from("payouts")
      .insert(values)
      .select("*")
      .single();

    if (error) throw new Error(`PayoutRepository.create: ${error.message}`);
    return data;
  }

  /**
   * Update a payout's status (and optionally paid_at / reference_id).
   * Returns the updated row.
   */
  async updateStatus(
    payoutId: string,
    updates: { status: string; paid_at?: string | null; reference_id?: string | null },
  ) {
    const { data, error } = await (this.client as any)
      .from("payouts")
      .update(updates)
      .eq("id", payoutId)
      .select("*")
      .single();

    if (error) throw new Error(`PayoutRepository.updateStatus: ${error.message}`);
    return data;
  }
}
