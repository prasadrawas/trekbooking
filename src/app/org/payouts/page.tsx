"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wallet,
  Clock,
  CheckCircle,
  Building2,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import { Pagination } from "@/components/shared/pagination";
import { formatPrice } from "@/lib/utils";
import { COMMISSION_RATE } from "@/lib/constants";

// ─── Mock Data ─────────────────────────────────────────────────────────────────

type PayoutStatus = "paid" | "processing" | "pending";

interface Payout {
  id: string;
  trek: string;
  eventDate: string;
  totalCollected: number;
  commission: number;
  payoutAmount: number;
  status: PayoutStatus;
  paidDate: string | null;
}

const MOCK_PAYOUTS: Payout[] = [
  {
    id: "py1",
    trek: "Rajmachi Fort Trek",
    eventDate: "2026-05-31",
    totalCollected: 54000,
    commission: 5400,
    payoutAmount: 48600,
    status: "paid",
    paidDate: "2026-06-03",
  },
  {
    id: "py2",
    trek: "Harishchandragad Night Trek",
    eventDate: "2026-05-17",
    totalCollected: 47500,
    commission: 4750,
    payoutAmount: 42750,
    status: "paid",
    paidDate: "2026-05-20",
  },
  {
    id: "py3",
    trek: "Kalsubai Peak Sunrise",
    eventDate: "2026-05-10",
    totalCollected: 32000,
    commission: 3200,
    payoutAmount: 28800,
    status: "paid",
    paidDate: "2026-05-13",
  },
  {
    id: "py4",
    trek: "Rajmachi Fort Trek",
    eventDate: "2026-06-14",
    totalCollected: 39600,
    commission: 3960,
    payoutAmount: 35640,
    status: "processing",
    paidDate: null,
  },
  {
    id: "py5",
    trek: "Harishchandragad Night Trek",
    eventDate: "2026-06-21",
    totalCollected: 47500,
    commission: 4750,
    payoutAmount: 42750,
    status: "pending",
    paidDate: null,
  },
  {
    id: "py6",
    trek: "Bhimashankar Trek",
    eventDate: "2026-04-20",
    totalCollected: 28800,
    commission: 2880,
    payoutAmount: 25920,
    status: "paid",
    paidDate: "2026-04-23",
  },
  {
    id: "py7",
    trek: "Rajmachi Fort Trek",
    eventDate: "2026-04-06",
    totalCollected: 61200,
    commission: 6120,
    payoutAmount: 55080,
    status: "paid",
    paidDate: "2026-04-09",
  },
  {
    id: "py8",
    trek: "Kalsubai Peak Sunrise",
    eventDate: "2026-06-28",
    totalCollected: 21600,
    commission: 2160,
    payoutAmount: 19440,
    status: "pending",
    paidDate: null,
  },
];

function mockSummary() {
  const totalEarned = MOCK_PAYOUTS.filter((p) => p.status === "paid").reduce(
    (sum, p) => sum + p.payoutAmount,
    0
  );
  const pendingAmount = MOCK_PAYOUTS.filter((p) => p.status !== "paid").reduce(
    (sum, p) => sum + p.payoutAmount,
    0
  );
  const lastPayout = MOCK_PAYOUTS.filter((p) => p.status === "paid").sort(
    (a, b) => ((b.paidDate ?? "") > (a.paidDate ?? "") ? 1 : -1)
  )[0];
  return {
    totalEarned,
    pendingAmount,
    lastPayoutDate: lastPayout?.paidDate ?? null,
    lastPayoutAmount: lastPayout?.payoutAmount ?? 0,
  };
}

