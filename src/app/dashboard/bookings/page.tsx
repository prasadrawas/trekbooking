"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  CalendarDays,
  Users,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Ticket,
  Clock,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatPrice } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

type BookingStatus = "confirmed" | "pending" | "cancelled";

interface Booking {
  id: string;
  trekName: string;
  date: string;
  time: string;
  organizer: string;
  bookingNumber: string;
  adults: number;
  children: number;
  totalAmount: number;
  status: BookingStatus;
  image: string;
  tab: "upcoming" | "past" | "cancelled";
}

interface ApiBooking {
  id: string;
  booking_number: string;
  status: string;
  num_adults: number;
  num_children: number;
  total_amount: number;
  booking_name: string;
  created_at: string;
  trek_events: {
    event_date: string;
    reporting_time: string;
    treks: { title: string; slug: string } | null;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(timeStr: string): string {
  if (!timeStr) return "";
  const [h, m] = timeStr.slice(0, 5).split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function apiStatusToTab(status: string): "upcoming" | "past" | "cancelled" {
  if (["pending", "confirmed"].includes(status)) return "upcoming";
  if (status === "completed") return "past";
  return "cancelled";
}

function mapApiBooking(b: ApiBooking): Booking {
  return {
    id: b.id,
    trekName: b.trek_events?.treks?.title ?? "Trek",
    date: fmtDate(b.trek_events?.event_date ?? ""),
    time: fmtTime(b.trek_events?.reporting_time ?? ""),
    organizer: "Trek Organizer",
    bookingNumber: b.booking_number,
    adults: b.num_adults,
    children: b.num_children ?? 0,
    totalAmount: b.total_amount,
    status: (["confirmed", "pending", "cancelled"].includes(b.status)
      ? b.status
      : "cancelled") as BookingStatus,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=120&h=80&fit=crop",
    tab: apiStatusToTab(b.status),
  };
}

const TABS = ["upcoming", "past", "cancelled"] as const;
type Tab = (typeof TABS)[number];

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  if (status === "confirmed")
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1">
        <CheckCircle2 className="w-3 h-3" /> Confirmed
      </Badge>
    );
  if (status === "pending")
    return (
      <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 gap-1">
        <AlertCircle className="w-3 h-3" /> Pending
      </Badge>
    );
  return (
    <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50 gap-1">
      <XCircle className="w-3 h-3" /> Cancelled
    </Badge>
  );
}

// ─── Booking card ─────────────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: Booking }) {
  const isUpcoming = booking.tab === "upcoming";
  const isPast = booking.tab === "past";

  return (
    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
      <CardContent className="p-0">
        <div className="flex gap-0 overflow-hidden rounded-xl">
          {/* Image */}
          <div className="flex-shrink-0">
            <img
              src={booking.image}
              alt={booking.trekName}
              className="w-24 h-full object-cover sm:w-32"
              style={{ minHeight: 100 }}
            />
          </div>
          {/* Content */}
          <div className="flex flex-1 flex-col p-4 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">{booking.trekName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  by {booking.organizer}
                </p>
              </div>
              <StatusBadge status={booking.status} />
            </div>

            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                {booking.date} · {booking.time}
              </span>
              <span className="flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5 text-slate-400" />
                {booking.bookingNumber}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {booking.adults} adult{booking.adults !== 1 ? "s" : ""}
                {booking.children > 0 ? `, ${booking.children} child${booking.children > 1 ? "ren" : ""}` : ""}
              </span>
              <span className="flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">{formatPrice(booking.totalAmount)}</span>
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 pt-2.5 border-t border-slate-50">
              <Link href={`/dashboard/bookings/${booking.id}`}>
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                >
                  View Details
                </Button>
              </Link>
              {isUpcoming && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs rounded-lg border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
                >
                  Cancel Booking
                </Button>
              )}
              {isPast && (
                <Link href="/dashboard/reviews">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-3 text-xs rounded-lg border-amber-200 text-amber-600 hover:bg-amber-50"
                  >
                    Write Review
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      try {
        const res = await fetch("/api/bookings");
        if (res.ok) {
          const data = await res.json();
          const mapped: Booking[] = (data.bookings ?? []).map(mapApiBooking);
          setAllBookings(mapped);
        }
      } catch {
        // keep empty — no mock fallback to avoid confusion
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  const filtered = allBookings.filter((b) => b.tab === activeTab);

  const tabLabel: Record<Tab, string> = {
    upcoming: "Upcoming",
    past: "Past",
    cancelled: "Cancelled",
  };

  const tabCount: Record<Tab, number> = {
    upcoming: allBookings.filter((b) => b.tab === "upcoming").length,
    past: allBookings.filter((b) => b.tab === "past").length,
    cancelled: allBookings.filter((b) => b.tab === "cancelled").length,
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track all your trek reservations in one place.
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              "relative px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200",
              activeTab === tab
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            {activeTab === tab && (
              <motion.span
                layoutId="tab-bg"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <span className="relative z-10">
              {tabLabel[tab]}
              <span
                className={[
                  "ml-1.5 inline-flex items-center justify-center rounded-full text-[10px] font-semibold w-4 h-4",
                  activeTab === tab
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-500",
                ].join(" ")}
              >
                {tabCount[tab]}
              </span>
            </span>
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={activeTab === "cancelled" ? XCircle : activeTab === "upcoming" ? Clock : Ticket}
              title={
                activeTab === "upcoming"
                  ? "No upcoming bookings"
                  : activeTab === "past"
                  ? "No past treks yet"
                  : "No cancelled bookings"
              }
              description={
                activeTab === "upcoming"
                  ? "You don't have any upcoming trek bookings. Time to plan your next adventure!"
                  : activeTab === "past"
                  ? "You haven't completed any treks yet. Book one today!"
                  : "You haven't cancelled any bookings."
              }
              action={
                activeTab !== "cancelled"
                  ? {
                      label: "Browse Treks",
                      onClick: () => (window.location.href = "/treks"),
                    }
                  : undefined
              }
            />
          ) : (
            <motion.div
              className="space-y-3"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.07 } },
              }}
            >
              {filtered.map((booking) => (
                <motion.div
                  key={booking.id}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
                  }}
                >
                  <BookingCard booking={booking} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
