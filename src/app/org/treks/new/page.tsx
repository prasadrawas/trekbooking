"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Image as ImageIcon,
  MapPin,
  Info,
  Tag,
  Camera,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LEVELS, REGIONS, DURATION_OPTIONS } from "@/lib/constants";
import { CancellationRulesBuilder } from "@/components/shared/cancellation-rules-builder";
import type { CancellationRule } from "@/components/shared/cancellation-rules-builder";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1
  title: string;
  shortDescription: string;
  fullDescription: string;
  difficulty: string;
  duration: number;
  distanceKm: string;
  elevationM: string;
  region: string;
  // Step 2
  meetingPoint: string;
  meetingPointUrl: string;
  itinerary: Array<{ day: number; title: string; details: string }>;
  inclusions: string[];
  exclusions: string[];
  thingsToCarry: string[];
  cancellationPolicy: string;
  cancellationRules: CancellationRule[];
  // Step 3
  isChildFriendly: boolean;
  minChildAge: string;
  childPricingPolicy: string;
  adultPrice: string;
  childPrice: string;
  // Step 4
  photos: Array<{ id: string; url: string; isCover: boolean; file?: File; uploaded?: boolean; uploading?: boolean }>;
  // Step 5 — Pickup Points
  pickupPoints: Array<{
    id: string;
    label: string;
    address: string;
    mapsUrl: string;
    pickupTime: string;
    extraCharge: string;
  }>;
}

const INITIAL: FormData = {
  title: "",
  shortDescription: "",
  fullDescription: "",
  difficulty: "",
  duration: 1,
  distanceKm: "",
  elevationM: "",
  region: "",
  meetingPoint: "",
  meetingPointUrl: "",
  itinerary: [],
  inclusions: [],
  exclusions: [],
  thingsToCarry: [],
  cancellationPolicy: "",
  cancellationRules: [
    { hours_before: 48, refund_percent: 100 },
    { hours_before: 24, refund_percent: 50 },
    { hours_before: 0, refund_percent: 0 },
  ],
  isChildFriendly: false,
  minChildAge: "",
  childPricingPolicy: "discounted",
  adultPrice: "",
  childPrice: "",
  photos: [],
  pickupPoints: [],
};

const STEPS = [
  { id: 1, label: "Basic Info", icon: Info },
  { id: 2, label: "Details", icon: MapPin },
  { id: 3, label: "Pricing", icon: Tag },
  { id: 4, label: "Photos", icon: Camera },
  { id: 5, label: "Pickups", icon: MapPin },
  { id: 6, label: "Review", icon: Eye },
];

