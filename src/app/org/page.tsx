"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  IndianRupee,
  Mountain,
  Star,
  TrendingUp,
  ArrowRight,
  Plus,
  Users,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface StatItem {
  label: string;
  subtitle: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  format: (v: number) => string;
}

interface UpcomingTrek {
  id: string;
  event_date: string;
  booked_seats: number;
  total_seats: number;
  trek: { title: string; difficulty: string; slug: string } | null;
}

interface RecentBooking {
  id: string;
  booking_number: string;
  booking_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  trek_title: string | null;
  event_date: string | null;
}

// ─── Mock fallback data ──────────────────────────────────────────────────────

const MOCK_UPCOMING: UpcomingTrek[] = [
  { id: "t1", event_date: "2026-06-14", booked_seats: 22, total_seats: 30, trek: { title: "Rajmachi Fort Trek", difficulty: "easy", slug: "rajmachi" } },
  { id: "t2", event_date: "2026-06-21", booked_seats: 18, total_seats: 25, trek: { title: "Harishchandragad Night Trek", difficulty: "difficult", slug: "harishchandragad" } },
  { id: "t3", event_date: "2026-06-28", booked_seats: 9, total_seats: 20, trek: { title: "Kalsubai Peak", difficulty: "moderate", slug: "kalsubai" } },
];

const MOCK_BOOKINGS: RecentBooking[] = [
  { id: "b1", booking_number: "SB-001", booking_name: "Priya Sharma", trek_title: "Rajmachi Fort Trek", event_date: "2026-06-14", total_amount: 1800, status: "confirmed", created_at: "2026-06-01" },
  { id: "b2", booking_number: "SB-002", booking_name: "Amit Kulkarni", trek_title: "Harishchandragad", event_date: "2026-06-21", total_amount: 2400, status: "confirmed", created_at: "2026-06-02" },
  { id: "b3", booking_number: "SB-003", booking_name: "Sneha Patil", trek_title: "Kalsubai Peak", event_date: "2026-06-28", total_amount: 1600, status: "pending", created_at: "2026-06-03" },
  { id: "b4", booking_number: "SB-004", booking_name: "Rahul Desai", trek_title: "Rajmachi Fort Trek", event_date: "2026-06-14", total_amount: 3600, status: "confirmed", created_at: "2026-06-04" },
  { id: "b5", booking_number: "SB-005", booking_name: "Meera Joshi", trek_title: "Bhimashankar Trek", event_date: "2026-07-05", total_amount: 2200, status: "cancelled", created_at: "2026-06-05" },
];

