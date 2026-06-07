"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Types & Mock Data
// ---------------------------------------------------------------------------

type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed";

interface Booking {
  id: string;
  bookingNo: string;
  trekker: string;
  trekkerEmail: string;
  organizer: string;
  trek: string;
  date: string;
  amount: number;
  commission: number;
  status: BookingStatus;
}

const MOCK_BOOKINGS: Booking[] = [
  { id: "b1", bookingNo: "BK-9312", trekker: "Riya Shah", trekkerEmail: "riya@gmail.com", organizer: "WildWander Adventures", trek: "Rajmachi Trek", date: "Jun 14, 2025", amount: 2200, commission: 220, status: "confirmed" },
  { id: "b2", bookingNo: "BK-9311", trekker: "Arjun Mehta", trekkerEmail: "arjun.m@outlook.com", organizer: "Sahyadri Hikers Club", trek: "Harishchandragad", date: "Jun 12, 2025", amount: 3500, commission: 350, status: "cancelled" },
  { id: "b3", bookingNo: "BK-9310", trekker: "Priya Nair", trekkerEmail: "priya.nair@gmail.com", organizer: "WildWander Adventures", trek: "Rajmachi Trek", date: "Jun 14, 2025", amount: 2200, commission: 220, status: "confirmed" },
  { id: "b4", bookingNo: "BK-9309", trekker: "TechCorp Outing", trekkerEmail: "hr@techcorp.in", organizer: "Peak Explorers", trek: "Lonavala Day Hike", date: "Jun 21, 2025", amount: 26400, commission: 2640, status: "confirmed" },
  { id: "b5", bookingNo: "BK-9308", trekker: "Suresh Kumar", trekkerEmail: "suresh.k@yahoo.com", organizer: "Altitude Addicts", trek: "Kalsubai Summit", date: "Jun 08, 2025", amount: 1800, commission: 162, status: "completed" },
  { id: "b6", bookingNo: "BK-9307", trekker: "Neha Patil", trekkerEmail: "neha.p@gmail.com", organizer: "Nature Nomads", trek: "Bhimashankar Trek", date: "Jun 07, 2025", amount: 2800, commission: 280, status: "completed" },
  { id: "b7", bookingNo: "BK-9306", trekker: "Vikram Singh", trekkerEmail: "v.singh@gmail.com", organizer: "Sahyadri Hikers Club", trek: "Tamhini Night Trek", date: "Jun 07, 2025", amount: 1600, commission: 160, status: "completed" },
  { id: "b8", bookingNo: "BK-9305", trekker: "Anita Desai", trekkerEmail: "anita.d@gmail.com", organizer: "WildWander Adventures", trek: "Mulshi Sunrise", date: "Jun 06, 2025", amount: 1400, commission: 140, status: "completed" },
  { id: "b9", bookingNo: "BK-9304", trekker: "Rohan Joshi", trekkerEmail: "rohan.j@hotmail.com", organizer: "Altitude Addicts", trek: "Malshej Ghat Trek", date: "Jun 01, 2025", amount: 2400, commission: 216, status: "pending" },
  { id: "b10", bookingNo: "BK-9303", trekker: "Kavya Reddy", trekkerEmail: "kavya.r@gmail.com", organizer: "Peak Explorers", trek: "Rajgad Fort", date: "May 31, 2025", amount: 1900, commission: 190, status: "completed" },
  { id: "b11", bookingNo: "BK-9302", trekker: "Aditya Verma", trekkerEmail: "aditya.v@gmail.com", organizer: "Nature Nomads", trek: "Sinhagad Morning Trek", date: "May 30, 2025", amount: 950, commission: 95, status: "cancelled" },
  { id: "b12", bookingNo: "BK-9301", trekker: "Sneha Kulkarni", trekkerEmail: "sneha.k@gmail.com", organizer: "Sahyadri Hikers Club", trek: "Harishchandragad", date: "May 25, 2025", amount: 3500, commission: 315, status: "completed" },
];

const PAGE_SIZE = 8;

const STATUS_CLASS: Record<BookingStatus, string> = {
  confirmed: "border-blue-200 bg-blue-50 text-blue-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  completed: "Completed",
};

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------

