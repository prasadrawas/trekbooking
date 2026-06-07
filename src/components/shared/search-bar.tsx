"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Calendar,
  MapPin,
  ChevronDown,
  SlidersHorizontal,
  Plus,
  Minus,
  Users,
} from "lucide-react"
import { DIFFICULTY_LEVELS, REGIONS } from "@/lib/constants"

interface ParticipantCount {
  adults: number
  children: number
}

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [date, setDate] = useState("")
  const [region, setRegion] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [participants, setParticipants] = useState<ParticipantCount>({
    adults: 1,
    children: 0,
  })
  const [showFilters, setShowFilters] = useState(false)
  const [participantOpen, setParticipantOpen] = useState(false)
  const participantRef = useRef<HTMLDivElement>(null)

  const totalParticipants = participants.adults + participants.children

  // Close participant dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        participantRef.current &&
        !participantRef.current.contains(e.target as Node)
      ) {
        setParticipantOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function stepParticipant(type: keyof ParticipantCount, delta: number) {
    setParticipants((prev) => {
      const min = type === "adults" ? 1 : 0
      const max = 10
      return {
        ...prev,
        [type]: Math.min(max, Math.max(min, prev[type] + delta)),
      }
    })
  }

  function handleSearch() {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (date) params.set("date", date)
    if (region) params.set("region", region)
    if (difficulty) params.set("difficulty", difficulty)
    if (participants.adults !== 1)
      params.set("adults", String(participants.adults))
    if (participants.children > 0)
      params.set("children", String(participants.children))
    router.push(`/treks?${params.toString()}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch()
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
        {/* ── Desktop row ── */}
        <div className="hidden md:flex items-center">
          {/* Text search */}
          <div className="flex items-center gap-3 px-5 py-4 flex-1 min-w-0">
            <Search className="w-5 h-5 text-emerald-500 shrink-0" />
            <input
              type="text"
              placeholder="Search treks, peaks, regions…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-gray-800 placeholder-gray-400 text-sm focus:outline-none"
            />
          </div>

          <div className="w-px h-8 bg-gray-200" />

          {/* Date picker */}
          <div className="flex items-center gap-2 px-4 py-4">
            <Calendar className="w-5 h-5 text-emerald-500 shrink-0" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-sm text-gray-700 focus:outline-none [color-scheme:light] w-36"
            />
          </div>

          <div className="w-px h-8 bg-gray-200" />

          {/* Region dropdown */}
          <div className="flex items-center gap-2 px-4 py-4 relative">
            <MapPin className="w-5 h-5 text-emerald-500 shrink-0" />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-transparent text-sm text-gray-700 focus:outline-none appearance-none cursor-pointer pr-6"
            >
              <option value="">All Regions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 pointer-events-none absolute right-4" />
          </div>

          <div className="w-px h-8 bg-gray-200" />

          {/* Difficulty dropdown */}
          <div className="flex items-center gap-2 px-4 py-4 relative">
            <SlidersHorizontal className="w-5 h-5 text-emerald-500 shrink-0" />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="bg-transparent text-sm text-gray-700 focus:outline-none appearance-none cursor-pointer pr-6"
            >
              <option value="">Any Level</option>
              {DIFFICULTY_LEVELS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 pointer-events-none absolute right-4" />
          </div>

          <div className="w-px h-8 bg-gray-200" />

          {/* Participants dropdown */}
          <div className="relative" ref={participantRef}>
            <button
              type="button"
              onClick={() => setParticipantOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-4 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Users className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="font-semibold text-gray-800">
                {totalParticipants}
              </span>
              <span className="text-gray-500 whitespace-nowrap">
                {totalParticipants === 1 ? "Traveller" : "Travellers"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  participantOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {participantOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-5 z-50"
                >
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Travellers
                  </p>
                  <ParticipantRow
                    label="Adults"
                    sublabel="Age 13+"
                    value={participants.adults}
                    onDecrement={() => stepParticipant("adults", -1)}
                    onIncrement={() => stepParticipant("adults", 1)}
                    min={1}
                  />
                  <div className="border-t border-gray-100 my-3" />
                  <ParticipantRow
                    label="Children"
                    sublabel="Under 13"
                    value={participants.children}
                    onDecrement={() => stepParticipant("children", -1)}
                    onIncrement={() => stepParticipant("children", 1)}
                    min={0}
                  />
                  <button
                    type="button"
                    onClick={() => setParticipantOpen(false)}
                    className="w-full mt-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Done
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search CTA */}
          <div className="p-2 pl-1 shrink-0">
            <button
              type="button"
              onClick={handleSearch}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all duration-150"
            >
              <Search className="w-4 h-4" />
              <span className="whitespace-nowrap">Search Treks</span>
            </button>
          </div>
        </div>

        {/* ── Mobile layout ── */}
        <div className="md:hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Search className="w-5 h-5 text-emerald-500 shrink-0" />
            <input
              type="text"
              placeholder="Search treks…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-gray-800 placeholder-gray-400 text-sm focus:outline-none"
            />
          </div>

          {/* Date + Search row */}
          <div className="flex items-center gap-2 px-4 pb-3">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1">
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-sm text-gray-700 focus:outline-none [color-scheme:light]"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Search
            </button>
          </div>

          {/* More filters toggle */}
          <div className="border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowFilters((f) => !f)}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm text-emerald-600 font-medium"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "More Filters"}
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t border-gray-100"
                >
                  <div className="p-4 flex flex-col gap-4">
                    {/* Region */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Region
                      </label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">All Regions</option>
                        {REGIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Difficulty
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Any Level</option>
                        {DIFFICULTY_LEVELS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Participants */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">
                        Travellers
                      </label>
                      <div className="flex flex-col gap-3 bg-gray-50 rounded-lg p-3">
                        <ParticipantRow
                          label="Adults"
                          sublabel="Age 13+"
                          value={participants.adults}
                          onDecrement={() => stepParticipant("adults", -1)}
                          onIncrement={() => stepParticipant("adults", 1)}
                          min={1}
                        />
                        <div className="border-t border-gray-200" />
                        <ParticipantRow
                          label="Children"
                          sublabel="Under 13"
                          value={participants.children}
                          onDecrement={() => stepParticipant("children", -1)}
                          onIncrement={() => stepParticipant("children", 1)}
                          min={0}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Participant stepper row ── */

interface ParticipantRowProps {
  label: string
  sublabel: string
  value: number
  min: number
  onDecrement: () => void
  onIncrement: () => void
}

function ParticipantRow({
  label,
  sublabel,
  value,
  min,
  onDecrement,
  onIncrement,
}: ParticipantRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{sublabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:border-emerald-500 hover:text-emerald-600 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-sm font-semibold text-gray-800 w-5 text-center">
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={value >= 10}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:border-emerald-500 hover:text-emerald-600 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
