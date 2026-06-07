"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  User,
  AlertCircle,
  Calendar,
  CreditCard,
  MapPin,
  MessageSquare,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BookingData {
  id: string;
  bookingNo: string;
  status: string;
  createdAt: string;
  trekkerName: string;
  trekkerEmail: string;
  trekkerPhone: string;
  emergencyContact: string;
  trek: string;
  eventDate: string;
  reportingTime: string;
  adults: number;
  children: number;
  totalAmount: number;
  adultAmount: number;
  childAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  razorpayId: string;
  pickupPoint: string;
  pickupTime: string;
  specialRequests: string;
}

// ─── Mock Fallback ─────────────────────────────────────────────────────────────

const BOOKING_FALLBACK: BookingData = {
  id: "b1",
  bookingNo: "SB-2026-0142",
  status: "confirmed",
  createdAt: "2026-06-02",
  trekkerName: "Priya Sharma",
  trekkerEmail: "priya.sharma@example.com",
  trekkerPhone: "+91 98765 43210",
  emergencyContact: "Ravi Sharma — +91 98765 00001",
  trek: "Rajmachi Fort Trek via Udhewadi",
  eventDate: "2026-06-14",
  reportingTime: "05:30",
  adults: 2,
  children: 1,
  totalAmount: 5400,
  adultAmount: 1800 * 2,
  childAmount: 900 * 1,
  paymentMethod: "UPI",
  paymentStatus: "paid",
  razorpayId: "pay_PdF7t9KVRa1234",
  pickupPoint: "Shivajinagar Bus Stand",
  pickupTime: "04:00",
  specialRequests: "Please arrange vegetarian breakfast. One person is allergic to nuts.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

// ─── Info Section ──────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
      <span className="w-28 shrink-0 text-xs text-slate-400">{label}</span>
      <span className={`text-sm text-slate-800 break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

// ─── API mapper ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiBooking(raw: any): BookingData {
  const event = raw.trek_events ?? {};
  const trek = event.treks ?? {};
  const payment = Array.isArray(raw.payments) ? raw.payments[0] : (raw.payments ?? {});
  const pickup = raw.pickup_points ?? {};
  const adultPrice = Number(event.price ?? 0);
  const childPrice = Number(event.child_price ?? 0);
  const adults = Number(raw.num_adults ?? 0);
  const children = Number(raw.num_children ?? 0);

  return {
    id: raw.id ?? "",
    bookingNo: raw.booking_number ?? "",
    status: raw.status ?? "pending",
    createdAt: raw.created_at ?? "",
    trekkerName: raw.booking_name ?? "",
    trekkerEmail: raw.booking_email ?? "",
    trekkerPhone: raw.booking_phone ?? "",
    emergencyContact: raw.emergency_contact ?? "",
    trek: trek.title ?? "",
    eventDate: event.event_date ?? "",
    reportingTime: (event.reporting_time ?? "").slice(0, 5),
    adults,
    children,
    totalAmount: Number(raw.total_amount ?? 0),
    adultAmount: adultPrice * adults,
    childAmount: childPrice * children,
    paymentMethod: payment.method ?? "",
    paymentStatus: payment.status ?? "",
    razorpayId: payment.razorpay_payment_id ?? "",
    pickupPoint: pickup.label ?? "",
    pickupTime: (pickup.pickup_time ?? "").slice(0, 5),
    specialRequests: raw.special_requests ?? "",
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrgBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [booking, setBooking] = useState<BookingData>(BOOKING_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/bookings/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.booking) setBooking(mapApiBooking(json.booking));
      })
      .catch(() => {/* keep fallback */})
      .finally(() => setLoading(false));
  }, [id]);

  const status: string = cancelled ? "cancelled" : booking.status;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8 space-y-6">
      {/* Back */}
      <Link
        href="/org/bookings"
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Bookings
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Booking {booking.bookingNo}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusColor(
                status
              )}`}
            >
              {status}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Booked on {formatDate(booking.createdAt)}</p>
        </div>
        {status !== "cancelled" && status !== "completed" && (
          <Button
            variant="destructive"
            size="sm"
            className="gap-2 self-start"
            onClick={() => setCancelOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            Cancel Booking
          </Button>
        )}
      </motion.div>

      {/* Stacked single-column layout */}
      <div className="space-y-5">
        {/* Trekker + Booking — side by side on desktop */}
        <div className="grid gap-5 sm:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <Section title="Trekker Information" icon={User}>
              <InfoRow label="Name" value={booking.trekkerName} />
              <InfoRow label="Email" value={booking.trekkerEmail} />
              <InfoRow label="Phone" value={booking.trekkerPhone} />
              <InfoRow label="Emergency Contact" value={booking.emergencyContact} />
            </Section>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Section title="Booking Details" icon={Calendar}>
              <InfoRow label="Trek" value={booking.trek} />
              <InfoRow label="Date" value={formatDate(booking.eventDate)} />
              <InfoRow label="Reporting Time" value={booking.reportingTime} />
              <InfoRow
                label="Participants"
                value={`${booking.adults} adult${booking.adults > 1 ? "s" : ""}${
                  booking.children > 0 ? ` + ${booking.children} child${booking.children > 1 ? "ren" : ""}` : ""
                }`}
              />
            </Section>
          </motion.div>
        </div>

        {/* Payment — full width */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <Section title="Payment Information" icon={CreditCard}>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Adults ({booking.adults} × {formatPrice(1800)})</span>
                    <span>{formatPrice(booking.adultAmount)}</span>
                  </div>
                  {booking.children > 0 && (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Children ({booking.children} × {formatPrice(900)})</span>
                      <span>{formatPrice(booking.childAmount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm font-semibold text-slate-800">
                    <span>Total</span>
                    <span>{formatPrice(booking.totalAmount)}</span>
                  </div>
                </div>
              </div>
              <div>
                <InfoRow label="Payment Method" value={booking.paymentMethod} />
                <InfoRow label="Payment Status" value={booking.paymentStatus.toUpperCase()} />
                <InfoRow label="Razorpay ID" value={booking.razorpayId} mono />
              </div>
            </div>
          </Section>
        </motion.div>

        {/* Pickup + Special requests — side by side */}
        <div className="grid gap-5 sm:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Section title="Pickup Point" icon={MapPin}>
              <InfoRow label="Location" value={booking.pickupPoint} />
              <InfoRow label="Pickup Time" value={booking.pickupTime} />
            </Section>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
            <Section title="Special Requests" icon={MessageSquare}>
              <p className="text-sm text-slate-700 leading-relaxed">
                {booking.specialRequests || "None"}
              </p>
            </Section>
          </motion.div>
        </div>
      </div>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={(o) => !o && setCancelOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              Cancel Booking
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 py-1">
            Please provide a reason for cancelling this booking. The trekker will be notified
            and a refund will be initiated.
          </p>
          <div className="py-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Reason for cancellation *</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="e.g. Organizer unavailable due to unforeseen circumstances"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep Booking</Button>
            <Button
              variant="destructive"
              disabled={!cancelReason.trim() || cancelled}
              onClick={async () => {
                try {
                  const res = await fetch(`/api/bookings/${booking.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "cancel", reason: cancelReason }),
                  });
                  if (res.ok) {
                    setCancelled(true);
                    setCancelOpen(false);
                  }
                } catch { /* ignore */ }
              }}
            >
              {cancelled ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
