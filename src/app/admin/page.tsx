"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  MountainSnow,
  Ticket,
  IndianRupee,
  TrendingUp,
  Clock,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Static card shape (values filled dynamically)
// ---------------------------------------------------------------------------

const STAT_CARD_DEFS = [
  { label: "Total Users", key: "users", change: "", positive: true, icon: Users, color: "bg-blue-500", lightBg: "bg-blue-50", textColor: "text-blue-600" },
  { label: "Total Organizers", key: "organizers", change: "", positive: true, icon: UserCheck, color: "bg-violet-500", lightBg: "bg-violet-50", textColor: "text-violet-600" },
  { label: "Active Treks", key: "treks", change: "", positive: true, icon: MountainSnow, color: "bg-emerald-500", lightBg: "bg-emerald-50", textColor: "text-emerald-600" },
  { label: "Total Bookings", key: "bookings", change: "", positive: true, icon: Ticket, color: "bg-amber-500", lightBg: "bg-amber-50", textColor: "text-amber-600" },
  { label: "Total Revenue", key: "revenue", change: "", positive: true, icon: IndianRupee, color: "bg-rose-500", lightBg: "bg-rose-50", textColor: "text-rose-600" },
  { label: "Commission Earned", key: "commission", change: "10% of revenue", positive: true, icon: TrendingUp, color: "bg-teal-500", lightBg: "bg-teal-50", textColor: "text-teal-600" },
] as const;

// Placeholder bars — kept as-is for chart shape
const BOOKING_BARS = [
  { day: "Mon", count: 0 },
  { day: "Tue", count: 0 },
  { day: "Wed", count: 0 },
  { day: "Thu", count: 0 },
  { day: "Fri", count: 0 },
  { day: "Sat", count: 0 },
  { day: "Sun", count: 0 },
];

const REVENUE_BARS = [
  { day: "Mon", amount: 0 },
  { day: "Tue", amount: 0 },
  { day: "Wed", amount: 0 },
  { day: "Thu", amount: 0 },
  { day: "Fri", amount: 0 },
  { day: "Sat", amount: 0 },
  { day: "Sun", amount: 0 },
];

const RECENT_ACTIVITY: { id: number; text: string; time: string }[] = [];

