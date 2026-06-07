"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Users,
  MapPin,
  CreditCard,
  Phone,
  Mail,
  User,
  ShieldAlert,
  Ticket,
  Download,
  XCircle,
  Star,
  CheckCircle2,
  AlertCircle,
  Building2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BookingShape {
  id: string;
  bookingNumber: string;
  status: string;
  createdAt: string;
  tab: string;
  trek: {
    name: string;
    date: string;
    time: string;
    organizer: string;
    organizerPhone: string;
    duration: string;
    difficulty: string;
    image: string;
  };
  participants: { adults: number; children: number; total: number };
  contact: { name: string; email: string; phone: string; emergencyContact: string };
  payment: {
    total: number;
    method: string;
    razorpayId: string;
    status: string;
    breakdown: { label: string; amount: number }[];
  };
  pickup: { location: string; time: string };
  meetingPoint: string;
  specialRequests: string;
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

function fmtCreatedAt(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiToBooking(raw: any): BookingShape {
  const evt = raw.trek_events ?? {};
  const trek = evt.treks ?? {};
  const organizer = trek.organizers ?? {};
  const payments = Array.isArray(raw.payments) ? raw.payments : (raw.payments ? [raw.payments] : []);
  const payment = payments[0] ?? {};
  const pickup = raw.pickup_points ?? {};
  const adults: number = raw.num_adults ?? 0;
  const children: number = raw.num_children ?? 0;
  const total: number = raw.total_amount ?? 0;
  const apiStatus: string = raw.status ?? "pending";
  const tab = ["pending", "confirmed"].includes(apiStatus)
    ? "upcoming"
    : apiStatus === "completed"
    ? "past"
    : "cancelled";

  const adultPrice = evt.price ?? 0;
  const childPrice = evt.child_price ?? adultPrice;
  const breakdown: { label: string; amount: number }[] = [];
  if (adults > 0) breakdown.push({ label: `Adult x ${adults}`, amount: adults * adultPrice });
  if (children > 0) breakdown.push({ label: `Child x ${children}`, amount: children * childPrice });
  const computed = adults * adultPrice + children * childPrice;
  const convenience = total - computed;
  if (convenience > 0) breakdown.push({ label: "Convenience fee", amount: convenience });
  if (breakdown.length === 0) breakdown.push({ label: "Total", amount: total });

  return {
    id: raw.id,
    bookingNumber: raw.booking_number ?? "—",
    status: apiStatus,
    createdAt: fmtCreatedAt(raw.created_at),
    tab,
    trek: {
      name: trek.title ?? "Trek",
      date: fmtDate(evt.event_date ?? ""),
      time: fmtTime(evt.reporting_time ?? ""),
      organizer: organizer.org_name ?? "Sahyadri Adventures",
      organizerPhone: "",
      duration: "",
      difficulty: "",
      image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=300&fit=crop",
    },
    participants: { adults, children, total: adults + children },
    contact: {
      name: raw.booking_name ?? "",
      email: raw.booking_email ?? "",
      phone: raw.booking_phone ?? "",
      emergencyContact: raw.emergency_contact ?? "",
    },
    payment: {
      total,
      method: payment.method ?? "—",
      razorpayId: payment.razorpay_payment_id ?? payment.razorpay_order_id ?? "—",
      status: payment.status ?? "—",
      breakdown,
    },
    pickup: {
      location: pickup.address ?? pickup.label ?? "",
      time: fmtTime(pickup.pickup_time ?? ""),
    },
    meetingPoint: "",
    specialRequests: raw.special_requests ?? "",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed")
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
        <CheckCircle2 className="w-3 h-3" /> Confirmed
      </Badge>
    );
  if (status === "pending")
    return (
      <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
        <AlertCircle className="w-3 h-3" /> Pending
      </Badge>
    );
  return (
    <Badge className="bg-red-50 text-red-600 border-red-200 gap-1">
      <XCircle className="w-3 h-3" /> Cancelled
    </Badge>
  );
}

function generateReceipt(booking: BookingShape) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${booking.bookingNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; padding: 40px; max-width: 700px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 24px; }
    .logo { font-size: 22px; font-weight: 800; color: #059669; }
    .logo-sub { font-size: 11px; color: #888; margin-top: 2px; }
    .receipt-title { text-align: right; }
    .receipt-title h2 { font-size: 18px; color: #333; }
    .receipt-title p { font-size: 12px; color: #888; margin-top: 2px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #059669; margin-bottom: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .field { margin-bottom: 6px; }
    .field-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { font-size: 13px; font-weight: 500; margin-top: 1px; }
    .trek-name { font-size: 18px; font-weight: 700; color: #059669; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; padding: 8px 0; border-bottom: 1px solid #eee; }
    td { font-size: 13px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
    td:last-child, th:last-child { text-align: right; }
    .total-row td { font-weight: 700; font-size: 15px; border-top: 2px solid #059669; border-bottom: none; padding-top: 12px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-confirmed { background: #d1fae5; color: #065f46; }
    .badge-completed { background: #dbeafe; color: #1e40af; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-cancelled { background: #fee2e2; color: #991b1b; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #aaa; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">TrekBooking</div>
      <div class="logo-sub">trekbooking.in</div>
    </div>
    <div class="receipt-title">
      <h2>Booking Receipt</h2>
      <p>${booking.bookingNumber}</p>
    </div>
  </div>

  <div class="section">
    <div class="trek-name">${booking.trek.name}</div>
    <div style="font-size: 13px; color: #666;">
      ${booking.trek.date} &bull; ${booking.trek.time} &bull; ${booking.trek.organizer}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Booking Details</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">Status</div>
        <div class="field-value"><span class="badge badge-${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span></div>
      </div>
      <div class="field">
        <div class="field-label">Booked On</div>
        <div class="field-value">${booking.createdAt}</div>
      </div>
      <div class="field">
        <div class="field-label">Participants</div>
        <div class="field-value">${booking.participants.adults} Adult${booking.participants.adults > 1 ? "s" : ""}${booking.participants.children > 0 ? ` + ${booking.participants.children} Child${booking.participants.children > 1 ? "ren" : ""}` : ""}</div>
      </div>
      <div class="field">
        <div class="field-label">Pickup Point</div>
        <div class="field-value">${booking.pickup.location || "Direct meetup"} ${booking.pickup.time ? `at ${booking.pickup.time}` : ""}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Contact Information</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">Name</div>
        <div class="field-value">${booking.contact.name}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value">${booking.contact.email}</div>
      </div>
      <div class="field">
        <div class="field-label">Phone</div>
        <div class="field-value">${booking.contact.phone}</div>
      </div>
      <div class="field">
        <div class="field-label">Emergency Contact</div>
        <div class="field-value">${booking.contact.emergencyContact || "—"}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Payment Summary</div>
    <table>
      <thead>
        <tr><th>Item</th><th>Amount</th></tr>
      </thead>
      <tbody>
        ${booking.payment.breakdown.map((item) => `<tr><td>${item.label}</td><td>&#8377;${item.amount.toLocaleString("en-IN")}</td></tr>`).join("")}
        <tr class="total-row"><td>Total Paid</td><td>&#8377;${booking.payment.total.toLocaleString("en-IN")}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="grid">
      <div class="field">
        <div class="field-label">Payment Method</div>
        <div class="field-value">${booking.payment.method || "Online"}</div>
      </div>
      <div class="field">
        <div class="field-label">Transaction ID</div>
        <div class="field-value" style="font-family: monospace; font-size: 11px;">${booking.payment.razorpayId || "—"}</div>
      </div>
    </div>
  </div>

  ${booking.specialRequests ? `
  <div class="section">
    <div class="section-title">Special Requests</div>
    <p style="font-size: 13px; color: #555;">${booking.specialRequests}</p>
  </div>` : ""}

  ${booking.meetingPoint ? `
  <div class="section">
    <div class="section-title">Meeting Point</div>
    <p style="font-size: 13px; color: #555;">${booking.meetingPoint}</p>
  </div>` : ""}

  <div class="footer">
    <p>Thank you for booking with TrekBooking!</p>
    <p style="margin-top: 4px;">trekbooking.in &bull; trekbooking.in@gmail.com</p>
    <p style="margin-top: 8px; font-size: 10px;">This is a computer-generated receipt and does not require a signature.</p>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      setTimeout(() => {
        win.print();
        URL.revokeObjectURL(url);
      }, 500);
    };
  }
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0, 0, 0.58, 1] as [number, number, number, number] } },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [booking, setBooking] = useState<BookingShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchBooking() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/bookings/${id}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(mapApiToBooking(data.booking));
        } else {
          setError("Booking not found.");
        }
      } catch {
        setError("Failed to load booking.");
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-slate-500">{error ?? "Booking not found."}</p>
        <Link href="/dashboard/bookings">
          <Button variant="outline" className="rounded-xl">Back to Bookings</Button>
        </Link>
      </div>
    );
  }

  const isUpcoming = booking.tab === "upcoming";
  const isCompleted = booking.tab === "past";

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Back link + heading */}
      <motion.div variants={item} className="flex items-center gap-3">
        <Link href="/dashboard/bookings">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-slate-500 hover:text-slate-800 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-900">Booking Details</h1>
      </motion.div>

      {/* Trek hero image */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl">
        <img
          src={booking.trek.image}
          alt={booking.trek.name}
          className="w-full h-44 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5 text-white">
          <h2 className="text-xl font-bold">{booking.trek.name}</h2>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-white/80">
            <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{booking.trek.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{booking.trek.time}</span>
            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{booking.trek.organizer}</span>
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <StatusBadge status={booking.status} />
        </div>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left column: 2/3 */}
        <div className="space-y-5 lg:col-span-2">
          {/* Booking info */}
          <motion.div variants={item}>
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-emerald-500" />
                  Booking Information
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-slate-50">
                <InfoRow icon={Ticket} label="Booking Number" value={<span className="font-mono font-semibold">{booking.bookingNumber}</span>} />
                <InfoRow icon={CheckCircle2} label="Status" value={<StatusBadge status={booking.status} />} />
                <InfoRow icon={CalendarDays} label="Booked On" value={booking.createdAt} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Participant details */}
          <motion.div variants={item}>
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-slate-50">
                <InfoRow icon={Users} label="Adults" value={booking.participants.adults} />
                <InfoRow icon={Users} label="Children" value={booking.participants.children || "None"} />
                <InfoRow icon={Users} label="Total" value={<span className="font-semibold">{booking.participants.total} person{booking.participants.total > 1 ? "s" : ""}</span>} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact info */}
          <motion.div variants={item}>
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-violet-500" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-slate-50">
                <InfoRow icon={User} label="Name" value={booking.contact.name} />
                <InfoRow icon={Mail} label="Email" value={booking.contact.email} />
                <InfoRow icon={Phone} label="Phone" value={booking.contact.phone} />
                <InfoRow icon={ShieldAlert} label="Emergency Contact" value={booking.contact.emergencyContact} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Special requests */}
          {booking.specialRequests && (
            <motion.div variants={item}>
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-700">Special Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 leading-relaxed">{booking.specialRequests}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right column: 1/3 */}
        <div className="space-y-5">
          {/* Payment */}
          <motion.div variants={item}>
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {booking.payment.breakdown.map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{row.label}</span>
                      <span className="text-slate-700">{formatPrice(row.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between font-semibold">
                    <span className="text-slate-800">Total</span>
                    <span className="text-emerald-600 text-base">{formatPrice(booking.payment.total)}</span>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 pt-3 border-t border-slate-50">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Method</span>
                    <span className="font-medium text-slate-700">{booking.payment.method}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Transaction ID</span>
                    <span className="font-mono text-xs text-slate-600">{booking.payment.razorpayId}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Status</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] h-4">
                      {booking.payment.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pickup point */}
          <motion.div variants={item}>
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  Pickup Point
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 font-medium">{booking.pickup.location}</p>
                <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {booking.pickup.time}
                </p>
                <div className="mt-3 border-t border-slate-50 pt-3">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Meeting Point</p>
                  <p className="mt-1 text-sm text-slate-700">{booking.meetingPoint}</p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(booking.meetingPoint)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <MapPin className="w-3 h-3" /> Open in Maps
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div variants={item} className="flex flex-col gap-2">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2"
              onClick={() => generateReceipt(booking)}
            >
              <Download className="w-4 h-4" />
              Download Receipt
            </Button>
            {isCompleted && (
              <Link href="/dashboard/reviews">
                <Button
                  variant="outline"
                  className="w-full rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50 gap-2"
                >
                  <Star className="w-4 h-4" />
                  Write Review
                </Button>
              </Link>
            )}
            {isUpcoming && (
              <Button
                variant="outline"
                className="w-full rounded-xl border-red-200 text-red-500 hover:bg-red-50 gap-2"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="w-4 h-4" />
                Cancel Booking
              </Button>
            )}

            {/* Cancel confirmation dialog */}
            {cancelOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    Cancel Booking
                  </h3>
                  <p className="text-sm text-gray-600">Are you sure? This action cannot be undone. A refund will be calculated based on the cancellation policy.</p>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancellation (optional)"
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setCancelOpen(false)} disabled={cancelling}>
                      Keep Booking
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      disabled={cancelling}
                      onClick={async () => {
                        setCancelling(true);
                        try {
                          const res = await fetch(`/api/bookings/${booking?.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "cancel", reason: cancelReason }),
                          });
                          if (res.ok) {
                            setBooking((prev) => prev ? { ...prev, status: "cancelled", tab: "cancelled" } : prev);
                            setCancelOpen(false);
                          }
                        } catch { /* ignore */ } finally {
                          setCancelling(false);
                        }
                      }}
                    >
                      {cancelling ? "Cancelling..." : "Yes, Cancel"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
