"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, X, Eye, AlertTriangle, ChevronLeft,
  Calendar, CalendarDays, CalendarRange, CalendarClock, Repeat, Loader2, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn, formatPrice } from "@/lib/utils";
type ScheduleType = "single" | "weekly" | "biweekly" | "monthly" | "custom";

// ─── Types ───────────────────────────────────────────────────────────────────

type EventStatus = "upcoming" | "full" | "completed" | "cancelled";

interface TrekEvent {
  id: string;
  date: string;
  endDate?: string;
  reportingTime: string;
  adultPrice: number;
  childPrice: number;
  totalSeats: number;
  bookedSeats: number;
  status: EventStatus;
}

// ─── Mock fallback ───────────────────────────────────────────────────────────

const MOCK_EVENTS: TrekEvent[] = [
  { id: "e1", date: "2026-06-14", reportingTime: "05:30", adultPrice: 1800, childPrice: 900, totalSeats: 30, bookedSeats: 22, status: "upcoming" },
  { id: "e2", date: "2026-06-21", reportingTime: "05:30", adultPrice: 1900, childPrice: 950, totalSeats: 25, bookedSeats: 25, status: "full" },
  { id: "e3", date: "2026-05-31", reportingTime: "05:30", adultPrice: 1800, childPrice: 900, totalSeats: 30, bookedSeats: 30, status: "completed" },
  { id: "e4", date: "2026-07-05", reportingTime: "06:00", adultPrice: 1800, childPrice: 900, totalSeats: 28, bookedSeats: 4, status: "upcoming" },
];

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function statusConfig(status: EventStatus) {
  const map: Record<EventStatus, { label: string; className: string }> = {
    upcoming: { label: "Upcoming", className: "bg-blue-100 text-blue-700" },
    full: { label: "Sold Out", className: "bg-amber-100 text-amber-700" },
    completed: { label: "Completed", className: "bg-slate-100 text-slate-600" },
    cancelled: { label: "Cancelled", className: "bg-rose-100 text-rose-700" },
  };
  return map[status] ?? { label: status, className: "bg-slate-100 text-slate-600" };
}

// Generate preview dates for the schedule form
function previewDates(scheduleType: ScheduleType, form: ScheduleFormState): string[] {
  const dates: string[] = [];
  const today = new Date().toISOString().split("T")[0];

  if (scheduleType === "single") {
    if (form.eventDate && form.eventDate >= today) dates.push(form.eventDate);
  } else if (scheduleType === "custom") {
    dates.push(...form.customDates.filter((d) => d >= today).sort());
  } else if (scheduleType === "weekly" || scheduleType === "biweekly") {
    if (form.dayOfWeek >= 0 && form.startDate && form.endDateRange) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDateRange);
      const step = scheduleType === "biweekly" ? 14 : 7;
      const current = new Date(start);
      while (current.getDay() !== form.dayOfWeek) current.setDate(current.getDate() + 1);
      while (current <= end) {
        const d = current.toISOString().split("T")[0];
        if (d >= today) dates.push(d);
        current.setDate(current.getDate() + step);
      }
    }
  } else if (scheduleType === "monthly") {
    if (form.dayOfMonth > 0 && form.startDate && form.endDateRange) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDateRange);
      const targetDay = Math.min(form.dayOfMonth, 28);
      const current = new Date(start.getFullYear(), start.getMonth(), targetDay);
      if (current < start) current.setMonth(current.getMonth() + 1);
      while (current <= end) {
        const d = current.toISOString().split("T")[0];
        if (d >= today) dates.push(d);
        current.setMonth(current.getMonth() + 1);
      }
    }
  }
  return dates;
}

// ─── Schedule type options ───────────────────────────────────────────────────

const SCHEDULE_OPTIONS: { value: ScheduleType; label: string; desc: string; icon: React.ElementType }[] = [
  { value: "single", label: "Single Date", desc: "One specific date", icon: Calendar },
  { value: "weekly", label: "Weekly", desc: "Same day every week", icon: CalendarDays },
  { value: "biweekly", label: "Bi-weekly", desc: "Every other week", icon: CalendarRange },
  { value: "monthly", label: "Monthly", desc: "Same date each month", icon: CalendarClock },
  { value: "custom", label: "Custom Dates", desc: "Pick multiple dates", icon: Repeat },
];

// ─── Schedule form state ─────────────────────────────────────────────────────

interface ScheduleFormState {
  eventDate: string;
  dayOfWeek: number;
  dayOfMonth: number;
  startDate: string;
  endDateRange: string;
  customDates: string[];
  customDateInput: string;
  reportingTime: string;
  adultPrice: string;
  childPrice: string;
  totalSeats: string;
}

const INITIAL_FORM: ScheduleFormState = {
  eventDate: "",
  dayOfWeek: 6, // Saturday
  dayOfMonth: 15,
  startDate: "",
  endDateRange: "",
  customDates: [],
  customDateInput: "",
  reportingTime: "06:00",
  adultPrice: "1200",
  childPrice: "800",
  totalSeats: "25",
};

