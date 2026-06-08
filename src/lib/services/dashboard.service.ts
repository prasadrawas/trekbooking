import type { OrganizerRepository } from "@/lib/repositories/organizer.repository";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalBookingsThisMonth: number;
  revenueThisMonth: number;
  upcomingTreksCount: number;
  avgRating: number;
}

interface UpcomingTrekItem {
  id: string;
  event_date: string;
  status: string;
  booked_seats: number;
  total_seats: number;
  trek: { title: string; difficulty: string; slug: string } | null;
}

interface RecentBookingItem {
  id: string;
  booking_number: string;
  booking_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  trek_title: string | null;
  event_date: string | null;
}

export interface DashboardResult {
  stats: DashboardStats;
  upcomingTreks: UpcomingTrekItem[];
  recentBookings: RecentBookingItem[];
  orgName: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class DashboardService {
  constructor(private organizerRepo: OrganizerRepository) {}

  /**
   * Aggregate dashboard data for an organizer:
   * - Stats: bookings this month, revenue this month, upcoming events count, avg rating
   * - Upcoming treks (next 3)
   * - Recent bookings (last 5)
   *
   * Uses Promise.all for parallel queries where possible.
   */
  async getOrganizerDashboard(
    profileId: string,
  ): Promise<DashboardResult> {
    // Fetch organizer summary
    const org = await this.organizerRepo.findDashboardSummary(profileId);
    if (!org) {
      throw new Error("Organizer not found");
    }

    // Fetch trek IDs belonging to this organizer
    const trekIds = await this.organizerRepo.findTrekIds(org.id);

    if (trekIds.length === 0) {
      return {
        stats: {
          totalBookingsThisMonth: 0,
          revenueThisMonth: 0,
          upcomingTreksCount: 0,
          avgRating: org.avg_rating ?? 0,
        },
        upcomingTreks: [],
        recentBookings: [],
        orgName: org.org_name,
      };
    }

    // Fetch event IDs (shared by booking count, revenue, and recent bookings)
    const eventIds = await this.organizerRepo.findEventIdsByTrekIds(trekIds);

    const today = new Date().toISOString();
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString();

    // Run all independent queries in parallel
    const [
      totalBookingsThisMonth,
      revenueThisMonth,
      upcomingTreksCount,
      upcomingTreksRaw,
      recentBookingsRaw,
    ] = await Promise.all([
      eventIds.length > 0
        ? this.organizerRepo.countBookingsSince(eventIds, monthStart)
        : 0,
      eventIds.length > 0
        ? this.organizerRepo.sumRevenueSince(eventIds, monthStart)
        : 0,
      this.organizerRepo.countUpcomingEvents(trekIds, today),
      this.organizerRepo.findUpcomingEvents(trekIds, today, 3),
      eventIds.length > 0
        ? this.organizerRepo.findRecentBookings(eventIds, 5)
        : [],
    ]);

    // Transform upcoming treks
    const upcomingTreks: UpcomingTrekItem[] = (upcomingTreksRaw as any[]).map(
      (row) => ({
        id: row.id,
        event_date: row.event_date,
        status: row.status,
        booked_seats: row.booked_seats,
        total_seats: row.total_seats,
        trek: row.treks ?? null,
      }),
    );

    // Transform recent bookings
    const recentBookings: RecentBookingItem[] = (
      recentBookingsRaw as any[]
    ).map((b) => ({
      id: b.id,
      booking_number: b.booking_number,
      booking_name: b.booking_name,
      total_amount: b.total_amount,
      status: b.status,
      created_at: b.created_at,
      trek_title: b.trek_events?.treks?.title ?? null,
      event_date: b.trek_events?.event_date ?? null,
    }));

    return {
      stats: {
        totalBookingsThisMonth,
        revenueThisMonth,
        upcomingTreksCount,
        avgRating: org.avg_rating ?? 0,
      },
      upcomingTreks,
      recentBookings,
      orgName: org.org_name,
    };
  }
}
