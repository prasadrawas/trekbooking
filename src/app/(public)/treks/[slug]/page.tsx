"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Clock,
  RouteIcon,
  TrendingUp,
  Baby,
  MapPin,
  ShieldCheck,
  Star,
  CheckCircle2,
  XCircle,
  Camera,
  ChevronRight,
  ExternalLink,
  Calendar,
  Timer,
  Users,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { TrekCard } from "@/components/trek/trek-card"
import { RatingStars } from "@/components/shared/rating-stars"
import { SeatBadge } from "@/components/shared/seat-badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { mapApiTrek } from "@/lib/trek-mapper"

// ---------------------------------------------------------------------------
// Mock trek data — Rajgad Fort Trek (used as fallback when API is unavailable)
// ---------------------------------------------------------------------------
const MOCK_TREK = {
  title: "Rajgad Fort Trek",
  slug: "rajgad-fort-trek",
  difficulty: "moderate" as const,
  duration: 2,
  distance: 18,
  elevation: 1376,
  region: "Rajmachi",
  is_child_friendly: false,
  rating: 0,
  total_reviews: 0,
  organizer: {
    slug: "sahyadri-hikers",
    name: "Sahyadri Hikers",
    verified: true,
    rating: 0,
    total_treks: 0,
    since: "2019",
  },
  description: `Rajgad, meaning "King's Fort," is one of the grandest hill forts in Maharashtra and served as Chhatrapati Shivaji Maharaj's capital for over 26 years. Perched at 1,376 m, the fort offers an unmatched panoramic view of the surrounding Sahyadri ranges and the Neera river valley.

This 2-day trek covers the three machi (plateaus): Padmavati Machi, Suvela Machi, and Sanjeevani Machi — each with its own character, bastions, and hidden cisterns. The night camp atop the fort under a star-canopy is a memory you'll carry for years.`,
  inclusions: [
    "Transportation from Pune (Swargate) & back",
    "Certified trek leader and safety team",
    "Night camp with tents, sleeping bags & mats",
    "Dinner (night 1) + Breakfast (day 2)",
    "First aid kit and emergency oxygen",
    "Photography guidance on trail",
  ],
  exclusions: [
    "Lunch on day 1 (buy at Gunjavne village)",
    "Personal travel insurance",
    "Anything not mentioned in inclusions",
    "Tips and gratuities (optional)",
  ],
  itinerary: [
    {
      day: 1,
      title: "Pune → Gunjavne → Summit",
      details:
        "Depart Pune at 10 PM. Reach Gunjavne base village by 12:30 AM. Rest till 4 AM. Begin ascent via Pali Darwaza. Reach the fort by 7:30 AM. Explore Padmavati Machi & Balekilla. Night camp on the fort.",
    },
    {
      day: 2,
      title: "Sunrise, Suvela Machi & Descent",
      details:
        "Wake up at 5 AM for a breathtaking sunrise. Explore Suvela Machi's cisterns and watch towers. Descend via Chor Darwaza. Reach Gunjavne by 11 AM. Drive back to Pune, arrive by 2 PM.",
    },
  ],
  thingsToCarry: [
    "Trekking shoes with good grip (mandatory)",
    "2 litres water bottle (fill at base)",
    "Warm jacket / fleece (nights are cold)",
    "Headlamp / torch with extra batteries",
    "Light snacks (energy bars, dry fruits)",
    "Sunscreen SPF 50+ and sunglasses",
    "Personal medicines and ID proof",
    "Rain poncho (June–September)",
    "Camera / extra power bank",
    "Change of clothes + light towel",
  ],
  pickupPoints: [
    {
      id: "swargate",
      name: "Swargate Bus Stand",
      time: "10:00 PM",
      extraCharge: 0,
      mapUrl: "https://maps.google.com",
    },
    {
      id: "katraj",
      name: "Katraj Chowk",
      time: "10:20 PM",
      extraCharge: 0,
      mapUrl: "https://maps.google.com",
    },
    {
      id: "chandni",
      name: "Chandni Chowk",
      time: "10:35 PM",
      extraCharge: 0,
      mapUrl: "https://maps.google.com",
    },
    {
      id: "nhamboshi",
      name: "Nhamboshi (NH-48)",
      time: "11:00 PM",
      extraCharge: 100,
      mapUrl: "https://maps.google.com",
    },
  ],
  upcomingDates: [
    {
      eventId: "evt-rajgad-20260614",
      date: "14 Jun 2026",
      day: "Sat–Sun",
      reportingTime: "10:00 PM, 13 Jun",
      adultPrice: 1499,
      childPrice: 999,
      availableSeats: 8,
      totalSeats: 20,
    },
    {
      eventId: "evt-rajgad-20260628",
      date: "28 Jun 2026",
      day: "Sat–Sun",
      reportingTime: "10:00 PM, 27 Jun",
      adultPrice: 1499,
      childPrice: 999,
      availableSeats: 16,
      totalSeats: 20,
    },
    {
      eventId: "evt-rajgad-20260712",
      date: "12 Jul 2026",
      day: "Sat–Sun",
      reportingTime: "10:00 PM, 11 Jul",
      adultPrice: 1699,
      childPrice: 1199,
      availableSeats: 20,
      totalSeats: 20,
    },
  ],
  reviews: [] as Array<{ id: number | string; name: string; avatar: string; rating: number; date: string; comment: string }>,
  ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
  images: [] as Array<{ id: string; url: string; isCover: boolean }>,
}