function exportCSV(bookings: Booking[]) {
  const header = ["Booking #", "Trekker", "Email", "Organizer", "Trek", "Date", "Amount", "Commission", "Status"];
  const rows = bookings.map((b) => [
    b.bookingNo, b.trekker, b.trekkerEmail, b.organizer, b.trek, b.date,
    b.amount, b.commission, STATUS_LABEL[b.status],
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bookings.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [organizerFilter, setOrganizerFilter] = useState("all");
  const [trekFilter, setTrekFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.bookings?.length) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setBookings(data.bookings.map((b: any, i: number): Booking => ({
          id: String(b.id ?? i),
          bookingNo: b.booking_number ?? b.id ?? `BK-${i}`,
          trekker: b.user_name ?? b.profiles?.full_name ?? "—",
          trekkerEmail: b.user_email ?? b.profiles?.email ?? "—",
          organizer: b.organizer_name ?? b.treks?.organizers?.org_name ?? "—",
          trek: b.trek_title ?? b.treks?.title ?? "—",
          date: b.event_date ?? b.trek_events?.event_date
            ? new Date(b.event_date ?? b.trek_events?.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "—",
          amount: Number(b.total_amount ?? b.amount ?? 0),
          commission: Number(b.commission_amount ?? b.commission ?? 0),
          status: (["confirmed","pending","cancelled","completed"].includes(b.status) ? b.status : "pending") as BookingStatus,
        })));
      })
      .catch(() => { /* keep mock */ })
      .finally(() => setLoading(false));
  }, []);

  const ORGANIZERS = [...new Set(bookings.map((b) => b.organizer))];
  const TREKS = [...new Set(bookings.map((b) => b.trek))];

  const filtered = bookings.filter((b) => {
    const s = search.toLowerCase();
    const matchSearch =
      b.bookingNo.toLowerCase().includes(s) ||
      b.trekker.toLowerCase().includes(s) ||
      b.trekkerEmail.toLowerCase().includes(s);
    const matchOrganizer = organizerFilter === "all" || b.organizer === organizerFilter;
    const matchTrek = trekFilter === "all" || b.trek === trekFilter;
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchOrganizer && matchTrek && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats derived from loaded bookings
  const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const todayBookings = bookings.filter((b) => b.date === todayStr).length;
  const nonCancelled = bookings.filter((b) => b.status !== "cancelled");
  const totalRevenue = nonCancelled.reduce((s, b) => s + b.amount, 0);

  const STATS = [
    { label: "Today's Bookings", value: loading ? "—" : String(todayBookings) },
    { label: "Total Bookings", value: loading ? "—" : bookings.length.toLocaleString("en-IN") },
    { label: "Total Revenue", value: loading ? "—" : formatPrice(totalRevenue) },
    { label: "Cancelled", value: loading ? "—" : String(bookings.filter(b => b.status === "cancelled").length) },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">All Bookings</h1>
            <p className="text-sm text-slate-500 mt-0.5">Platform-wide booking management</p>
          </div>
          {loading && <Loader2 className="size-4 animate-spin text-slate-400" />}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => exportCSV(filtered)}
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className="mt-1 text-lg font-bold text-slate-800">{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Search booking # or trekker…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select
          value={organizerFilter}
          onChange={(e) => { setOrganizerFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All Organizers</option>
          {ORGANIZERS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </Select>
        <Select
          value={trekFilter}
          onChange={(e) => { setTrekFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All Treks</option>
          {TREKS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Booking #", "Trekker", "Organizer", "Trek", "Date", "Amount", "Commission", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
                      h === "Amount" || h === "Commission" ? "text-right" : "text-left"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-400">
                    No bookings match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-600">
                      {b.bookingNo}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800">{b.trekker}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{b.trekkerEmail}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs max-w-[160px]">
                      <span className="truncate block">{b.organizer}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs max-w-[140px]">
                      <span className="truncate block">{b.trek}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{b.date}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums font-medium text-slate-800">
                      {formatPrice(b.amount)}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-slate-500">
                      {formatPrice(b.commission)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          STATUS_CLASS[b.status]
                        )}
                      >
                        {STATUS_LABEL[b.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700">
                        <Eye className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <p className="text-xs text-slate-500">
            {filtered.length} bookings · Page {page} of {Math.max(totalPages, 1)}
          </p>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
