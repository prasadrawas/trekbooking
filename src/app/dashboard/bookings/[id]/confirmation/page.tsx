"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  CalendarDays,
  Clock,
  Users,
  MapPin,
  Ticket,
  ArrowRight,
  LayoutDashboard,
  Lightbulb,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

// ─── Mock confirmation data ────────────────────────────────────────────────────

const CONFIRMATION = {
  bookingNumber: "SAB-2026-001",
  trek: {
    name: "Rajmachi Fort Trek",
    date: "15 Jun 2026",
    time: "6:00 AM",
    organizer: "Trek Organizer",
    organizerPhone: "+91 98765 43210",
  },
  participants: { adults: 2, children: 0 },
  totalAmount: 3200,
  meetingPoint: "Lonavala Railway Station, Platform 2",
  pickup: {
    location: "Shivajinagar Bus Stand, Pune",
    time: "5:15 AM",
  },
};

const WHATS_NEXT = [
  {
    icon: Phone,
    title: "Save your booking details",
    description: "Download the receipt from your booking details page for your records.",
  },
  {
    icon: MapPin,
    title: "Save the meeting point",
    description: "Be at the pickup location 10 minutes before departure time.",
  },
  {
    icon: Lightbulb,
    title: "Pack smart",
    description: "Wear trekking shoes, carry water (2L), snacks, sunscreen, and a first-aid kit.",
  },
  {
    icon: Phone,
    title: "Organizer contact",
    description: `You can reach ${CONFIRMATION.trek.organizer} at ${CONFIRMATION.trek.organizerPhone} for any queries.`,
  },
];

// ─── Confetti particle ────────────────────────────────────────────────────────

function ConfettiParticle({ index }: { index: number }) {
  const colors = [
    "#10b981", "#3b82f6", "#f59e0b", "#ec4899",
    "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16",
  ];
  const color = colors[index % colors.length];
  const left = `${10 + (index * 11.7) % 80}%`;
  const delay = (index * 0.08) % 0.6;
  const size = 6 + (index % 4) * 3;

  return (
    <motion.div
      initial={{ y: -20, x: 0, opacity: 1, rotate: 0, scale: 1 }}
      animate={{
        y: 280 + Math.random() * 100,
        x: (index % 2 === 0 ? 1 : -1) * (20 + (index * 7) % 50),
        opacity: [1, 1, 0],
        rotate: 360 * (index % 2 === 0 ? 1 : -1),
        scale: [1, 1, 0.3],
      }}
      transition={{ delay, duration: 1.4, ease: [0, 0, 0.58, 1] as [number, number, number, number] }}
      className="absolute pointer-events-none"
      style={{ left, top: 0, width: size, height: size, backgroundColor: color, borderRadius: index % 3 === 0 ? "50%" : 2 }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfirmationPage() {
  const [showConfetti, setShowConfetti] = useState(false);

  const params = useParams();
  const bookingId = params?.id as string;
  const [conf, setConf] = useState(CONFIRMATION);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Fetch real booking data
  useEffect(() => {
    if (!bookingId) return;
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.booking) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const b: any = data.booking;
        const evt = b.trek_events ?? {};
        const trek = evt.treks ?? {};
        const org = trek.organizers ?? {};
        const pickup = b.pickup_points ?? {};
        setConf({
          bookingNumber: b.booking_number ?? CONFIRMATION.bookingNumber,
          trek: {
            name: trek.title ?? CONFIRMATION.trek.name,
            date: evt.event_date ? new Date(evt.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : CONFIRMATION.trek.date,
            time: evt.reporting_time ? evt.reporting_time.slice(0, 5) : CONFIRMATION.trek.time,
            organizer: org.org_name ?? CONFIRMATION.trek.organizer,
            organizerPhone: org.phone ?? CONFIRMATION.trek.organizerPhone,
          },
          participants: { adults: b.num_adults ?? 1, children: b.num_children ?? 0 },
          totalAmount: Number(b.total_amount ?? 0),
          meetingPoint: trek.meeting_point ?? CONFIRMATION.meetingPoint,
          pickup: {
            location: pickup.label ?? CONFIRMATION.pickup.location,
            time: pickup.pickup_time ? pickup.pickup_time.slice(0, 5) : CONFIRMATION.pickup.time,
          },
        });
      })
      .catch(() => {});
  }, [bookingId]);

  return (
    <div className="flex flex-col items-center py-8">
      {/* Confetti */}
      <div className="relative w-full max-w-lg pointer-events-none overflow-hidden h-0">
        <AnimatePresence>
          {showConfetti && (
            <>
              {Array.from({ length: 18 }).map((_, i) => (
                <ConfettiParticle key={i} index={i} />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-lg space-y-6">
        {/* Success hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.05 }}
          className="flex flex-col items-center text-center"
        >
          {/* Green checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
            className="mb-5"
          >
            <div className="relative">
              {/* Pulse ring */}
              <motion.div
                initial={{ scale: 0.6, opacity: 0.7 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.6, ease: [0, 0, 0.58, 1] as [number, number, number, number], delay: 0.4 }}
                className="absolute inset-0 rounded-full bg-emerald-400"
              />
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-200">
                <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-3xl font-bold text-slate-900"
          >
            Booking Confirmed!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-2 text-slate-500"
          >
            Your spot is locked in. Get ready for an amazing trek!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-1.5"
          >
            <Ticket className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm font-mono font-semibold text-slate-700">
              {conf.bookingNumber}
            </span>
          </motion.div>
        </motion.div>

        {/* Trek summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 space-y-3"
        >
          <h2 className="font-semibold text-slate-800 text-base">{conf.trek.name}</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <CalendarDays className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{conf.trek.date}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{conf.trek.time}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>
                {conf.participants.adults} adult{conf.participants.adults > 1 ? "s" : ""}
                {conf.participants.children > 0 ? `, ${conf.participants.children} child` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 font-semibold">
              <span className="text-emerald-600">{formatPrice(conf.totalAmount)}</span>
              <span className="text-xs font-normal text-slate-400">paid</span>
            </div>
          </div>
        </motion.div>

        {/* Meeting point */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-50">
              <MapPin className="w-4.5 h-4.5 text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Meeting Point</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">{conf.meetingPoint}</p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(conf.meetingPoint)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Open in Google Maps <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-50 pt-4 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-50">
              <MapPin className="w-4.5 h-4.5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your Pickup Point</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">{conf.pickup.location}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                {conf.pickup.time}
              </p>
            </div>
          </div>
        </motion.div>

        {/* What's next */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            What&apos;s Next?
          </h3>
          <ul className="space-y-3">
            {WHATS_NEXT.map((tip, i) => (
              <motion.li
                key={tip.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.07 }}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <tip.icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{tip.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{tip.description}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link href={`/dashboard/bookings/${bookingId}`} className="flex-1">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 h-11">
              <Ticket className="w-4 h-4" />
              View Booking
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button
              variant="outline"
              className="w-full rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 h-11"
            >
              <LayoutDashboard className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
