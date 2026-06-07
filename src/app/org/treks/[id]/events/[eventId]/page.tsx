"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  MapPin,
  Users,
  Clock,
  Copy,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const EVENT_INFO = {
  id: "e1",
  trek: "Rajmachi Fort Trek via Udhewadi",
  date: "2026-06-14",
  reportingTime: "05:30",
  adultPrice: 1800,
  childPrice: 900,
  totalSeats: 30,
  bookedSeats: 22,
  status: "upcoming",
};

interface PickupPoint {
  id: string;
  label: string;
  address: string;
  mapsUrl: string;
  pickupTime: string;
  extraCharge: number;
}

const MOCK_PICKUPS: PickupPoint[] = [
  {
    id: "p1",
    label: "Shivajinagar Bus Stand",
    address: "Shivajinagar, Pune - 411005",
    mapsUrl: "https://maps.google.com/?q=Shivajinagar+Bus+Stand+Pune",
    pickupTime: "04:00",
    extraCharge: 0,
  },
  {
    id: "p2",
    label: "Wakad Phata",
    address: "Wakad Phata, Pimpri-Chinchwad",
    mapsUrl: "https://maps.google.com/?q=Wakad+Phata+Pune",
    pickupTime: "04:20",
    extraCharge: 0,
  },
  {
    id: "p3",
    label: "Dehu Road",
    address: "Dehu Road, Pune",
    mapsUrl: "https://maps.google.com/?q=Dehu+Road+Pune",
    pickupTime: "04:40",
    extraCharge: 100,
  },
];

interface Booking {
  id: string;
  bookingNo: string;
  trekker: string;
  email: string;
  adults: number;
  children: number;
  amount: number;
  pickup: string;
  status: "confirmed" | "pending" | "cancelled";
}

const MOCK_BOOKINGS: Booking[] = [
  {
    id: "b1",
    bookingNo: "SB-2026-0142",
    trekker: "Priya Sharma",
    email: "priya@example.com",
    adults: 2,
    children: 1,
    amount: 5400,
    pickup: "Shivajinagar Bus Stand",
    status: "confirmed",
  },
  {
    id: "b2",
    bookingNo: "SB-2026-0143",
    trekker: "Amit Kulkarni",
    email: "amit@example.com",
    adults: 1,
    children: 0,
    amount: 1800,
    pickup: "Wakad Phata",
    status: "confirmed",
  },
  {
    id: "b3",
    bookingNo: "SB-2026-0148",
    trekker: "Rahul Desai",
    email: "rahul@example.com",
    adults: 4,
    children: 0,
    amount: 7200,
    pickup: "Dehu Road",
    status: "confirmed",
  },
  {
    id: "b4",
    bookingNo: "SB-2026-0151",
    trekker: "Sneha Joshi",
    email: "sneha@example.com",
    adults: 2,
    children: 2,
    amount: 5400,
    pickup: "Shivajinagar Bus Stand",
    status: "pending",
  },
];

// ─── API mapper ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiBookings(raw: any[]): Booking[] {
  return raw.map((b) => ({
    id: b.id ?? "",
    bookingNo: b.booking_number ?? "",
    trekker: b.booking_name ?? "",
    email: b.booking_email ?? "",
    adults: Number(b.num_adults ?? 0),
    children: Number(b.num_children ?? 0),
    amount: Number(b.total_amount ?? 0),
    pickup: b.trek_events?.pickup_label ?? "",
    status: (b.status ?? "pending") as "confirmed" | "pending" | "cancelled",
  }));
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

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
  };
  return map[s] ?? "bg-slate-100 text-slate-600";
}

// ─── Pickup Point Dialog ────────────────────────────────────────────────────────

interface PickupForm {
  label: string;
  address: string;
  mapsUrl: string;
  pickupTime: string;
  extraCharge: string;
}

const EMPTY_PICKUP: PickupForm = {
  label: "",
  address: "",
  mapsUrl: "",
  pickupTime: "",
  extraCharge: "0",
};

