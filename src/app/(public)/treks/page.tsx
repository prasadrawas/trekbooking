"use client"

import { useState, useMemo, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { SlidersHorizontal, Mountain, X } from "lucide-react"
import { TrekCard } from "@/components/trek/trek-card"
import { TrekFilters } from "@/components/trek/trek-filters"
import { SearchBar } from "@/components/shared/search-bar"
import { Pagination } from "@/components/shared/pagination"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

// ---------------------------------------------------------------------------
// Mock data — 6 realistic Sahyadri treks
// ---------------------------------------------------------------------------
const MOCK_TREKS = [
  {
    title: "Rajgad Fort Trek",
    slug: "rajgad-fort-trek",
    cover_image: null,
    difficulty: "moderate" as const,
    duration: 2,
    distance: 18,
    price: 1499,
    rating: 0,
    total_reviews: 0,
    available_seats: 8,
    total_seats: 20,
    next_date: "2026-06-14",
    is_child_friendly: false,
    organizer_name: "Sahyadri Hikers",
    region: "Rajmachi",
  },
  {
    title: "Torna Fort Overnight Trek",
    slug: "torna-fort-overnight-trek",
    cover_image: null,
    difficulty: "moderate" as const,
    duration: 2,
    distance: 14,
    price: 1299,
    rating: 0,
    total_reviews: 0,
    available_seats: 14,
    total_seats: 25,
    next_date: "2026-06-21",
    is_child_friendly: false,
    organizer_name: "PuneWild Expeditions",
    region: "Satara",
  },
  {
    title: "Sinhagad Sunrise Trek",
    slug: "sinhagad-sunrise-trek",
    cover_image: null,
    difficulty: "easy" as const,
    duration: 1,
    distance: 7,
    price: 599,
    rating: 0,
    total_reviews: 0,
    available_seats: 22,
    total_seats: 30,
    next_date: "2026-06-07",
    is_child_friendly: true,
    organizer_name: "GreenTrails Pune",
    region: "Lonavala",
  },
  {
    title: "Lohagad – Visapur Twin Fort Trek",
    slug: "lohagad-visapur-twin-fort-trek",
    cover_image: null,
    difficulty: "easy" as const,
    duration: 1,
    distance: 12,
    price: 799,
    rating: 0,
    total_reviews: 0,
    available_seats: 3,
    total_seats: 20,
    next_date: "2026-06-08",
    is_child_friendly: true,
    organizer_name: "Trek with Kiran",
    region: "Lonavala",
  },
  {
    title: "Harishchandragad via Nalichi Vaat",
    slug: "harishchandragad-nalichi-vaat-trek",
    cover_image: null,
    difficulty: "difficult" as const,
    duration: 2,
    distance: 24,
    price: 1999,
    rating: 0,
    total_reviews: 0,
    available_seats: 6,
    total_seats: 12,
    next_date: "2026-06-28",
    is_child_friendly: false,
    organizer_name: "Sahyadri Hikers",
    region: "Harishchandragad",
  },
  {
    title: "Kalsubai Peak Summit Trek",
    slug: "kalsubai-peak-summit-trek",
    cover_image: null,
    difficulty: "moderate" as const,
    duration: 1,
    distance: 10,
    price: 899,
    rating: 0,
    total_reviews: 0,
    available_seats: 18,
    total_seats: 25,
    next_date: "2026-06-15",
    is_child_friendly: false,
    organizer_name: "Summit Seekers",
    region: "Kalsubai",
  },
]

const ITEMS_PER_PAGE = 6

// ---------------------------------------------------------------------------
// Skeleton card for loading state
// ---------------------------------------------------------------------------
function TrekCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-100">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Container animation variants
// ---------------------------------------------------------------------------
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
function TreksPageContent() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [treks, setTreks] = useState(MOCK_TREKS)
  const [isMock, setIsMock] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  // Build API URL from search params — forward all filter params
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()

    // Text search
    const q = searchParams.get("q")
    if (q) params.set("q", q)

    // Multi-value filters
    searchParams.getAll("region").forEach((r) => params.append("region", r))
    searchParams.getAll("difficulty").forEach((d) => params.append("difficulty", d))
    searchParams.getAll("duration").forEach((d) => params.append("duration", d))

    // Single-value filters
    const childFriendly = searchParams.get("child_friendly") || searchParams.get("childFriendly")
    if (childFriendly) params.set("child_friendly", childFriendly)

    const priceMin = searchParams.get("price_min")
    const priceMax = searchParams.get("price_max")
    if (priceMin) params.set("price_min", priceMin)
    if (priceMax) params.set("price_max", priceMax)

    const sort = searchParams.get("sort")
    if (sort) params.set("sort", sort)

    const page = searchParams.get("page")
    if (page) params.set("page", page)

    params.set("limit", "12")

    return `/api/treks?${params.toString()}`
  }, [searchParams])

  // Map API response to card format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapTrek = useCallback((t: any) => {
    let org = t.organizer ?? t.organizers ?? null
    if (Array.isArray(org)) org = org[0]
    let coverImg = null
    if (t.cover_image) {
      coverImg = typeof t.cover_image === "string" ? t.cover_image : t.cover_image.image_url ?? null
    }
    return {
      title: String(t.title ?? ""),
      slug: String(t.slug ?? ""),
      cover_image: coverImg,
      difficulty: String(t.difficulty ?? "moderate"),
      duration: Number(t.duration_days ?? 1),
      distance: Number(t.distance_km ?? 0),
      price: Number(t.next_event?.price ?? t.default_adult_price ?? 0),
      rating: Number(org?.avg_rating ?? 0),
      total_reviews: Number(t.total_reviews ?? 0),
      available_seats: t.next_event ? Number(t.next_event.seats_available ?? 0) : 99,
      total_seats: t.next_event ? Number(t.next_event.seats_available ?? 0) : 99,
      next_date: t.next_event?.event_date ?? null,
      is_child_friendly: Boolean(t.is_child_friendly),
      organizer_name: String(org?.org_name ?? ""),
      region: String(t.region ?? ""),
    }
  }, [])

  // Fetch treks when URL params change
  useEffect(() => {
    setIsLoading(true)
    fetch(apiUrl)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.treks?.length > 0) {
          setTreks(data.treks.map(mapTrek))
          setTotalCount(data.total ?? data.treks.length)
          setIsMock(false)
        } else if (data?.treks?.length === 0 && !isMock) {
          // Real search returned 0 results — show empty, not mock
          setTreks([])
          setTotalCount(0)
          setIsMock(false)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [apiUrl, mapTrek]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = treks
  const totalPages = Math.ceil((isMock ? filtered.length : totalCount) / ITEMS_PER_PAGE)
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  function handlePageChange(page: number) {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ------------------------------------------------------------------ */}
      {/* Hero search band                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 pt-12 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-600/40 border border-emerald-400/30 rounded-full px-4 py-1.5 mb-4">
            <Mountain className="w-4 h-4 text-emerald-200" />
            <span className="text-emerald-100 text-sm font-medium">
              {filtered.length} treks listed
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            Explore Treks
          </h1>
          <p className="text-emerald-200 text-lg max-w-xl mx-auto">
            Discover Sahyadri treks. Filter by difficulty, region, and book in seconds.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <SearchBar />
        </motion.div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main content                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-7xl mx-auto px-4 py-10 -mt-6">
        <div className="flex gap-8">
          {/* ---- Sidebar filters (desktop) ---- */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <TrekFilters />
            </div>
          </aside>

          {/* ---- Trek grid ---- */}
          <div className="flex-1 min-w-0">
            {/* Toolbar row */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{filtered.length}</span> treks found
                {isMock && <span className="ml-2 text-xs text-amber-500">(Sample data)</span>}
              </p>

              {/* Mobile filter toggle */}
              <button
                type="button"
                onClick={() => setShowFilterDrawer(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm hover:border-emerald-400 hover:text-emerald-700 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* Loading skeleton */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <TrekCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && paginated.length === 0 && (
              <EmptyState
                icon={Mountain}
                title="No treks match your filters"
                description="Try adjusting your date, difficulty, or region filters to see more results."
                action={{
                  label: "Clear All Filters",
                  onClick: () => {},
                }}
              />
            )}

            {/* Trek grid with stagger animation */}
            {!isLoading && paginated.length > 0 && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                >
                  {paginated.map((trek) => (
                    <motion.div key={trek.slug} variants={itemVariants}>
                      <TrekCard trek={trek} />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="mt-10">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile filter drawer                                                 */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {showFilterDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setShowFilterDrawer(false)}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 35 }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-50 overflow-y-auto shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                  Filters
                </h2>
                <button
                  type="button"
                  onClick={() => setShowFilterDrawer(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <TrekFilters />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TreksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    }>
      <TreksPageContent />
    </Suspense>
  )
}