const PER_PAGE = 5;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusConfig(status: PayoutStatus) {
  const map: Record<PayoutStatus, { label: string; className: string; icon: React.ElementType }> = {
    paid: { label: "Paid", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    processing: { label: "Processing", className: "bg-blue-100 text-blue-700", icon: Clock },
    pending: { label: "Pending", className: "bg-amber-100 text-amber-700", icon: Clock },
  };
  return map[status];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PayoutsPage() {
  const [page, setPage] = useState(1);
  const [payouts, setPayouts] = useState<Payout[]>(MOCK_PAYOUTS);
  const [summary, setSummary] = useState(mockSummary());
  const [isMock, setIsMock] = useState(true);
  const [loading, setLoading] = useState(true);
  const [bankName, setBankName] = useState<string | null>(null);
  const [bankIfsc, setBankIfsc] = useState<string | null>(null);
  const [bankAccountName, setBankAccountName] = useState<string | null>(null);

  useEffect(() => {
    // Fetch real bank details
    fetch("/api/organizers/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.organizer) {
          setBankName(data.organizer.bank_account_number ? "Bank" : null);
          setBankIfsc(data.organizer.bank_ifsc ?? null);
          setBankAccountName(data.organizer.bank_account_name ?? null);
        }
      })
      .catch(() => { /* keep null */ });

    fetch("/api/payouts").then(r => r.ok ? r.json() : null).then((data) => {
      if (data && data.payouts.length > 0) {
        setPayouts(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.payouts.map((p: any) => ({
            id: String(p.id ?? ""),
            trek: String(p.trek_title ?? ""),
            eventDate: String(p.event_date ?? ""),
            totalCollected: Number(p.total_collected ?? 0),
            commission: Number(p.commission ?? 0),
            payoutAmount: Number(p.payout_amount ?? 0),
            status: (p.status ?? "pending") as PayoutStatus,
            paidDate: p.paid_at ? String(p.paid_at) : null,
          }))
        );
        setSummary({
          totalEarned: data.summary.totalEarned ?? 0,
          pendingAmount: data.summary.pendingAmount ?? 0,
          lastPayoutDate: data.summary.lastPayoutDate ?? null,
          lastPayoutAmount: data.summary.lastPayoutAmount ?? 0,
        });
        setIsMock(false);
      }
      setLoading(false);
    });
  }, []);

  const totalPages = Math.ceil(payouts.length / PER_PAGE);
  const paginated = payouts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Payouts</h1>
          {!loading && isMock && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
              Sample data
            </span>
          )}
          {loading && (
            <span className="text-sm text-slate-400">Loading…</span>
          )}
        </div>
        <p className="text-sm text-slate-500">
          Platform commission: {(COMMISSION_RATE * 100).toFixed(0)}% · Payouts initiated {3} days after trek completion
        </p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Earned",
            subtitle: "all time",
            value: formatPrice(summary.totalEarned),
            icon: TrendingUp,
            color: "bg-emerald-100",
            iconColor: "text-emerald-600",
          },
          {
            label: "Pending Payout",
            subtitle: "in queue",
            value: formatPrice(summary.pendingAmount),
            icon: Clock,
            color: "bg-amber-100",
            iconColor: "text-amber-600",
          },
          {
            label: "Last Payout",
            subtitle: summary.lastPayoutDate ? formatDate(summary.lastPayoutDate) : "—",
            value: formatPrice(summary.lastPayoutAmount),
            icon: Wallet,
            color: "bg-blue-100",
            iconColor: "text-blue-600",
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className="text-[11px] text-slate-400">{card.subtitle}</p>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.color}`}>
                <card.icon className={`h-4.5 w-4.5 ${card.iconColor}`} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Bank account info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <Building2 className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {bankName ?? "Bank account"}
            </p>
            <p className="text-xs text-slate-500">
              {bankIfsc ? `IFSC: ${bankIfsc}` : "IFSC: Not set"}
              {bankAccountName ? ` · Account: ${bankAccountName}` : " · Account name: Not set"}
            </p>
          </div>
        </div>
        <Link
          href="/org/settings"
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          Update
          <ExternalLink className="h-3 w-3" />
        </Link>
      </motion.div>

      {/* Payout table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Trek", "Event Date", "Collected", `Commission (${(COMMISSION_RATE * 100).toFixed(0)}%)`, "Payout", "Status", "Paid Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((payout, i) => {
                const sc = statusConfig(payout.status);
                return (
                  <motion.tr
                    key={payout.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[160px] truncate">
                      {payout.trek}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatDate(payout.eventDate)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">
                      {formatPrice(payout.totalCollected)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-rose-600 font-medium">
                      −{formatPrice(payout.commission)}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-slate-900">
                      {formatPrice(payout.payoutAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${sc.className}`}>
                        <sc.icon className="h-3 w-3" />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {payout.paidDate ? formatDate(payout.paidDate) : "—"}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
