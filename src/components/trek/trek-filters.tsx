"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Plus, Minus, RotateCcw, SlidersHorizontal } from "lucide-react"
import { DIFFICULTY_LEVELS, REGIONS, DURATION_OPTIONS } from "@/lib/constants"

type SortOption = "popularity" | "price_asc" | "price_desc" | "rating" | "date"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "popularity", label: "Popularity" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Rating" },
  { value: "date", label: "Date" },
]

const DATE_PRESETS = [
  { value: "this_weekend", label: "This Weekend" },
  { value: "next_weekend", label: "Next Weekend" },
  { value: "custom", label: "Custom Date" },
]

function getWeekendDates(offset: 0 | 1) {
  const now = new Date()
  const day = now.getDay()
  const daysUntilSat = ((6 - day + 7) % 7) + offset * 7
  const sat = new Date(now)
  sat.setDate(now.getDate() + daysUntilSat)
  return sat.toISOString().slice(0, 10)
}

interface FiltersState {
  datePreset: string
  customDate: string
  difficulties: string[]
  durations: number[]
  priceMin: string
  priceMax: string
  regions: string[]
  adults: number
  children: number
  childFriendlyOnly: boolean
  sortBy: SortOption
}

function buildInitialState(params: URLSearchParams): FiltersState {
  return {
    datePreset: params.get("date_preset") ?? "",
    customDate: params.get("date") ?? "",
    difficulties: params.getAll("difficulty"),
    durations: params.getAll("duration").map(Number),
    priceMin: params.get("price_min") ?? "",
    priceMax: params.get("price_max") ?? "",
    regions: params.getAll("region"),
    adults: Number(params.get("adults") ?? 1),
    children: Number(params.get("children") ?? 0),
    childFriendlyOnly: params.get("child_friendly") === "true",
    sortBy: (params.get("sort") as SortOption) ?? "popularity",
  }
}

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full py-3 text-sm font-semibold text-gray-800 hover:text-emerald-700 transition-colors"
      >
        {title}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface StepperProps {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  label: string
  sublabel?: string
}