// ─── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                    ? "border-primary bg-white text-primary"
                    : "border-slate-200 bg-white text-slate-400"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <span
                className={cn(
                  "hidden text-[10px] font-medium sm:block whitespace-nowrap",
                  active ? "text-primary" : done ? "text-slate-600" : "text-slate-400"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 transition-all duration-300",
                  done ? "bg-primary" : "bg-slate-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tag input ─────────────────────────────────────────────────────────────────

function TagInput({
  label,
  items,
  onChange,
  placeholder = "Type and press Enter",
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (v && !items.includes(v)) onChange([...items, v]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-input bg-white p-2 min-h-[2.5rem]">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(items.filter((i) => i !== item))}
              className="ml-0.5 hover:text-rose-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={items.length === 0 ? placeholder : "Add more…"}
          className="flex-1 min-w-[120px] border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

// ─── Steps ─────────────────────────────────────────────────────────────────────

function Step1({ data, set }: { data: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-slate-800">Basic Information</h2>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Trek Title *</label>
        <Input
          value={data.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Rajmachi Fort Trek via Udhewadi"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Short Description *{" "}
          <span className={`text-xs ${data.shortDescription.length > 160 ? "text-rose-500" : "text-slate-400"}`}>
            ({data.shortDescription.length}/160)
          </span>
        </label>
        <textarea
          value={data.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
          rows={2}
          maxLength={170}
          placeholder="A short, enticing description shown in search results"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Description</label>
        <textarea
          value={data.fullDescription}
          onChange={(e) => set("fullDescription", e.target.value)}
          rows={5}
          placeholder="Describe the trek in detail — highlights, route, what to expect, etc."
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Difficulty *</label>
          <Select value={data.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
            <option value="">Select…</option>
            {DIFFICULTY_LEVELS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration (days)</label>
          <Input
            type="number"
            min={1}
            max={30}
            value={data.duration}
            onChange={(e) => set("duration", Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Distance (km)</label>
          <Input
            type="number"
            value={data.distanceKm}
            onChange={(e) => set("distanceKm", e.target.value)}
            placeholder="e.g. 14"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Elevation (m)</label>
          <Input
            type="number"
            value={data.elevationM}
            onChange={(e) => set("elevationM", e.target.value)}
            placeholder="e.g. 1429"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Region *</label>
        <Select value={data.region} onChange={(e) => set("region", e.target.value)}>
          <option value="">Select region…</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </Select>
      </div>
    </div>
  );
}

function ItineraryAddForm({ nextDay, onAdd }: { nextDay: number; onAdd: (item: { day: number; title: string; details: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  function handleAdd() {
    if (!title.trim()) return;
    onAdd({ day: nextDay, title: title.trim(), details: details.trim() });
    setTitle("");
    setDetails("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
      >
        + Add Day {nextDay}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-700">Day {nextDay}</p>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
        <Input placeholder={`e.g. Pune → Base Village → Summit`} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Details</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          placeholder="Describe the day's activities, timings, meals, etc."
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => { setOpen(false); setTitle(""); setDetails(""); }}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} disabled={!title.trim()}>Add Day {nextDay}</Button>
      </div>
    </div>
  );
}

function Step2({ data, set }: { data: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-slate-800">Details & Inclusions</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Meeting Point *</label>
          <Input
            value={data.meetingPoint}
            onChange={(e) => set("meetingPoint", e.target.value)}
            placeholder="e.g. Udhewadi Village Parking"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Google Maps URL</label>
          <Input
            value={data.meetingPointUrl}
            onChange={(e) => set("meetingPointUrl", e.target.value)}
            placeholder="https://maps.google.com/..."
          />
        </div>
      </div>

      <TagInput
        label="Inclusions"
        items={data.inclusions}
        onChange={(v) => set("inclusions", v)}
        placeholder="e.g. Breakfast, Trek leader…"
      />
      <TagInput
        label="Exclusions"
        items={data.exclusions}
        onChange={(v) => set("exclusions", v)}
        placeholder="e.g. Transport, Accommodation…"
      />
      <TagInput
        label="Things to Carry"
        items={data.thingsToCarry}
        onChange={(v) => set("thingsToCarry", v)}
        placeholder="e.g. Trekking shoes, Water 2L…"
      />

      {/* Itinerary */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Day-by-Day Itinerary <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        {data.itinerary.length > 0 && (
          <div className="space-y-2 mb-3">
            {data.itinerary.map((day, i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0 mt-0.5">
                  {day.day}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{day.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{day.details}</p>
                </div>
                <button
                  type="button"
                  onClick={() => set("itinerary", data.itinerary.filter((_, idx) => idx !== i))}
                  className="text-slate-400 hover:text-rose-500 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <ItineraryAddForm
          nextDay={data.itinerary.length + 1}
          onAdd={(item) => set("itinerary", [...data.itinerary, item])}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Cancellation Policy</label>
        <CancellationRulesBuilder
          rules={data.cancellationRules}
          onChange={(rules) => set("cancellationRules", rules)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Additional cancellation notes (optional)
        </label>
        <textarea
          value={data.cancellationPolicy}
          onChange={(e) => set("cancellationPolicy", e.target.value)}
          rows={3}
          placeholder="Any extra cancellation or refund notes for trekkers…"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>
    </div>
  );
}

function Step3({ data, set }: { data: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-slate-800">Child Friendly & Pricing</h2>

      {/* Child friendly toggle */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-800">Child Friendly Trek</p>
          <p className="text-xs text-slate-500">Allow parents to book spots for children</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={data.isChildFriendly}
          onClick={() => set("isChildFriendly", !data.isChildFriendly)}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors duration-200",
            data.isChildFriendly ? "bg-primary" : "bg-slate-300"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
              data.isChildFriendly && "translate-x-5"
            )}
          />
        </button>
      </div>

      <AnimatePresence>
        {data.isChildFriendly && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Minimum Child Age (years)
              </label>
              <Input
                type="number"
                value={data.minChildAge}
                onChange={(e) => set("minChildAge", e.target.value)}
                placeholder="e.g. 8"
                min={1}
                max={18}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Child Pricing Policy
              </label>
              <Select
                value={data.childPricingPolicy}
                onChange={(e) => set("childPricingPolicy", e.target.value)}
              >
                <option value="discounted">Half Price</option>
                <option value="same_price">Same Price</option>
                <option value="free_under_age">Free (under age)</option>
              </Select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pricing */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Default Adult Price (₹) *
          </label>
          <Input
            type="number"
            value={data.adultPrice}
            onChange={(e) => set("adultPrice", e.target.value)}
            placeholder="e.g. 1800"
            min={0}
          />
          <p className="mt-1 text-xs text-slate-400">
            Price per person. Can be overridden per event.
          </p>
        </div>
        {data.isChildFriendly && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Default Child Price (₹)
            </label>
            <Input
              type="number"
              value={data.childPrice}
              onChange={(e) => set("childPrice", e.target.value)}
              placeholder="e.g. 900"
              min={0}
            />
          </div>
        )}
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">
        <strong>Note:</strong> SahyadriBook charges a 10% platform commission on each booking.
        Your payout = Total collected × 90%.
      </div>
    </div>
  );
}

function Step4({ data, set }: { data: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos = Array.from(files).map((f, i) => ({
      id: `photo-${Date.now()}-${i}`,
      url: URL.createObjectURL(f),
      isCover: data.photos.length === 0 && i === 0,
      file: f,
      uploaded: false,
      uploading: false,
    }));

    set("photos", [...data.photos, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-slate-800">Trek Photos</h2>
      <p className="text-sm text-slate-500">Select images to upload. They will be saved when you click Save & Next.</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
      >
        <Upload className="h-8 w-8 text-slate-400" />
        <div>
          <p className="text-sm font-medium text-slate-700">Click to browse photos</p>
          <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP — max 5 MB each</p>
        </div>
      </button>

      {data.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {data.photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-colors">
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
              {photo.uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                </div>
              )}
              {photo.uploaded && (
                <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              {!photo.file && (
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-600 text-[9px] font-bold text-white">Saved</div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => set("photos", data.photos.map((p) => ({ ...p, isCover: p.id === photo.id })))}
                  className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", photo.isCover ? "bg-primary text-white" : "bg-white/80 text-slate-800")}
                >
                  {photo.isCover ? "Cover ✓" : "Set Cover"}
                </button>
                <button
                  type="button"
                  onClick={() => { const r = data.photos.filter((p) => p.id !== photo.id); if (r.length > 0 && !r.some((p) => p.isCover)) r[0].isCover = true; set("photos", r); }}
                  className="rounded-full bg-rose-500 p-1 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              {photo.isCover && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">Cover</span>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <ImageIcon className="h-6 w-6 text-slate-300" />
            <span className="text-xs text-slate-400 mt-1">Add</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Step 5 — Pickup Points ──────────────────────────────────────────────────

interface PickupPoint {
  id: string;
  label: string;
  address: string;
  mapsUrl: string;
  pickupTime: string;
  extraCharge: string;
}

const EMPTY_PICKUP: Omit<PickupPoint, "id"> = {
  label: "",
  address: "",
  mapsUrl: "",
  pickupTime: "05:30",
  extraCharge: "0",
};

function Step5Pickups({ data, set }: { data: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  const [editing, setEditing] = useState<PickupPoint | null>(null);
  const [form, setForm] = useState(EMPTY_PICKUP);

  function openAdd() {
    setForm(EMPTY_PICKUP);
    setEditing({ id: "", ...EMPTY_PICKUP });
  }

  function openEdit(p: PickupPoint) {
    setForm({ label: p.label, address: p.address, mapsUrl: p.mapsUrl, pickupTime: p.pickupTime, extraCharge: p.extraCharge });
    setEditing(p);
  }

  function save() {
    if (!form.label.trim()) return;
    const points = [...data.pickupPoints];
    if (editing && editing.id) {
      // Edit existing
      const idx = points.findIndex((p) => p.id === editing.id);
      if (idx >= 0) points[idx] = { ...points[idx], ...form };
    } else {
      // Add new
      points.push({ id: `pp-${Date.now()}`, ...form });
    }
    set("pickupPoints", points);
    setEditing(null);
  }

  function remove(id: string) {
    set("pickupPoints", data.pickupPoints.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Default Pickup Points</h2>
        <p className="text-sm text-slate-500 mt-1">
          These pickup points will be automatically added to every event you create for this trek. You can customize them per event later.
        </p>
      </div>

      {/* Pickup list */}
      {data.pickupPoints.length > 0 && (
        <div className="space-y-2">
          {data.pickupPoints.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{p.label}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  {p.address && <span className="truncate max-w-[200px]">{p.address}</span>}
                  <span>⏰ {p.pickupTime}</span>
                  {Number(p.extraCharge) > 0 && <span>+₹{p.extraCharge}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      {editing ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3"
        >
          <p className="text-sm font-semibold text-slate-700">
            {editing.id ? "Edit Pickup Point" : "Add Pickup Point"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Location Name *</label>
              <Input
                placeholder="e.g., Swargate Bus Stand"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
              <Input
                placeholder="Full address (optional)"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Pickup Time *</label>
              <Input
                type="time"
                value={form.pickupTime}
                onChange={(e) => setForm((f) => ({ ...f, pickupTime: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Extra Charge (₹)</label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.extraCharge}
                onChange={(e) => setForm((f) => ({ ...f, extraCharge: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Google Maps URL</label>
              <Input
                placeholder="https://maps.google.com/..."
                value={form.mapsUrl}
                onChange={(e) => setForm((f) => ({ ...f, mapsUrl: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={!form.label.trim()}>
              {editing.id ? "Update" : "Add Pickup Point"}
            </Button>
          </div>
        </motion.div>
      ) : (
        <button
          type="button"
          onClick={openAdd}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-4 text-sm text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
        >
          <MapPin className="h-4 w-4" />
          Add Pickup Point
        </button>
      )}

      {data.pickupPoints.length === 0 && !editing && (
        <p className="text-xs text-slate-400 text-center">
          No pickup points added. Trekkers will meet directly at the meeting point. You can always add pickup points later.
        </p>
      )}
    </div>
  );
}

// ─── Step 6 — Review ──────────────────────────────────────────────────────────

function Step5({
  data,
  onSaveDraft,
  onPublish,
  onPublishAndSchedule,
  isEdit,
  isPending,
}: {
  data: FormData;
  onSaveDraft: () => void;
  onPublish: () => void;
  onPublishAndSchedule?: () => void;
  isEdit?: boolean;
  isPending?: boolean;
}) {
  const rows: Array<[string, string | number | boolean]> = [
    ["Title", data.title || "—"],
    ["Region", data.region || "—"],
    ["Difficulty", data.difficulty || "—"],
    ["Duration", data.duration === 1 ? "1 Day" : `${data.duration} Days`],
    ["Distance", data.distanceKm ? `${data.distanceKm} km` : "—"],
    ["Elevation", data.elevationM ? `${data.elevationM} m` : "—"],
    ["Meeting Point", data.meetingPoint || "—"],
    ["Adult Price", data.adultPrice ? `₹${data.adultPrice}` : "—"],
    ["Child Friendly", data.isChildFriendly ? "Yes" : "No"],
    ["Photos", data.photos.length > 0 ? `${data.photos.length} uploaded` : "None"],
    ["Pickup Points", data.pickupPoints.length > 0 ? data.pickupPoints.map((p) => p.label).join(", ") : "None"],
    ["Inclusions", data.inclusions.join(", ") || "—"],
    ["Exclusions", data.exclusions.join(", ") || "—"],
    ["Itinerary", data.itinerary.length > 0 ? `${data.itinerary.length} day${data.itinerary.length === 1 ? "" : "s"}` : "Not added"],
    ["Cancellation Rules", data.cancellationRules.length > 0 ? `${data.cancellationRules.length} rule${data.cancellationRules.length === 1 ? "" : "s"} defined` : "None"],
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-slate-800">Review & {isEdit ? "Update" : "Publish"}</h2>
      <p className="text-sm text-slate-500">Please review all details before submitting.</p>

      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
        {rows.map(([key, val]) => (
          <div key={key} className="flex items-start gap-4 px-4 py-3 odd:bg-white even:bg-slate-50">
            <span className="w-36 shrink-0 text-xs font-medium text-slate-500 pt-0.5">{key}</span>
            <span className="text-sm text-slate-800">{String(val)}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <div className="flex gap-3">
          <Button variant="outline" onClick={onSaveDraft} disabled={isPending} className="flex-1">
            {isPending ? "Saving…" : "Save as Draft"}
          </Button>
          <Button onClick={onPublish} disabled={isPending} className="flex-1">
            {isPending ? "Saving…" : isEdit ? "Update Trek" : "Publish Trek"}
          </Button>
        </div>
        {!isEdit && onPublishAndSchedule && (
          <Button onClick={onPublishAndSchedule} disabled={isPending} className="w-full gap-2 bg-emerald-700 hover:bg-emerald-800">
            {isPending ? "Saving…" : "Publish & Schedule Dates →"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewTrekPage({ isEdit = false }: { isEdit?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(INITIAL);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const trekIdRef = useRef<string | null>(null);

  const set = (k: keyof FormData, v: unknown) =>
    setData((prev) => ({ ...prev, [k]: v }));

  function buildBody(publish: boolean) {
    return {
      title: data.title.trim(),
      description: data.fullDescription.trim(),
      short_desc: data.shortDescription.trim(),
      difficulty: data.difficulty,
      duration_days: data.duration,
      region: data.region.trim(),
      distance_km: data.distanceKm ? Number(data.distanceKm) : null,
      elevation_m: data.elevationM ? Number(data.elevationM) : null,
      meeting_point: data.meetingPoint.trim() || null,
      meeting_point_url: data.meetingPointUrl.trim() || null,
      inclusions: data.inclusions,
      exclusions: data.exclusions,
      things_to_carry: data.thingsToCarry,
      cancellation_policy: data.cancellationPolicy.trim() || null,
      itinerary: data.itinerary,
      cancellation_rules: data.cancellationRules,
      is_child_friendly: data.isChildFriendly,
      min_child_age: data.isChildFriendly && data.minChildAge ? Number(data.minChildAge) : null,
      child_price_policy: data.isChildFriendly ? data.childPricingPolicy : null,
      default_adult_price: data.adultPrice ? Number(data.adultPrice) : null,
      default_child_price: data.isChildFriendly && data.childPrice ? Number(data.childPrice) : null,
      ...(publish ? { is_published: true } : {}),
      default_pickup_points: data.pickupPoints.map((p) => ({
        label: p.label,
        address: p.address,
        maps_url: p.mapsUrl,
        pickup_time: p.pickupTime,
        extra_charge: Number(p.extraCharge) || 0,
      })),
    };
  }

  async function uploadPhotos(trekId: string) {
    const photosWithFiles = data.photos.filter((p) => p.file && !p.uploaded);
    if (photosWithFiles.length === 0) return;

    const uploadedImages: Array<{ image_url: string; is_cover: boolean; sort_order: number }> = [];

    for (let i = 0; i < photosWithFiles.length; i++) {
      const photo = photosWithFiles[i];
      setData((prev) => ({
        ...prev,
        photos: prev.photos.map((p) => p.id === photo.id ? { ...p, uploading: true } : p),
      }));

      const fd = new globalThis.FormData();
      fd.append("file", photo.file!);
      fd.append("bucket", "trek-images");
      fd.append("folder", `treks/${trekId}`);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const result = await res.json();
        if (res.ok && result.url) {
          uploadedImages.push({ image_url: result.url, is_cover: photo.isCover, sort_order: i });
          setData((prev) => ({
            ...prev,
            photos: prev.photos.map((p) => p.id === photo.id ? { ...p, uploaded: true, uploading: false, url: result.url } : p),
          }));
        }
      } catch {
        setData((prev) => ({
          ...prev,
          photos: prev.photos.map((p) => p.id === photo.id ? { ...p, uploading: false } : p),
        }));
      }
    }

    if (uploadedImages.length > 0) {
      await fetch("/api/treks/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trek_id: trekId, images: uploadedImages }),
      });
    }
  }

  // Save current step data to DB via API
  async function saveStepData(): Promise<boolean> {
    setSaving(true);
    setFormError(null);
    setSaveMessage("");

    try {
      if (!trekIdRef.current) {
        // First save — POST /api/treks to create draft
        if (!data.title.trim()) {
          setFormError("Trek title is required to proceed.");
          setSaving(false);
          return false;
        }
        const res = await fetch("/api/treks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildBody(false)),
        });
        const result = await res.json();
        if (!res.ok) {
          setFormError(result.error ?? "Failed to create trek.");
          setSaving(false);
          return false;
        }
        trekIdRef.current = result.trek?.id ?? result.id;
        setSaveMessage("Draft created");
      } else {
        // Subsequent saves — PUT /api/treks/:slug to update
        const res = await fetch(`/api/treks/${trekIdRef.current}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildBody(false)),
        });
        const result = await res.json();
        if (!res.ok) {
          setFormError(result.error ?? "Failed to save.");
          setSaving(false);
          return false;
        }
        setSaveMessage("Progress saved");
      }

      // Upload photos when leaving Step 4
      if (step === 4 && trekIdRef.current) {
        await uploadPhotos(trekIdRef.current);
      }

      setTimeout(() => setSaveMessage(""), 2000);
      setSaving(false);
      return true;
    } catch {
      setFormError("Failed to save. Please try again.");
      setSaving(false);
      return false;
    }
  }

  const goNext = async () => {
    const saved = await saveStepData();
    if (saved) {
      setDirection(1);
      setStep((s) => Math.min(s + 1, 6));
    }
  };

  const goPrev = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  // Save or create trek, return the trek ID
  async function saveOrCreate(publish: boolean): Promise<string | null> {
    if (trekIdRef.current) {
      const res = await fetch(`/api/treks/${trekIdRef.current}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(publish)),
      });
      const result = await res.json();
      if (!res.ok) { setFormError(result.error ?? "Failed to save."); return null; }
      await uploadPhotos(trekIdRef.current);
      return trekIdRef.current;
    } else {
      const res = await fetch("/api/treks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(publish)),
      });
      const result = await res.json();
      if (!res.ok) { setFormError(result.error ?? "Failed to create."); return null; }
      const id = result.trek?.id ?? result.id;
      trekIdRef.current = id;
      await uploadPhotos(id);
      return id;
    }
  }

  const handleSaveDraft = () => {
    setFormError(null);
    startTransition(async () => {
      const id = await saveOrCreate(false);
      if (id) router.push("/org/treks");
    });
  };

  const handlePublish = () => {
    setFormError(null);
    startTransition(async () => {
      const id = await saveOrCreate(true);
      if (id) router.push("/org/treks");
    });
  };

  const handlePublishAndSchedule = () => {
    setFormError(null);
    startTransition(async () => {
      const id = await saveOrCreate(true);
      if (id) router.push(`/org/treks/${id}/events`);
    });
  };

  const variants = {
    enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? "Edit Trek" : "Create New Trek"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? "Update your trek details below."
            : "Fill in the details below to list your trek on SahyadriBook."}
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <Stepper current={step} />
      </div>

      {/* Step content */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.42, 0, 0.58, 1] as [number, number, number, number] }}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            {step === 1 && <Step1 data={data} set={set} />}
            {step === 2 && <Step2 data={data} set={set} />}
            {step === 3 && <Step3 data={data} set={set} />}
            {step === 4 && <Step4 data={data} set={set} />}
            {step === 5 && <Step5Pickups data={data} set={set} />}
            {step === 6 && (
              <>
                {formError && (
                  <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                    {formError}
                  </div>
                )}
                <Step5
                  data={data}
                  isEdit={isEdit}
                  onSaveDraft={handleSaveDraft}
                  onPublish={handlePublish}
                  onPublishAndSchedule={handlePublishAndSchedule}
                  isPending={isPending}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {step < 6 && (
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={step === 1 || saving}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className="text-xs text-emerald-600 font-medium animate-pulse">
                ✓ {saveMessage}
              </span>
            )}
            {formError && (
              <span className="text-xs text-rose-600 font-medium max-w-[200px] truncate">
                {formError}
              </span>
            )}
            {step > 1 && trekIdRef.current && (
              <Button variant="outline" onClick={() => { setDirection(1); setStep((s) => Math.min(s + 1, 6)); }} disabled={saving} className="gap-2">
                Skip <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={goNext} disabled={saving} className="gap-2">
              {saving ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving...</>
              ) : (
                <>Save & Next <ChevronRight className="h-4 w-4" /></>
              )}
            </Button>
          </div>
        </div>
      )}
      {step === 6 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={goPrev}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Pickup Points
          </button>
        </div>
      )}
    </div>
  );
}