// ─── Count-up hook ───────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);

  useEffect(() => {
    start.current = null;
    const step = (timestamp: number) => {
      if (!start.current) start.current = timestamp;
      const elapsed = timestamp - start.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return value;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
  const animated = useCountUp(stat.value, 1000 + index * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: [0, 0, 0.58, 1] as [number, number, number, number] }}
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
          <p className="text-[11px] text-slate-400">{stat.subtitle}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconBg}`}>
          <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{stat.format(animated)}</p>
      </div>
    </motion.div>
  );
}

function difficultyColor(d: string) {
  const map: Record<string, string> = {
    easy: "bg-green-100 text-green-700",
    moderate: "bg-yellow-100 text-yellow-700",
    difficult: "bg-orange-100 text-orange-700",
    very_difficult: "bg-red-100 text-red-700",
  };
  return map[d] ?? "bg-slate-100 text-slate-600";
}

function difficultyLabel(d: string) {
  const map: Record<string, string> = {
    easy: "Easy",
    moderate: "Moderate",
    difficult: "Difficult",
    very_difficult: "Very Difficult",
  };
  return map[d] ?? d;
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    cancelled: "bg-rose-100 text-rose-700",
    completed: "bg-blue-100 text-blue-700",
  };
  return map[s] ?? "bg-slate-100 text-slate-600";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OrgHomePage() {
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("Your Organization");
  const [stats, setStats] = useState<StatItem[]>([]);
  const [upcomingTreks, setUpcomingTreks] = useState<UpcomingTrek[]>(MOCK_UPCOMING);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>(MOCK_BOOKINGS);
  const [isRealData, setIsRealData] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetch("/api/organizers/me/dashboard").then(r => r.ok ? r.json() : null);

        if (data) {
          setOrgName(data.orgName);

          const hasRealActivity =
            data.stats.totalBookingsThisMonth > 0 ||
            data.upcomingTreks.length > 0 ||
            data.recentBookings.length > 0;

          setStats([
            {
              label: "Total Bookings",
              subtitle: "this month",
              value: hasRealActivity ? data.stats.totalBookingsThisMonth : 142,
              icon: CalendarCheck,
              iconBg: "bg-blue-100",
              iconColor: "text-blue-600",
              format: (v: number) => Math.round(v).toString(),
            },
            {
              label: "Revenue",
              subtitle: "this month",
              value: hasRealActivity ? data.stats.revenueThisMonth : 284600,
              icon: IndianRupee,
              iconBg: "bg-emerald-100",
              iconColor: "text-emerald-600",
              format: (v: number) => formatPrice(Math.round(v)),
            },
            {
              label: "Upcoming Treks",
              subtitle: "next 30 days",
              value: hasRealActivity ? data.stats.upcomingTreksCount : 8,
              icon: Mountain,
              iconBg: "bg-violet-100",
              iconColor: "text-violet-600",
              format: (v: number) => Math.round(v).toString(),
            },
            {
              label: "Avg Rating",
              subtitle: "all time",
              value: data.stats.avgRating > 0 ? data.stats.avgRating : 4.7,
              icon: Star,
              iconBg: "bg-amber-100",
              iconColor: "text-amber-600",
              format: (v: number) => v.toFixed(1),
            },
          ]);

          if (data.upcomingTreks.length > 0) {
            setUpcomingTreks(data.upcomingTreks);
            setIsRealData(true);
          }

          if (data.recentBookings.length > 0) {
            setRecentBookings(data.recentBookings);
            setIsRealData(true);
          }
        }
      } catch {
        // Fallback to mock data silently
      } finally {
        setLoading(false);
      }
    }

    // Build default stats immediately
    setStats([
      { label: "Total Bookings", subtitle: "this month", value: 0, icon: CalendarCheck, iconBg: "bg-blue-100", iconColor: "text-blue-600", format: (v: number) => Math.round(v).toString() },
      { label: "Revenue", subtitle: "this month", value: 0, icon: IndianRupee, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", format: (v: number) => formatPrice(Math.round(v)) },
      { label: "Upcoming Treks", subtitle: "next 30 days", value: 0, icon: Mountain, iconBg: "bg-violet-100", iconColor: "text-violet-600", format: (v: number) => Math.round(v).toString() },
      { label: "Avg Rating", subtitle: "all time", value: 0, icon: Star, iconBg: "bg-amber-100", iconColor: "text-amber-600", format: (v: number) => v.toFixed(1) },
    ]);

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-2xl font-bold text-slate-900">
          Good morning, {orgName} 👋
        </h1>
        <p className="text-sm text-slate-500">
          Here&apos;s what&apos;s happening with your treks today.
          {!isRealData && (
            <span className="ml-2 text-xs text-amber-500">(Showing sample data — create treks to see real stats)</span>
          )}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      {/* Upcoming Treks + Recent Bookings */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Upcoming Treks */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.45 }}
          className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Upcoming Treks</h2>
            <Link href="/org/treks" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingTreks.length === 0 ? (
              <div className="text-center py-8">
                <Mountain className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No upcoming treks</p>
                <Link href="/org/treks/new" className="text-xs text-primary hover:underline mt-1 inline-block">
                  Create your first trek
                </Link>
              </div>
            ) : (
              upcomingTreks.map((trek, i) => {
                const fillPct = trek.total_seats > 0 ? Math.round((trek.booked_seats / trek.total_seats) * 100) : 0;
                const difficulty = trek.trek?.difficulty ?? "moderate";
                return (
                  <motion.div
                    key={trek.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.07 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800 leading-snug">
                          {trek.trek?.title ?? "Untitled Trek"}
                        </p>
                        <p className="text-[11px] text-slate-400">{formatDate(trek.event_date)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${difficultyColor(difficulty)}`}>
                          {difficultyLabel(difficulty)}
                        </span>
                        <Link
                          href={`/org/treks/${trek.id}/events`}
                          className="rounded-lg border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:border-primary hover:text-primary transition-colors"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${fillPct}%` }}
                          transition={{ delay: 0.5 + i * 0.07, duration: 0.6 }}
                          className={`h-full rounded-full ${
                            fillPct >= 90 ? "bg-rose-500" : fillPct >= 60 ? "bg-amber-400" : "bg-emerald-500"
                          }`}
                        />
                      </div>
                      <span className="text-[11px] tabular-nums text-slate-500 w-14 text-right">
                        {trek.booked_seats}/{trek.total_seats} seats
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.section>

        {/* Recent Bookings */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className="lg:col-span-3 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-base font-semibold text-slate-800">Recent Bookings</h2>
            <Link href="/org/bookings" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No bookings yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Trekker", "Trek", "Date", "Amount", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b, i) => (
                    <motion.tr
                      key={b.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + i * 0.06 }}
                      className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {b.booking_name.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800">{b.booking_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">
                        {b.trek_title ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {b.event_date ? formatDate(b.event_date) : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 tabular-nums">
                        {formatPrice(b.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusColor(b.status)}`}>
                          {b.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="flex flex-wrap gap-3"
      >
        <Link
          href="/org/treks/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" /> List New Trek
        </Link>
        <Link
          href="/org/bookings"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-primary/40 hover:text-primary active:scale-95 transition-all"
        >
          <Users className="h-4 w-4" /> View All Bookings
        </Link>
      </motion.div>
    </div>
  );
}