function PickupDialog({
  open,
  onClose,
  initial,
  onSave,
  title,
}: {
  open: boolean;
  onClose: () => void;
  initial?: PickupForm;
  onSave: (form: PickupForm) => void;
  title: string;
}) {
  const [form, setForm] = useState<PickupForm>(initial ?? EMPTY_PICKUP);
  const set = (k: keyof PickupForm, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Label *</label>
            <Input value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="e.g. Shivajinagar Bus Stand" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Full address" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Google Maps URL</label>
            <Input value={form.mapsUrl} onChange={(e) => set("mapsUrl", e.target.value)} placeholder="https://maps.google.com/..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Pickup Time *</label>
              <Input type="time" value={form.pickupTime} onChange={(e) => set("pickupTime", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Extra Charge (₹)</label>
              <Input type="number" value={form.extraCharge} onChange={(e) => set("extraCharge", e.target.value)} min={0} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(form); onClose(); }}>Save Pickup Point</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const params = useParams<{ id: string; eventId: string }>();
  const eventId = params?.eventId;

  const [pickups, setPickups] = useState<PickupPoint[]>(MOCK_PICKUPS);
  const [addOpen, setAddOpen] = useState(false);
  const [editPickup, setEditPickup] = useState<PickupPoint | null>(null);

  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    setBookingsLoading(true);
    fetch(`/api/bookings?trek_event_id=${eventId}`)
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json.bookings)) setBookings(mapApiBookings(json.bookings));
      })
      .catch(() => {/* keep fallback */})
      .finally(() => setBookingsLoading(false));
  }, [eventId]);

  const fillPct = Math.round((EVENT_INFO.bookedSeats / EVENT_INFO.totalSeats) * 100);

  const handleAddPickup = (form: PickupForm) => {
    setPickups((prev) => [
      ...prev,
      {
        id: `p${Date.now()}`,
        label: form.label,
        address: form.address,
        mapsUrl: form.mapsUrl,
        pickupTime: form.pickupTime,
        extraCharge: Number(form.extraCharge),
      },
    ]);
  };

  const handleEditPickup = (form: PickupForm) => {
    if (!editPickup) return;
    setPickups((prev) =>
      prev.map((p) =>
        p.id === editPickup.id
          ? { ...p, ...form, extraCharge: Number(form.extraCharge) }
          : p
      )
    );
    setEditPickup(null);
  };

  const handleDeletePickup = (id: string) => {
    setPickups((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 space-y-8">
      {/* Back */}
      <Link
        href="/org/treks/t1/events"
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Events
      </Link>

      {/* Event info card */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-bold text-slate-900 mb-1">{EVENT_INFO.trek}</h1>
        <div className="flex flex-wrap gap-6 mt-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="h-4 w-4 text-slate-400" />
            <div>
              <span className="font-medium">{formatDate(EVENT_INFO.date)}</span>
              <span className="text-slate-400"> · Reporting at {EVENT_INFO.reportingTime}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Users className="h-4 w-4 text-slate-400" />
            <span>
              <span className="font-medium">{EVENT_INFO.bookedSeats}</span>/{EVENT_INFO.totalSeats} seats booked
            </span>
          </div>
        </div>

        {/* Seat fill bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Seat fill</span>
            <span className="font-medium">{fillPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className={`h-full rounded-full ${
                fillPct >= 100 ? "bg-rose-500" : fillPct >= 75 ? "bg-amber-400" : "bg-emerald-500"
              }`}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <div className="text-center">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">Adult Price</p>
            <p className="text-lg font-bold text-slate-900">{formatPrice(EVENT_INFO.adultPrice)}</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">Child Price</p>
            <p className="text-lg font-bold text-slate-900">{formatPrice(EVENT_INFO.childPrice)}</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">Status</p>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              Upcoming
            </span>
          </div>
        </div>
      </motion.div>

      {/* Pickup Points */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Pickup Points</h2>
            <p className="text-xs text-slate-500">{pickups.length} pickup points configured</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => {
                // Copy from previous event mock
                setPickups(MOCK_PICKUPS);
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy from Previous Event
            </Button>
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Pickup Point
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {pickups.map((pickup, i) => (
              <motion.div
                key={pickup.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{pickup.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{pickup.address}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-slate-600">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {pickup.pickupTime}
                      </span>
                      {pickup.extraCharge > 0 && (
                        <span className="text-xs font-medium text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
                          +{formatPrice(pickup.extraCharge)} extra
                        </span>
                      )}
                      {pickup.mapsUrl && (
                        <a
                          href={pickup.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <MapPin className="h-3 w-3" />
                          Maps
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditPickup(pickup)}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:border-primary hover:text-primary transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePickup(pickup.id)}
                    className="rounded-lg border border-rose-100 p-1.5 text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {pickups.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-10 text-center">
              <MapPin className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No pickup points yet</p>
              <p className="text-xs text-slate-400">Add pickup points for trekkers to choose from</p>
            </div>
          )}
        </div>
      </motion.section>

      {/* Bookings table */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-800">Bookings for This Event</h2>
          <p className="text-xs text-slate-500">{bookingsLoading ? "Loading…" : `${bookings.length} bookings`}</p>
        </div>

        {bookingsLoading ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Booking #", "Trekker", "Persons", "Amount", "Pickup", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <motion.tr
                    key={b.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/org/bookings/${b.id}`} className="font-mono text-xs text-primary hover:underline">
                        {b.bookingNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {b.trekker.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{b.trekker}</p>
                          <p className="text-[11px] text-slate-400">{b.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.adults}A{b.children > 0 ? ` · ${b.children}C` : ""}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatPrice(b.amount)}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs max-w-[120px] truncate">{b.pickup}</td>
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
        </div>
        )}
      </motion.section>

      {/* Dialogs */}
      <PickupDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleAddPickup}
        title="Add Pickup Point"
      />
      {editPickup && (
        <PickupDialog
          open={!!editPickup}
          onClose={() => setEditPickup(null)}
          initial={{
            label: editPickup.label,
            address: editPickup.address,
            mapsUrl: editPickup.mapsUrl,
            pickupTime: editPickup.pickupTime,
            extraCharge: editPickup.extraCharge.toString(),
          }}
          onSave={handleEditPickup}
          title="Edit Pickup Point"
        />
      )}
    </div>
  );
}