// ─── Schedule Dialog ─────────────────────────────────────────────────────────

function ScheduleDialog({
  open,
  onClose,
  trekId,
  onCreated,
  defaultAdultPrice,
  defaultChildPrice,
}: {
  open: boolean;
  onClose: () => void;
  trekId: string;
  onCreated: () => void;
  defaultAdultPrice?: string;
  defaultChildPrice?: string;
}) {
  const [scheduleType, setScheduleType] = useState<ScheduleType>("single");
  const [form, setForm] = useState<ScheduleFormState>({
    ...INITIAL_FORM,
    adultPrice: defaultAdultPrice || INITIAL_FORM.adultPrice,
    childPrice: defaultChildPrice || INITIAL_FORM.childPrice,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const set = <K extends keyof ScheduleFormState>(k: K, v: ScheduleFormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const preview = useMemo(() => previewDates(scheduleType, form), [scheduleType, form]);

  function addCustomDate() {
    if (form.customDateInput && !form.customDates.includes(form.customDateInput)) {
      set("customDates", [...form.customDates, form.customDateInput].sort());
      set("customDateInput", "");
    }
  }

  function removeCustomDate(d: string) {
    set("customDates", form.customDates.filter((x) => x !== d));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/treks/${trekId}/events/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schedule_type: scheduleType,
        event_date: form.eventDate,
        day_of_week: form.dayOfWeek,
        day_of_month: form.dayOfMonth,
        start_date: form.startDate,
        end_date_range: form.endDateRange,
        custom_dates: form.customDates,
        reporting_time: form.reportingTime,
        price: Number(form.adultPrice),
        child_price: Number(form.childPrice) || undefined,
        total_seats: Number(form.totalSeats),
      }),
    });
    const result = await res.json();

    setSubmitting(false);

    if (!res.ok) {
      setError(result.error ?? "Failed to create events.");
    } else {
      setSuccess(`${result.count} event${result.count > 1 ? "s" : ""} created successfully!`);
      setTimeout(() => {
        onCreated();
        onClose();
        setForm(INITIAL_FORM);
        setScheduleType("single");
        setSuccess("");
      }, 1500);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Trek Dates</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Schedule type selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Schedule Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SCHEDULE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setScheduleType(opt.value); setError(""); }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all",
                    scheduleType === opt.value
                      ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <opt.icon className={cn("h-5 w-5", scheduleType === opt.value ? "text-emerald-600" : "text-slate-400")} />
                  <span className={cn("text-xs font-medium", scheduleType === opt.value ? "text-emerald-700" : "text-slate-600")}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-slate-400">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Single date ── */}
          {scheduleType === "single" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date *</label>
              <Input type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
            </div>
          )}

          {/* ── Weekly / Bi-weekly ── */}
          {(scheduleType === "weekly" || scheduleType === "biweekly") && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Day of the Week
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => set("dayOfWeek", i)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                        form.dayOfWeek === i
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-200 text-slate-600 hover:border-emerald-400"
                      )}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">From Date *</label>
                  <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Until Date *</label>
                  <Input type="date" value={form.endDateRange} onChange={(e) => set("endDateRange", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* ── Monthly ── */}
          {scheduleType === "monthly" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Day of Month (1-28)</label>
                <Input
                  type="number" min={1} max={28}
                  value={form.dayOfMonth}
                  onChange={(e) => set("dayOfMonth", Math.min(28, Math.max(1, Number(e.target.value))))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">From Month *</label>
                  <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Until Month *</label>
                  <Input type="date" value={form.endDateRange} onChange={(e) => set("endDateRange", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* ── Custom dates ── */}
          {scheduleType === "custom" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Pick Dates</label>
              <div className="flex gap-2 mb-2">
                <Input
                  type="date"
                  value={form.customDateInput}
                  onChange={(e) => set("customDateInput", e.target.value)}
                  className="flex-1"
                />
                <Button type="button" onClick={addCustomDate} size="sm" className="shrink-0">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              {form.customDates.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.customDates.map((d) => (
                    <span key={d} className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-2 py-1 rounded-lg">
                      {new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      <button type="button" onClick={() => removeCustomDate(d)} className="hover:text-red-600">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Common fields ── */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Event Details (applies to all dates)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reporting Time *</label>
                <Input type="time" value={form.reportingTime} onChange={(e) => set("reportingTime", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Total Seats *</label>
                <Input type="number" min={1} max={200} value={form.totalSeats} onChange={(e) => set("totalSeats", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Adult Price (₹) *</label>
                <Input type="number" min={0} value={form.adultPrice} onChange={(e) => set("adultPrice", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Child Price (₹)</label>
                <Input type="number" min={0} value={form.childPrice} onChange={(e) => set("childPrice", e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Preview ── */}
          {preview.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Preview — {preview.length} event{preview.length > 1 ? "s" : ""} will be created
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {preview.map((d) => (
                  <span key={d} className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                    {new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-2.5 flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              {success}
            </motion.div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || preview.length === 0}>
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Creating...</>
            ) : (
              <>Create {preview.length} Event{preview.length !== 1 ? "s" : ""}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const params = useParams();
  const trekId = params.id as string;

  const [events, setEvents] = useState<TrekEvent[]>(MOCK_EVENTS);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [trekDefaults, setTrekDefaults] = useState<{ adultPrice: string; childPrice: string }>({ adultPrice: "", childPrice: "" });

  // Fetch trek default prices
  useEffect(() => {
    fetch(`/api/treks/${trekId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.trek) {
          setTrekDefaults({
            adultPrice: data.trek.default_adult_price ? String(data.trek.default_adult_price) : "",
            childPrice: data.trek.default_child_price ? String(data.trek.default_child_price) : "",
          });
        }
      })
      .catch(() => {});
  }, [trekId]);

  async function fetchEvents() {
    try {
      const res = await fetch(`/api/treks/${trekId}/events`);
      const result = res.ok ? await res.json() : null;
      const eventsData = result?.events ?? result?.data ?? [];
      if (eventsData.length > 0) {
        setEvents(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          eventsData.map((e: any) => ({
            id: String(e.id),
            date: String(e.event_date),
            endDate: e.end_date ? String(e.end_date) : undefined,
            reportingTime: String(e.reporting_time ?? "06:00"),
            adultPrice: Number(e.price ?? 0),
            childPrice: Number(e.child_price ?? 0),
            totalSeats: Number(e.total_seats ?? 0),
            bookedSeats: Number(e.booked_seats ?? 0),
            status: String(e.status ?? "upcoming") as EventStatus,
          }))
        );
        setIsMock(false);
      }
    } catch {
      // keep mock data
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchEvents(); }, [trekId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCancel(id: string) {
    setCancelling(true);
    const res = await fetch(`/api/treks/${trekId}/events/${id}`, { method: "DELETE" });
    setCancelling(false);
    setCancelId(null);
    if (res.ok) {
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "cancelled" } : e)));
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <Link
            href="/org/treks"
            className="mb-1 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> My Treks
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Scheduled Dates</h1>
          <p className="text-sm text-slate-500">
            {events.length} event{events.length !== 1 ? "s" : ""} scheduled
            {isMock && <span className="ml-2 text-xs text-amber-500">(Sample data)</span>}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Schedule Dates
        </Button>
      </motion.div>

      {/* Events table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      >
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No dates scheduled</p>
            <p className="text-xs text-slate-400 mt-1">Click &quot;Schedule Dates&quot; to add your first event</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Date", "Time", "Price", "Seats", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {events.map((event, i) => {
                    const fillPct = event.totalSeats > 0 ? Math.round((event.bookedSeats / event.totalSeats) * 100) : 0;
                    const sc = statusConfig(event.status);
                    return (
                      <motion.tr
                        key={event.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                          {formatDate(event.date)}
                          {event.endDate && event.endDate !== event.date && (
                            <span className="text-slate-400 text-xs ml-1">
                              — {new Date(event.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{event.reportingTime}</td>
                        <td className="px-4 py-3 text-slate-700">
                          <div className="text-xs">
                            <span className="font-medium">{formatPrice(event.adultPrice)}</span>
                            <span className="text-slate-400"> adult</span>
                          </div>
                          {event.childPrice > 0 && (
                            <div className="text-xs text-slate-400">{formatPrice(event.childPrice)} child</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  fillPct >= 100 ? "bg-rose-500" : fillPct >= 75 ? "bg-amber-400" : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(fillPct, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 tabular-nums">
                              {event.bookedSeats}/{event.totalSeats}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${sc.className}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/org/treks/${trekId}/events/${event.id}`}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:border-primary hover:text-primary transition-colors"
                              title="View Bookings & Pickup Points"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                            {event.status === "upcoming" && (
                              <button
                                type="button"
                                onClick={() => setCancelId(event.id)}
                                className="rounded-lg border border-rose-100 p-1.5 text-rose-500 hover:bg-rose-50 transition-colors"
                                title="Cancel Event"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Schedule dialog */}
      <ScheduleDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        trekId={trekId}
        onCreated={fetchEvents}
        defaultAdultPrice={trekDefaults.adultPrice}
        defaultChildPrice={trekDefaults.childPrice}
      />

      {/* Cancel confirmation dialog */}
      <Dialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" /> Cancel Event?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 py-2">
            This will cancel the event and notify all booked trekkers. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)} disabled={cancelling}>Keep Event</Button>
            <Button
              variant="destructive"
              disabled={cancelling}
              onClick={() => cancelId && handleCancel(cancelId)}
            >
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Yes, Cancel Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
