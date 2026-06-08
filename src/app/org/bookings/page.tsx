"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Download, Search, Eye, CalendarDays, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { formatPrice } from "@/lib/utils";

// ─── Mock Data ─────────────────────────────────────────────────────────────────

type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed";

interface Booking {
  id: string;
  bookingNo: string;
  trekker: string;
  trek: string;
  date: string;
  adults: number;
  children: number;
  amount: number;
  status: BookingStatus;
}

const ALL_BOOKINGS: Booking[] = [
  { id: "b1", bookingNo: "SB-2026-0142", trekker: "Priya Sharma", trek: "Rajmachi Fort Trek", date: "2026-06-14", adults: 2, children: 1, amount: 5400, status: "confirmed" },
  { id: "b2", bookingNo: "SB-2026-0143", trekker: "Amit Kulkarni", trek: "Harishchandragad Night Trek", date: "2026-06-21", adults: 1, children: 0, amount: 1900, status: "confirmed" },
  { id: "b3", bookingNo: "SB-2026-0144", trekker: "Sneha Patil", trek: "Kalsubai Peak Sunrise", date: "2026-06-28", adults: 3, children: 0, amount: 4800, status: "pending" },
  { id: "b4", bookingNo: "SB-2026-0145", trekker: "Rahul Desai", trek: "Rajmachi Fort Trek", date: "2026-06-14", adults: 4, children: 0, amount: 7200, status: "confirmed" },
  { id: "b5", bookingNo: "SB-2026-0146", trekker: "Meera Joshi", trek: "Bhimashankar Trek", date: "2026-07-05", adults: 2, children: 2, amount: 5400, status: "cancelled" },
  { id: "b6", bookingNo: "SB-2026-0147", trekker: "Kiran Pawar", trek: "Rajmachi Fort Trek", date: "2026-05-31", adults: 1, children: 0, amount: 1800, status: "completed" },
  { id: "b7", bookingNo: "SB-2026-0148", trekker: "Pooja Nair", trek: "Harishchandragad Night Trek", date: "2026-06-21", adults: 2, children: 0, amount: 3800, status: "confirmed" },
  { id: "b8", bookingNo: "SB-2026-0149", trekker: "Suresh More", trek: "Kalsubai Peak Sunrise", date: "2026-06-28", adults: 1, children: 1, amount: 2400, status: "confirmed" },
  { id: "b9", bookingNo: "SB-2026-0150", trekker: "Divya Kapoor", trek: "Rajmachi Fort Trek", date: "2026-06-14", adults: 3, children: 0, amount: 5400, status: "pending" },
  { id: "b10", bookingNo: "SB-2026-0151", trekker: "Arun Shah", trek: "Bhimashankar Trek", date: "2026-07-05", adults: 2, children: 1, amount: 5000, status: "confirmed" },
];

const TREKS = ["All Treks", "Rajmachi Fort Trek", "Harishchandragad Night Trek", "Kalsubai Peak Sunrise", "Bhimashankar Trek"];
const STATUSES = ["All Status", "confirmed", "pending", "cancelled", "completed"];

const PER_PAGE = 6;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    cancelled: "bg-rose-100 text-rose-700",
    completed: "bg-slate-100 text-slate-600",
  };
  return map[s] ?? "bg-slate-100 text-slate-600";
}

function downloadCSV(bookings: Booking[]) {
  const headers = ["Booking #", "Trekker", "Trek", "Date", "Adults", "Children", "Amount", "Status"];
  const rows = bookings.map((b) => [
    b.bookingNo, b.trekker, b.trek, b.date, b.adults, b.children, b.amount, b.status,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bookings.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrgBookingsPage() {
  const [search, setSearch] = useState("");
  const [trekFilter, setTrekFilter] = useState("All Treks");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [bookings, setBookings] = useState<Booking[]>(ALL_BOOKINGS);
  const [loading, setLoading] = useState(true);
  const [isMockData, setIsMockData] = useState(true);

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.ok ? r.json() : null)
      .then((result) => {
        if (!result) return;
        const bookingList = result.bookings ?? result ?? [];
        if (bookingList.length > 0) {
          const mapped: Booking[] = bookingList.map((b: { id: string; booking_number: string; booking_name: string; trek_title?: string; event_date?: string; created_at: string; num_adults: number; num_children: number; total_amount: number; status: string }) => ({
            id: b.id,
            bookingNo: b.booking_number,
            trekker: b.booking_name,
            trek: b.trek_title ?? "—",
            date: b.event_date ?? b.created_at.slice(0, 10),
            adults: b.num_adults,
            children: b.num_children,
            amount: b.total_amount,
            status: b.status as BookingStatus,
          }));
          setBookings(mapped);
          setIsMockData(false);
        }
      })
      .catch(() => {
        // silently fall back to mock data
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        b.trekker.toLowerCase().includes(search.toLowerCase()) ||
        b.bookingNo.toLowerCase().includes(search.toLowerCase());
      const matchTrek = trekFilter === "All Treks" || b.trek === trekFilter;
      const matchStatus = statusFilter === "All Status" || b.status === statusFilter;
      const matchFrom = !dateFrom || b.date >= dateFrom;
      const matchTo = !dateTo || b.date <= dateTo;
      return matchSearch && matchTrek && matchStatus && matchFrom && matchTo;
    });
  }, [bookings, search, trekFilter, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8 flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-slate-400 animate-pulse">Loading bookings…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="text-sm text-slate-500">
            {bookings.length} total bookings across your treks
            {isMockData && <span className="ml-1 text-slate-400">(Sample data)</span>}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => downloadCSV(filtered)}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by trekker or booking #"
            className="pl-9"
          />
        </div>
        <div className="w-44">
          <Select value={trekFilter} onChange={(e) => { setTrekFilter(e.target.value); setPage(1); }}>
            {TREKS.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <div className="w-36">
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="w-36" />
          <span className="text-slate-400 text-sm">to</span>
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="w-36" />
        </div>
      </motion.div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Filter className="h-4 w-4" />
        Showing {filtered.length} booking{filtered.length !== 1 ? "s" : ""}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Booking #", "Trekker", "Trek", "Date", "Persons", "Amount", "Status", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">
                    No bookings match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((b, i) => (
                  <motion.tr
                    key={b.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-600">{b.bookingNo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {b.trekker.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800">{b.trekker}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">{b.trek}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(b.date)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.adults}A{b.children > 0 ? ` + ${b.children}C` : ""}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 tabular-nums">{formatPrice(b.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusColor(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/org/bookings/${b.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