function Stepper({ value, min, max, onChange, label, sublabel }: StepperProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-700">{label}</p>
        {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-sm font-semibold text-gray-800 w-4 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

export function TrekFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<FiltersState>(() => buildInitialState(searchParams))

  function patch<K extends keyof FiltersState>(key: K, value: FiltersState[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function toggleArray<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]
  }

  const handleApply = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    // Clear existing filter keys
    ;[
      "date_preset", "date", "difficulty", "duration",
      "price_min", "price_max", "region", "adults",
      "children", "child_friendly", "sort",
    ].forEach((k) => params.delete(k))

    if (filters.datePreset && filters.datePreset !== "custom") {
      params.set("date_preset", filters.datePreset)
      const date =
        filters.datePreset === "this_weekend"
          ? getWeekendDates(0)
          : getWeekendDates(1)
      params.set("date", date)
    } else if (filters.datePreset === "custom" && filters.customDate) {
      params.set("date", filters.customDate)
    }

    filters.difficulties.forEach((d) => params.append("difficulty", d))
    filters.durations.forEach((d) => params.append("duration", String(d)))

    if (filters.priceMin) params.set("price_min", filters.priceMin)
    if (filters.priceMax) params.set("price_max", filters.priceMax)

    filters.regions.forEach((r) => params.append("region", r))

    if (filters.adults !== 1) params.set("adults", String(filters.adults))
    if (filters.children > 0) params.set("children", String(filters.children))
    if (filters.childFriendlyOnly) params.set("child_friendly", "true")
    if (filters.sortBy !== "popularity") params.set("sort", filters.sortBy)

    router.push(`/treks?${params.toString()}`)
  }, [filters, router, searchParams])

  function handleClear() {
    setFilters({
      datePreset: "",
      customDate: "",
      difficulties: [],
      durations: [],
      priceMin: "",
      priceMax: "",
      regions: [],
      adults: 1,
      children: 0,
      childFriendlyOnly: false,
      sortBy: "popularity",
    })
    router.push("/treks")
  }

  return (
    <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Filters</h2>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Clear All
        </button>
      </div>

      {/* Sort By */}
      <CollapsibleSection title="Sort By">
        <select
          value={filters.sortBy}
          onChange={(e) => patch("sortBy", e.target.value as SortOption)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </CollapsibleSection>

      {/* Date */}
      <CollapsibleSection title="Date">
        <div className="flex flex-wrap gap-2 mb-3">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => patch("datePreset", filters.datePreset === p.value ? "" : p.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filters.datePreset === p.value
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <AnimatePresence>
          {filters.datePreset === "custom" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <input
                type="date"
                value={filters.customDate}
                onChange={(e) => patch("customDate", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 [color-scheme:light]"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CollapsibleSection>

      {/* Difficulty */}
      <CollapsibleSection title="Difficulty">
        <div className="flex flex-col gap-2">
          {DIFFICULTY_LEVELS.map((d) => (
            <label key={d.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.difficulties.includes(d.value)}
                onChange={() => patch("difficulties", toggleArray(filters.difficulties, d.value))}
                className="w-4 h-4 rounded accent-emerald-600"
              />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.color}`}>
                {d.label}
              </span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Duration */}
      <CollapsibleSection title="Duration">
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => patch("durations", toggleArray(filters.durations, d.value))}
              className={`text-sm py-1.5 px-3 rounded-lg border transition-colors ${
                filters.durations.includes(d.value)
                  ? "bg-emerald-600 border-emerald-600 text-white font-medium"
                  : "border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-700"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* Price Range */}
      <CollapsibleSection title="Price Range">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
            <input
              type="number"
              placeholder="Min"
              value={filters.priceMin}
              onChange={(e) => patch("priceMin", e.target.value)}
              min={0}
              className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <span className="text-gray-400 text-sm">–</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.priceMax}
              onChange={(e) => patch("priceMax", e.target.value)}
              min={0}
              className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Region */}
      <CollapsibleSection title="Region" defaultOpen={false}>
        <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
          {REGIONS.map((r) => (
            <label key={r} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.regions.includes(r)}
                onChange={() => patch("regions", toggleArray(filters.regions, r))}
                className="w-4 h-4 rounded accent-emerald-600"
              />
              <span className="text-sm text-gray-700">{r}</span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Participants */}
      <CollapsibleSection title="Participants" defaultOpen={false}>
        <div className="flex flex-col gap-4">
          <Stepper
            label="Adults"
            sublabel="Age 13+"
            value={filters.adults}
            min={1}
            max={10}
            onChange={(v) => patch("adults", v)}
          />
          <Stepper
            label="Children"
            sublabel="Under 13"
            value={filters.children}
            min={0}
            max={10}
            onChange={(v) => patch("children", v)}
          />
        </div>
      </CollapsibleSection>

      {/* Child Friendly */}
      <CollapsibleSection title="Child Friendly" defaultOpen={false}>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-700">Show child-friendly treks only</span>
          <button
            type="button"
            role="switch"
            aria-checked={filters.childFriendlyOnly}
            onClick={() => patch("childFriendlyOnly", !filters.childFriendlyOnly)}
            className={`relative inline-flex w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
              filters.childFriendlyOnly ? "bg-emerald-500" : "bg-gray-200"
            }`}
          >
            <motion.span
              animate={{ x: filters.childFriendlyOnly ? 18 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="inline-block w-5 h-5 mt-0.5 bg-white rounded-full shadow"
            />
          </button>
        </label>
      </CollapsibleSection>

      {/* Apply button */}
      <button
        type="button"
        onClick={handleApply}
        className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-150"
      >
        Apply Filters
      </button>
    </aside>
  )
}
