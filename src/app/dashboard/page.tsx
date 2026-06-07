"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  Mountain,
  CalendarDays,
  Star,
  Clock,
  MapPin,
  Users,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiBooking {
  id: string;
  booking_number: string;
  status: string;
  num_adults: number;
  num_children: number;
  total_amount: number;
  created_at: string;
  trek_events: {
    event_date: string;
    reporting_time: string;
    treks: { title: string; slug: string } | null;
  } | null;
}

interface UpcomingBooking {
  id: string;
  trekName: string;
  date: string;
  time: string;
  organizer: string;
  status: string;
  meetingPoint: string;
  participants: number;
  amount: number;
  image: string;
}

interface PastTrek {
  id: string;
  trekName: string;
  date: string;
  reviewed: boolean;
  image: string;
}

// ─── Fallback mock data ────────────────────────────────────────────────────────

const FALLBACK_UPCOMING: UpcomingBooking[] = [];
const FALLBACK_PAST: PastTrek[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEventDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatReportingTime(timeStr: string): string {
  if (!timeStr) return "";
  const [h, m] = timeStr.slice(0, 5).split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function mapToUpcoming(b: ApiBooking): UpcomingBooking {
  return {
    id: b.id,
    trekName: b.trek_events?.treks?.title ?? "Trek",
    date: formatEventDate(b.trek_events?.event_date ?? ""),
    time: formatReportingTime(b.trek_events?.reporting_time ?? ""),
    organizer: "Trek Organizer",
    status: b.status,
    meetingPoint: "",
    participants: b.num_adults + (b.num_children ?? 0),
    amount: b.total_amount,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=80&h=80&fit=crop",
  };
}

function mapToPast(b: ApiBooking): PastTrek {
  return {
    id: b.id,
    trekName: b.trek_events?.treks?.title ?? "Trek",
    date: formatEventDate(b.trek_events?.event_date ?? ""),
    reviewed: false,
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=80&h=80&fit=crop",
  };
}

// ─── Animation helpers ────────────────────────────────────────────────────────

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.58, 1] as [number, number, number, number] } },
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed")
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Confirmed
      </Badge>
    );
  if (status === "pending")
    return (
      <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
        <AlertCircle className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  return <Badge variant="secondary">{status}</Badge>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>(FALLBACK_UPCOMING);
  const [pastTreks, setPastTreks] = useState<PastTrek[]>(FALLBACK_PAST);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [upRes, pastRes] = await Promise.all([
          fetch("/api/bookings?status=upcoming&limit=3"),
          fetch("/api/bookings?status=past&limit=3"),
        ]);
        if (upRes.ok) {
          const data = await upRes.json();
          const mapped = (data.bookings ?? []).map(mapToUpcoming);
          setUpcomingBookings(mapped.length > 0 ? mapped : FALLBACK_UPCOMING);
        }
        if (pastRes.ok) {
          const data = await pastRes.json();
          const mapped = (data.bookings ?? []).map(mapToPast);
          setPastTreks(mapped.length > 0 ? mapped : FALLBACK_PAST);
        }
      } catch {
        // keep fallbacks
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Derived stats from fetched data
  const STATS = [
    {
      label: "Treks Done",
      value: String(pastTreks.length),
      icon: Mountain,
      color: "bg-emerald-50 text-emerald-600",
      trend: "Completed treks",
    },
    {
      label: "Upcoming Bookings",
      value: String(upcomingBookings.length),
      icon: CalendarDays,
      color: "bg-blue-50 text-blue-600",
      trend: upcomingBookings.length > 0 ? "Next coming soon" : "No upcoming",
    },
    {
      label: "Reviews Written",
      value: "—",
      icon: Star,
      color: "bg-amber-50 text-amber-600",
      trend: "See reviews page",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Loading overlay */}
      {loading && (
        <motion.div variants={item} className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading your data…
        </motion.div>
      )}

      {/* Welcome header */}
      <motion.div variants={item} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, Trekker! 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here's what's happening with your adventures.
          </p>
        </div>
        <Link href="/treks">
          <Button className="hidden sm:flex bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-xl">
            Browse Treks
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <Card
            key={stat.label}
            className="border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="mt-1.5 text-3xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    {stat.trend}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Upcoming bookings */}
      <motion.section variants={item} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            Upcoming Bookings
          </h2>
          <Link
            href="/dashboard/bookings"
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {upcomingBookings.length === 0 && !loading && (
            <p className="text-sm text-slate-400">No upcoming bookings yet.</p>
          )}
          {upcomingBookings.map((booking, idx) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.07, duration: 0.35 }}
            >
              <Card className="border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <img
                      src={booking.image}
                      alt={booking.trekName}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate">
                          {booking.trekName}
                        </h3>
                        <StatusBadge status={booking.status} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {booking.date} · {booking.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {booking.participants} participant{booking.participants > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{booking.meetingPoint}</span>
                      </div>
                    </div>
                  </div>
                  {/* Footer */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
                    <div className="text-xs text-slate-500">
                      by <span className="font-medium text-slate-700">{booking.organizer}</span>
                      <span className="mx-2 text-slate-200">·</span>
                      <span className="font-semibold text-slate-800">{formatPrice(booking.amount)}</span>
                    </div>
                    <Link href={`/dashboard/bookings/${booking.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-xs rounded-lg border-slate-200 hover:border-emerald-400 hover:text-emerald-700"
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Past treks */}
      <motion.section variants={item} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Past Treks</h2>
          <Link
            href="/dashboard/reviews"
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            My reviews <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {pastTreks.length === 0 && !loading && (
            <p className="text-sm text-slate-400 col-span-3">No past treks yet.</p>
          )}
          {pastTreks.map((trek, idx) => (
            <motion.div
              key={trek.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + idx * 0.07 }}
            >
              <Card className="border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className="relative">
                  <img
                    src={trek.image}
                    alt={trek.trekName}
                    className="w-full h-28 object-cover"
                  />
                  {trek.reviewed && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-white/90 text-amber-600 border-amber-200 text-[10px]">
                        <Star className="w-2.5 h-2.5 mr-0.5 fill-amber-400 stroke-amber-400" />
                        Reviewed
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-semibold text-slate-800 leading-snug">
                    {trek.trekName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {trek.date}
                  </p>
                  {!trek.reviewed && (
                    <Link href={`/dashboard/reviews`}>
                      <Button
                        size="sm"
                        className="mt-2 w-full h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                      >
                        <Star className="w-3 h-3" />
                        Write Review
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