// ---------------------------------------------------------------------------
// Difficulty colour map
// ---------------------------------------------------------------------------
const DIFFICULTY_MAP = {
  easy: { label: "Easy", color: "bg-green-100 text-green-800" },
  moderate: { label: "Moderate", color: "bg-yellow-100 text-yellow-800" },
  difficult: { label: "Difficult", color: "bg-orange-100 text-orange-800" },
  very_difficult: { label: "Very Difficult", color: "bg-red-100 text-red-800" },
}

// ---------------------------------------------------------------------------
// Similar treks
// ---------------------------------------------------------------------------
const SIMILAR_TREKS = [
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
]

// ---------------------------------------------------------------------------
// Gradient placeholder colors for "images"
// ---------------------------------------------------------------------------
const GALLERY_GRADIENTS = [
  "from-emerald-700 via-teal-600 to-green-800",
  "from-stone-600 via-amber-700 to-orange-800",
  "from-slate-600 via-blue-700 to-teal-700",
]

// ---------------------------------------------------------------------------
// Section entrance animation
// ---------------------------------------------------------------------------
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

// ---------------------------------------------------------------------------
// Trek JSON-LD structured data component
// ---------------------------------------------------------------------------
function TrekStructuredData({ trek, slug }: { trek: typeof MOCK_TREK; slug: string }) {
  const nextEvent = trek.upcomingDates[0]

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: trek.title,
    description: trek.description.slice(0, 300).replace(/\n/g, " ").trim(),
    url: `https://trekbooking.in/treks/${slug}`,
    image: "https://trekbooking.in/og-image.jpg",
    location: {
      "@type": "Place",
      name: trek.region,
      address: {
        "@type": "PostalAddress",
        addressRegion: "Maharashtra",
        addressCountry: "IN",
      },
    },
    organizer: {
      "@type": "Organization",
      name: trek.organizer.name,
      url: `https://trekbooking.in/organizers/${trek.organizer.slug}`,
    },
    ...(nextEvent
      ? {
          startDate: nextEvent.date,
          offers: {
            "@type": "Offer",
            price: nextEvent.adultPrice,
            priceCurrency: "INR",
            availability:
              nextEvent.availableSeats > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
            url: `https://trekbooking.in/treks/${slug}/book/${nextEvent.eventId}`,
            validFrom: new Date().toISOString(),
          },
        }
      : {}),
    aggregateRating:
      trek.total_reviews > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: trek.rating,
            reviewCount: trek.total_reviews,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function TrekDetailPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [loading, setLoading] = useState(true)
  const [trek, setTrek] = useState<typeof MOCK_TREK>(MOCK_TREK)
  const [isMock, setIsMock] = useState(false)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [showAllDates, setShowAllDates] = useState(false)
  const [similarTreks, setSimilarTreks] = useState(SIMILAR_TREKS)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    Promise.all([
      fetch(`/api/treks/${slug}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/treks/${slug}/reviews`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/treks?limit=3`).then((r) => r.ok ? r.json() : null),
    ]).then(([data, reviewData, similarData]) => {
      if (!data?.trek) throw new Error("Trek not found")
      const t = data.trek
      const pickupSource =
        t.default_pickup_points?.length
          ? t.default_pickup_points
          : t.trek_events?.[0]?.pickup_points ?? []

      const mapped: typeof MOCK_TREK = {
        title: t.title,
        slug: t.slug,
        difficulty: t.difficulty,
        duration: t.duration_days,
        distance: t.distance_km,
        elevation: t.elevation_m,
        region: t.region ?? MOCK_TREK.region,
        is_child_friendly: t.is_child_friendly ?? false,
        rating: t.organizers?.avg_rating ?? 0,
        total_reviews: 0,
        organizer: {
          slug: t.organizers?.slug ?? MOCK_TREK.organizer.slug,
          name: t.organizers?.org_name ?? MOCK_TREK.organizer.name,
          verified: t.organizers?.is_verified ?? false,
          rating: t.organizers?.avg_rating ?? 0,
          total_treks: 0,
          since: t.organizers?.created_at
            ? new Date(t.organizers.created_at).getFullYear().toString()
            : MOCK_TREK.organizer.since,
        },
        description: t.description ?? MOCK_TREK.description,
        inclusions: t.inclusions?.length ? t.inclusions : MOCK_TREK.inclusions,
        exclusions: t.exclusions?.length ? t.exclusions : MOCK_TREK.exclusions,
        itinerary: Array.isArray(t.itinerary) ? t.itinerary : [],
        thingsToCarry: t.things_to_carry?.length
          ? t.things_to_carry
          : MOCK_TREK.thingsToCarry,
        pickupPoints: pickupSource.map(
          (p: { label: string; pickup_time: string; extra_charge?: number; maps_url?: string }, i: number) => ({
            id: String(i),
            name: p.label,
            time: p.pickup_time,
            extraCharge: p.extra_charge ?? 0,
            mapUrl: p.maps_url ?? "#",
          })
        ),
        upcomingDates: (t.trek_events ?? [])
          .filter((e: { status: string }) => e.status === "upcoming" || e.status === "full")
          .map((e: {
            id: string
            event_date: string
            reporting_time: string
            price: number
            child_price: number
            total_seats: number
            booked_seats: number
          }) => {
            const d = new Date(e.event_date)
            return {
              eventId: e.id,
              date: d.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              day: d.toLocaleDateString("en-IN", { weekday: "short" }),
              reportingTime: e.reporting_time,
              adultPrice: e.price ?? 0,
              childPrice: e.child_price ?? null,
              availableSeats: e.total_seats - e.booked_seats,
              totalSeats: e.total_seats,
            }
          }),
        reviews: [],
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        images: (t.trek_images ?? []).map((img: { id: string; image_url: string; is_cover: boolean }) => ({
          id: img.id,
          url: img.image_url,
          isCover: img.is_cover,
        })),
      }

      // Fall back to mock upcoming dates if API returned none
      if (mapped.upcomingDates.length === 0) {
        mapped.upcomingDates = MOCK_TREK.upcomingDates
      }

      // Process reviews
      if (reviewData?.reviews?.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mapped.reviews = reviewData.reviews.map((rv: any) => ({
          id: String(rv.id ?? ""),
          name: rv.reviewer_name ?? rv.profiles?.full_name ?? "Trekker",
          rating: Number(rv.rating ?? 5),
          date: rv.created_at
            ? new Date(rv.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
            : "—",
          text: rv.comment ?? rv.body ?? "",
          avatar: rv.avatar_url ?? null,
        }))
      }

      setTrek(mapped)
      setIsMock(false)

      // Process similar treks
      if (similarData?.treks) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const others = similarData.treks
          .filter((st: any) => st.slug !== slug)
          .slice(0, 3)
          .map(mapApiTrek)
        if (others.length > 0) setSimilarTreks(others)
      }
    }).catch(() => {
      // Keep MOCK_TREK as fallback
      setTrek(MOCK_TREK)
      setIsMock(true)
    }).finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  const difficulty = DIFFICULTY_MAP[trek.difficulty]

  const totalRatings = Object.values(trek.ratingBreakdown).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <TrekStructuredData trek={trek} slug={slug} />
      {/* ------------------------------------------------------------------ */}
      {/* Image Gallery                                                         */}
      {/* ------------------------------------------------------------------ */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative h-72 md:h-[420px] bg-gray-200 overflow-hidden"
      >
        <div className="grid grid-cols-3 h-full gap-1">
          {/* Large left image */}
          <div
            className={`col-span-2 ${trek.images.length > 0 ? "relative" : `bg-gradient-to-br ${GALLERY_GRADIENTS[0]}`} flex items-center justify-center`}
          >
            {trek.images.length > 0 ? (
              <Image
                src={trek.images.find((i) => i.isCover)?.url ?? trek.images[0]?.url ?? ""}
                alt={trek.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 66vw"
              />
            ) : (
              <span className="text-white/30 text-7xl font-black select-none">⛰️</span>
            )}
            <div className="absolute inset-0 bg-black/10" />
          </div>

          {/* Two small right images */}
          <div className="flex flex-col gap-1">
            <div
              className={`flex-1 ${trek.images.length > 1 ? "relative" : `bg-gradient-to-br ${GALLERY_GRADIENTS[1]}`} flex items-center justify-center`}
            >
              {trek.images.length > 1 ? (
                <Image src={trek.images[1].url} alt="" fill className="object-cover" sizes="33vw" />
              ) : (
                <Camera className="w-8 h-8 text-white/30" />
              )}
            </div>
            <div
              className={`flex-1 ${trek.images.length > 2 ? "relative" : `bg-gradient-to-br ${GALLERY_GRADIENTS[2]}`} flex items-center justify-center relative`}
            >
              {trek.images.length > 2 ? (
                <Image src={trek.images[2].url} alt="" fill className="object-cover" sizes="33vw" />
              ) : (
                <Camera className="w-8 h-8 text-white/30" />
              )}
              {/* View all button overlay */}
              <button
                type="button"
                onClick={() => setShowAllPhotos(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors"
              >
                <span className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Camera className="w-4 h-4" />
                  View All Photos
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ------------------------------------------------------------------ */}
      {/* Main content area                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">
          {/* ---- LEFT: Main content ---- */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* ---- Trek Header ---- */}
            <motion.div variants={fadeUp} initial="hidden" animate="show">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                <Link href="/treks" prefetch={false} className="hover:text-emerald-600 transition-colors">
                  Treks
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-400">{trek.region}</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-700 font-medium truncate">{trek.title}</span>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${difficulty.color}`}
                >
                  {difficulty.label}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {trek.region}
                </span>
                {trek.is_child_friendly && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <Baby className="w-3 h-3" />
                    Child Friendly
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                {trek.title}
              </h1>
              {isMock && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full inline-block px-2.5 py-0.5 mb-1">
                  (Sample data)
                </p>
              )}

              {/* Organizer + rating row */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-gray-500">
                  by{" "}
                  <Link
                    href={`/organizers/${trek.organizer.slug}`}
                    prefetch={false}
                    className="text-emerald-700 font-semibold hover:underline"
                  >
                    {trek.organizer.name}
                  </Link>
                </span>
                {trek.organizer.verified && (
                  <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
                <RatingStars rating={trek.rating} count={trek.total_reviews} size="md" />
              </div>
            </motion.div>

            {/* ---- Stats Bar ---- */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.08 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100 gap-y-4 md:gap-y-0">
                {[
                  {
                    icon: Clock,
                    label: "Duration",
                    value: `${trek.duration} ${trek.duration === 1 ? "Day" : "Days"}`,
                  },
                  { icon: RouteIcon, label: "Distance", value: `${trek.distance} km` },
                  { icon: TrendingUp, label: "Max Elevation", value: `${trek.elevation} m` },
                  { icon: Users, label: "Difficulty", value: difficulty.label },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center justify-center text-center px-4 py-1"
                  >
                    <Icon className="w-5 h-5 text-emerald-500 mb-1.5" />
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-base font-bold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ---- Upcoming Dates ---- */}
            <motion.section
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.12 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Upcoming Dates</h2>
                {trek.upcomingDates.length > 3 && (
                  <span className="text-sm text-gray-500">{trek.upcomingDates.length} dates available</span>
                )}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">
                          Date
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">
                          Reporting Time
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                          Price
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">
                          Seats
                        </th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(showAllDates ? trek.upcomingDates : trek.upcomingDates.slice(0, 3)).map((event, idx) => (
                        <motion.tr
                          key={event.eventId}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + idx * 0.06 }}
                          className="hover:bg-emerald-50/50 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                              <div>
                                <p className="font-semibold text-gray-900">{event.date}</p>
                                <p className="text-xs text-gray-400">{event.day}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 hidden sm:table-cell">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Timer className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              {event.reportingTime}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-bold text-gray-900">
                              ₹{(event.adultPrice ?? 0).toLocaleString("en-IN")}
                            </p>
                            {trek.is_child_friendly && event.childPrice != null && event.childPrice > 0 && (
                              <p className="text-xs text-gray-500">
                                Child ₹{event.childPrice.toLocaleString("en-IN")}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-4 hidden md:table-cell">
                            <SeatBadge
                              available={event.availableSeats}
                              total={event.totalSeats}
                            />
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Link
                              href={`/treks/${slug}/book/${event.eventId}`}
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                                event.availableSeats === 0
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                              }`}
                            >
                              {event.availableSeats === 0 ? "Sold Out" : "Book Now"}
                              {event.availableSeats > 0 && <ArrowRight className="w-3.5 h-3.5" />}
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {trek.upcomingDates.length > 3 && !showAllDates && (
                  <button
                    type="button"
                    onClick={() => setShowAllDates(true)}
                    className="w-full py-3 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-t border-gray-100 transition-colors flex items-center justify-center gap-1"
                  >
                    Show all {trek.upcomingDates.length} dates
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </button>
                )}
                {showAllDates && trek.upcomingDates.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllDates(false)}
                    className="w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-t border-gray-100 transition-colors flex items-center justify-center gap-1"
                  >
                    Show fewer dates
                    <ChevronRight className="w-3.5 h-3.5 -rotate-90" />
                  </button>
                )}
              </div>
            </motion.section>

            {/* ---- Tabs: Overview, Things to Carry, Pickup, Reviews ---- */}
            <motion.section
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.18 }}
            >
              <Tabs defaultValue="overview">
                <TabsList className="w-full bg-white border border-gray-100 shadow-sm rounded-xl p-1 h-auto flex gap-1">
                  {[
                    { value: "overview", label: "Overview" },
                    { value: "carry", label: "Things to Carry" },
                    { value: "pickup", label: "Pickup Points" },
                    { value: "reviews", label: `Reviews (${trek.total_reviews})` },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex-1 py-2.5 text-xs sm:text-sm font-medium rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-600"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* ---- OVERVIEW ---- */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                  {/* Description */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-3">About This Trek</h3>
                    <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-3">
                      {trek.description.split("\n\n").map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>

                  {/* Inclusions & Exclusions */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        Inclusions
                      </h3>
                      <ul className="space-y-2.5">
                        {trek.inclusions.map((item) => (
                          <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-400" />
                        Exclusions
                      </h3>
                      <ul className="space-y-2.5">
                        {trek.exclusions.map((item) => (
                          <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Itinerary */}
                  {trek.itinerary.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <h3 className="font-bold text-gray-900 text-lg mb-5">Itinerary</h3>
                      <div className="space-y-0">
                        {trek.itinerary.map((day, idx) => (
                          <div key={day.day} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                {day.day}
                              </div>
                              {idx < trek.itinerary.length - 1 && (
                                <div className="w-0.5 flex-1 bg-emerald-100 my-2" />
                              )}
                            </div>
                            <div className={idx < trek.itinerary.length - 1 ? "pb-6" : ""}>
                              <h4 className="font-semibold text-gray-900 mb-1.5">{day.title}</h4>
                              <p className="text-sm text-gray-600 leading-relaxed">{day.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-gray-400 text-sm">
                      Detailed itinerary will be shared before the trek.
                    </div>
                  )}
                </TabsContent>

                {/* ---- THINGS TO CARRY ---- */}
                <TabsContent value="carry" className="mt-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-5">Things to Carry</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {trek.thingsToCarry.map((item, i) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-700">{item}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* ---- PICKUP POINTS ---- */}
                <TabsContent value="pickup" className="mt-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Pickup Points</h3>
                    <p className="text-sm text-gray-500 mb-5">
                      We pick up from the following locations. Board at your nearest stop.
                    </p>
                    <div className="space-y-3">
                      {trek.pickupPoints.map((point, i) => (
                        <motion.div
                          key={point.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{point.name}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Timer className="w-3 h-3" />
                                {point.time}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {point.extraCharge > 0 ? (
                              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                                +₹{point.extraCharge}
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                                Free
                              </span>
                            )}
                            <a
                              href={point.mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-400 hover:text-emerald-600 transition-colors flex items-center gap-1"
                            >
                              Map
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* ---- REVIEWS ---- */}
                <TabsContent value="reviews" className="mt-6 space-y-5">
                  {/* Rating breakdown */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                      {/* Big number */}
                      <div className="text-center shrink-0">
                        <p className="text-6xl font-black text-gray-900">{trek.rating}</p>
                        <RatingStars rating={trek.rating} size="lg" />
                        <p className="text-xs text-gray-500 mt-1">
                          {trek.total_reviews.toLocaleString("en-IN")} reviews
                        </p>
                      </div>

                      {/* Bar chart */}
                      <div className="flex-1 w-full space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count =
                            trek.ratingBreakdown[star as keyof typeof trek.ratingBreakdown]
                          const pct = Math.round((count / totalRatings) * 100)
                          return (
                            <div key={star} className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="w-4 text-right shrink-0">{star}</span>
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-amber-400 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ delay: 0.3 + (5 - star) * 0.05, duration: 0.6 }}
                                />
                              </div>
                              <span className="w-8 text-right text-gray-500">{pct}%</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Review cards */}
                  <div className="space-y-4">
                    {trek.reviews.map((review, i) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {review.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
                            <p className="text-xs text-gray-400">{review.date}</p>
                          </div>
                          <RatingStars rating={review.rating} size="sm" />
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.section>
          </div>

          {/* ---- RIGHT: Sidebar ---- */}
          <aside className="lg:w-80 shrink-0">
            <div className="sticky top-24 space-y-5">
              {/* Organizer Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Organized By
                </h3>

                {/* Logo + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-black shrink-0">
                    S
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-gray-900">{trek.organizer.name}</p>
                      {trek.organizer.verified && (
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Since {trek.organizer.since}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-3 rounded-xl bg-gray-50">
                    <p className="text-xl font-black text-gray-900">{trek.organizer.rating}</p>
                    <p className="text-xs text-gray-500">Avg Rating</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gray-50">
                    <p className="text-xl font-black text-gray-900">{trek.organizer.total_treks}</p>
                    <p className="text-xs text-gray-500">Treks</p>
                  </div>
                </div>

                <Link
                  href={`/organizers/${trek.organizer.slug}`}
                  prefetch={false}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-emerald-300 text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition-colors"
                >
                  View Profile
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </motion.div>

              {/* Quick book CTA — first upcoming date */}
              {trek.upcomingDates.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.28, duration: 0.5 }}
                  className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white"
                >
                  <p className="text-sm font-medium text-emerald-100 mb-1">Next available</p>
                  <p className="text-xl font-bold mb-0.5">{trek.upcomingDates[0].date}</p>
                  <p className="text-emerald-200 text-xs mb-4">{trek.upcomingDates[0].day}</p>

                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-2xl font-black">
                        ₹{(trek.upcomingDates[0].adultPrice ?? 0).toLocaleString("en-IN")}
                      </p>
                      <p className="text-emerald-200 text-xs">per person</p>
                    </div>
                    <SeatBadge
                      available={trek.upcomingDates[0].availableSeats}
                      total={trek.upcomingDates[0].totalSeats}
                    />
                  </div>

                  <Link
                    href={`/treks/${slug}/book/${trek.upcomingDates[0].eventId}`}
                    className="flex items-center justify-center gap-2 w-full bg-white text-emerald-700 font-bold py-3 rounded-xl hover:bg-emerald-50 active:scale-95 transition-all text-sm"
                  >
                    Book Now
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.28, duration: 0.5 }}
                  className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white text-center"
                >
                  <p className="text-lg font-bold mb-1">No dates scheduled</p>
                  <p className="text-emerald-200 text-sm">Check back soon for upcoming dates.</p>
                </motion.div>
              )}

              {/* Need help? */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center"
              >
                <p className="text-sm font-semibold text-gray-800 mb-1">Have questions?</p>
                <p className="text-xs text-gray-500 mb-3">
                  Our team is here to help you plan.
                </p>
                <Link
                  href="/contact"
                  prefetch={false}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
                >
                  Contact Support
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            </div>
          </aside>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Similar Treks                                                     */}
        {/* ---------------------------------------------------------------- */}
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
          className="mt-14"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Similar Treks</h2>
            <Link
              href="/treks"
              prefetch={false}
              className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {similarTreks.map((t, i) => (
              <motion.div
                key={t.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.07 }}
              >
                <TrekCard trek={t} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Photo gallery modal (placeholder)                                   */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {showAllPhotos && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">
                {trek.title} — {trek.images.length > 0 ? `${trek.images.length} Photos` : "No Photos"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAllPhotos(false)}
                className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            {/* Gallery grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {trek.images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                  {trek.images.map((img, i) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden group"
                    >
                      <Image
                        src={img.url}
                        alt={`${trek.title} photo ${i + 1}`}
                        fill
                        className="object-cover"
                        loading="lazy"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                      {img.isCover && (
                        <span className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          Cover
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/40">
                  <Camera className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">No photos uploaded yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