interface Stats {
  users: string;
  organizers: string;
  treks: string;
  bookings: string;
  revenue: string;
  commission: string;
  pendingOrganizers: number;
  pendingPayouts: number;
  failedPayouts: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function BarChart({
  bars,
  maxVal,
  valueLabel,
}: {
  bars: { day: string; count?: number; amount?: number }[];
  maxVal: number;
  valueLabel: (b: (typeof bars)[0]) => string;
}) {
  return (
    <div className="flex items-end gap-2 h-32">
      {bars.map((bar, i) => {
        const val = bar.count ?? bar.amount ?? 0;
        const pct = (val / maxVal) * 100;
        return (
          <div key={bar.day} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-slate-400 font-medium">{valueLabel(bar)}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${pct}%` }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0, 0, 0.58, 1] as [number, number, number, number] }}
              className="w-full rounded-t-sm bg-emerald-400/80 hover:bg-emerald-500 transition-colors cursor-default"
              style={{ minHeight: 4 }}
              title={valueLabel(bar)}
            />
            <span className="text-[10px] text-slate-500">{bar.day}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const cardVariants: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0, 0, 0.58, 1] as [number, number, number, number] } },
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    users: "0",
    organizers: "0",
    treks: "0",
    bookings: "0",
    revenue: formatPrice(0),
    commission: formatPrice(0),
    pendingOrganizers: 0,
    pendingPayouts: 0,
    failedPayouts: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [bookingsRes, organizersRes, treksRes, payoutsRes] = await Promise.allSettled([
          fetch("/api/bookings"),
          fetch("/api/organizers"),
          fetch("/api/treks"),
          fetch("/api/payouts"),
        ]);

        let bookingCount = 0;
        let totalRevenue = 0;
        let pendingPayouts = 0;
        let failedPayouts = 0;

        if (bookingsRes.status === "fulfilled" && bookingsRes.value.ok) {
          const d = await bookingsRes.value.json();
          const bookings: Array<{ status: string; amount: number }> = d.bookings ?? [];
          bookingCount = bookings.length;
          totalRevenue = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + (b.amount ?? 0), 0);
        }

        let organizerCount = 0;
        let pendingOrganizers = 0;
        if (organizersRes.status === "fulfilled" && organizersRes.value.ok) {
          const d = await organizersRes.value.json();
          const orgs: Array<{ status: string }> = d.organizers ?? [];
          organizerCount = orgs.length;
          pendingOrganizers = orgs.filter(o => o.status === "pending").length;
        }

        let trekCount = 0;
        if (treksRes.status === "fulfilled" && treksRes.value.ok) {
          const d = await treksRes.value.json();
          trekCount = (d.treks ?? []).length;
        }

        if (payoutsRes.status === "fulfilled" && payoutsRes.value.ok) {
          const d = await payoutsRes.value.json();
          const payouts: Array<{ status: string }> = d.payouts ?? [];
          pendingPayouts = payouts.filter(p => p.status === "pending").length;
          failedPayouts = payouts.filter(p => p.status === "failed").length;
        }

        const commission = totalRevenue * 0.1;
        setStats({
          users: "—",
          organizers: String(organizerCount),
          treks: String(trekCount),
          bookings: bookingCount.toLocaleString("en-IN"),
          revenue: formatPrice(totalRevenue),
          commission: formatPrice(commission),
          pendingOrganizers,
          pendingPayouts,
          failedPayouts,
        });
      } catch {
        // keep zeros
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  const statValues: Record<string, string> = {
    users: stats.users,
    organizers: stats.organizers,
    treks: stats.treks,
    bookings: stats.bookings,
    revenue: stats.revenue,
    commission: stats.commission,
  };

  const PENDING_ACTIONS = [
    { label: "Organizers awaiting approval", count: stats.pendingOrganizers, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { label: "Pending payouts to process", count: stats.pendingPayouts, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { label: "Failed payouts to review", count: stats.failedPayouts, color: "text-red-600 bg-red-50 border-red-200" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Overview Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Platform health at a glance</p>
        </div>
        {loadingStats && <Loader2 className="size-4 animate-spin text-slate-400" />}
      </div>

      {/* Stat Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 lg:grid-cols-3"
      >
        {STAT_CARD_DEFS.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              variants={cardVariants}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                  <p className="mt-1.5 text-xl font-bold text-slate-800 leading-none">
                    {loadingStats ? "—" : statValues[card.key]}
                  </p>
                  {card.change && (
                    <p className={`mt-1.5 text-[11px] font-medium ${card.textColor}`}>
                      {card.change}
                    </p>
                  )}
                </div>
                <div className={`shrink-0 rounded-lg p-2.5 ${card.lightBg}`}>
                  <Icon className={`size-5 ${card.textColor}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts + Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Bookings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Bookings — Last 7 Days</h2>
          <p className="text-xs text-slate-400 mb-4">Chart data coming soon</p>
          <BarChart
            bars={BOOKING_BARS}
            maxVal={1}
            valueLabel={(b) => String(b.count)}
          />
        </motion.div>

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-slate-700 mb-1">Revenue Trend — Last 7 Days</h2>
          <p className="text-xs text-slate-400 mb-4">Chart data coming soon</p>
          <BarChart
            bars={REVENUE_BARS}
            maxVal={1}
            valueLabel={(b) => `₹${b.amount}K`}
          />
        </motion.div>

        {/* Pending Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46 }}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Pending Actions</h2>
          <div className="space-y-3">
            {PENDING_ACTIONS.map((action) => (
              <div
                key={action.label}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 ${action.color}`}
              >
                <span className="text-xs font-medium">{action.label}</span>
                <span className="text-lg font-bold">{loadingStats ? "—" : action.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <Clock className="size-3.5" />
            <span>Updated just now</span>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      {RECENT_ACTIVITY.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.54 }}
          className="rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-700">Recent Activity</h2>
          </div>
          <ul className="divide-y divide-slate-50">
            {RECENT_ACTIVITY.map((item) => (
              <li key={item.id} className="flex items-start gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 leading-relaxed">{item.text}</p>
                </div>
                <span className="shrink-0 text-[11px] text-slate-400 mt-0.5">{item.time}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
