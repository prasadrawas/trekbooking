"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mountain,
  ShieldCheck,
  Star,
  Users,
  CalendarDays,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { TrekCard } from "@/components/trek/trek-card";
import { RatingStars } from "@/components/shared/rating-stars";

// ---------------------------------------------------------------------------
// Mock data — "Sahyadri Explorers" organizer
// ---------------------------------------------------------------------------
const MOCK_ORGANIZER = {
  slug: "sahyadri-explorers",
  name: "Sahyadri Explorers",
  tagline: "Trek organizer in the Sahyadri mountains.",
  description:
    "Trek organizer in the Sahyadri mountains.",
  logo: null, // Replace with actual image URL in production
  is_verified: true,
  avg_rating: 0,
  total_reviews: 0,
  total_treks: 0,
  active_since: "2018",
  location: "Pune, Maharashtra",
  phone: "",
  email: "",
  website: "",
};

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
    organizer_name: "Sahyadri Explorers",
    region: "Rajmachi",
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
    organizer_name: "Sahyadri Explorers",
    region: "Harishchandragad",
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
    organizer_name: "Sahyadri Explorers",
    region: "Pune",
  },
];

const MOCK_REVIEWS: {
  id: string;
  reviewer_name: string;
  avatar_initials: string;
  rating: number;
  date: string;
  trek: string;
  body: string;
}[] = [];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function OrganizerAvatar({
  name,
  logo,
}: {
  name: string;
  logo: string | null;
}) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={`${name} logo`}
        className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-white shadow-lg"
      />
    );
  }
  // Initials fallback
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-emerald-600 border-4 border-white shadow-lg flex items-center justify-center">
      <span className="text-white text-3xl font-bold">{initials}</span>
    </div>
  );
}

interface ReviewCardProps {
  review: (typeof MOCK_REVIEWS)[0];
}

function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <span className="text-emerald-700 text-sm font-bold">
            {review.avatar_initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">
            {review.reviewer_name}
          </p>
          <p className="text-xs text-gray-400">{review.date}</p>
        </div>
        <RatingStars rating={review.rating} size="sm" />
      </div>

      {/* Trek tag */}
      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full w-fit">
        <Mountain className="w-3 h-3" />
        {review.trek}
      </span>

      {/* Body */}
      <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function OrganizerProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState(MOCK_ORGANIZER);
  const [treks, setTreks] = useState(MOCK_TREKS);
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    async function fetchOrg() {
      try {
        const res = await fetch(`/api/organizers/${slug}`);
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        if (data.organizer) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const o: any = data.organizer;
          setOrg({
            slug: o.slug ?? slug,
            name: o.org_name ?? MOCK_ORGANIZER.name,
            tagline: o.description ?? MOCK_ORGANIZER.tagline,
            description: o.description ?? MOCK_ORGANIZER.description,
            logo: o.logo_url ?? null,
            is_verified: o.is_verified ?? false,
            avg_rating: Number(o.avg_rating ?? 0),
            total_reviews: Number(o.total_reviews ?? 0),
            total_treks: o.treks?.length ?? 0,
            active_since: o.agreement_signed_at
              ? new Date(o.agreement_signed_at).getFullYear().toString()
              : o.created_at
              ? new Date(o.created_at).getFullYear().toString()
              : "2024",
            location: "Pune, Maharashtra",
            phone: o.phone ?? "",
            email: o.email ?? "",
            website: "",
          });

          // Map organizer's treks
          if (o.treks && o.treks.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setTreks(o.treks.map((t: any) => {
              const coverImg = (t.trek_images ?? []).find((i: any) => i.is_cover)?.image_url ?? (t.trek_images ?? [])[0]?.image_url ?? null;
              return {
                title: t.title ?? "",
                slug: t.slug ?? "",
                cover_image: coverImg,
                difficulty: t.difficulty ?? "moderate",
                duration: t.duration_days ?? 1,
                distance: Number(t.distance_km ?? 0),
                price: Number(t.default_adult_price ?? 0),
                rating: Number(o.avg_rating ?? 0),
                total_reviews: Number(o.total_reviews ?? 0),
                available_seats: 99,
                total_seats: 99,
                next_date: null,
                is_child_friendly: t.is_child_friendly ?? false,
                organizer_name: o.org_name ?? "",
                region: t.region ?? "",
              };
            }));
          }
          setIsMock(false);

          // Fetch reviews for this organizer
          fetch(`/api/organizers/${slug}/reviews`)
            .then((r) => r.ok ? r.json() : null)
            .then((reviewData) => {
              if (!reviewData?.reviews?.length) return;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setReviews(reviewData.reviews.map((rv: any) => ({
                id: String(rv.id ?? ""),
                reviewer_name: rv.reviewer_name ?? rv.profiles?.full_name ?? "Trekker",
                avatar_initials: (rv.reviewer_name ?? rv.profiles?.full_name ?? "T")
                  .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase(),
                rating: Number(rv.rating ?? 5),
                date: rv.created_at
                  ? new Date(rv.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                  : "—",
                trek: rv.trek_title ?? rv.treks?.title ?? "",
                body: rv.comment ?? rv.body ?? "",
              })));
            })
            .catch(() => { /* keep mock reviews */ });
        }
      } catch {
        // keep mock
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ------------------------------------------------------------------ */}
      {/* Hero banner                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 overflow-hidden">
        {/* Decorative mountain shapes */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
          viewBox="0 0 800 260"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <path d="M0 260 L200 80 L350 180 L500 40 L650 150 L800 60 L800 260Z" fill="white" />
        </svg>

        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-24">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="flex flex-col md:flex-row items-start md:items-end gap-6"
          >
            {/* Logo */}
            <motion.div variants={item}>
              <OrganizerAvatar name={org.name} logo={org.logo} />
            </motion.div>

            {/* Info */}
            <div className="flex-1 min-w-0 pb-1">
              <motion.div
                variants={item}
                className="flex flex-wrap items-center gap-2 mb-2"
              >
                {org.is_verified && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/30 border border-emerald-300/40 text-emerald-100 px-3 py-1 rounded-full backdrop-blur-sm">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Organizer
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-emerald-200 bg-emerald-600/30 border border-emerald-400/20 px-3 py-1 rounded-full">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Since {org.active_since}
                </span>
              </motion.div>

              <motion.h1
                variants={item}
                className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-1"
              >
                {org.name}
              </motion.h1>

              <motion.p variants={item} className="text-emerald-200 text-base mb-3 max-w-xl line-clamp-2">
                {org.tagline}
              </motion.p>

              <motion.div
                variants={item}
                className="flex items-center gap-2 flex-wrap [&_span]:!text-emerald-200"
              >
                <RatingStars rating={org.avg_rating} count={org.total_reviews} size="md" />
                <span className="text-emerald-200 text-sm">
                  &bull; {org.total_treks} treks listed
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stats row                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-5xl mx-auto px-4 -mt-8 mb-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm grid grid-cols-3 divide-x divide-gray-100"
        >
          {[
            { label: "Total Treks", value: org.total_treks, icon: Mountain },
            { label: "Total Reviews", value: org.total_reviews.toLocaleString("en-IN"), icon: MessageSquare },
            { label: "Active Since", value: org.active_since, icon: CalendarDays },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center py-6 px-4 text-center gap-1"
            >
              <Icon className="w-5 h-5 text-emerald-500 mb-1" />
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main content                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left: treks + reviews */}
          <div className="flex-1 min-w-0 space-y-12">
            {/* About */}
            <motion.section
              custom={0.3}
              initial="hidden"
              animate="show"
              variants={fadeUp}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-3">About</h2>
              <p className="text-gray-600 leading-relaxed">{org.description}</p>
            </motion.section>

            {/* Trek grid */}
            <section>
              <motion.h2
                custom={0.4}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="text-xl font-bold text-gray-900 mb-5"
              >
                Treks by {org.name}
              </motion.h2>

              <motion.div
                initial="hidden"
                animate="show"
                variants={stagger}
                className="grid grid-cols-1 sm:grid-cols-2 gap-5"
              >
                {treks.map((trek) => (
                  <motion.div key={trek.slug} variants={item}>
                    <TrekCard trek={trek} />
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {/* Reviews */}
            <section>
              <motion.div
                custom={0.45}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="flex items-center gap-3 mb-5"
              >
                <h2 className="text-xl font-bold text-gray-900">
                  Reviews
                </h2>
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-semibold text-amber-700">
                    {org.avg_rating}
                  </span>
                  <span className="text-xs text-amber-600">
                    ({org.total_reviews} reviews)
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="show"
                variants={stagger}
                className="space-y-4"
              >
                {reviews.map((review) => (
                  <motion.div key={review.id} variants={item}>
                    <ReviewCard review={review} />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          </div>

          {/* Right: contact sidebar */}
          <aside className="lg:w-72 shrink-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24"
            >
              <h3 className="font-bold text-gray-900 mb-4">Contact</h3>

              <div className="space-y-3">
                {org.location && (
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{org.location}</span>
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                    <a
                      href={`tel:${org.phone}`}
                      className="hover:text-emerald-700 transition-colors"
                    >
                      {org.phone}
                    </a>
                  </div>
                )}
                {org.email && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                    <a
                      href={`mailto:${org.email}`}
                      className="hover:text-emerald-700 transition-colors truncate"
                    >
                      {org.email}
                    </a>
                  </div>
                )}
                {org.website && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-700 transition-colors truncate"
                    >
                      {org.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{org.total_treks}</span> treks listed
                  </span>
                </div>
              </div>
            </motion.div>
          </aside>
        </div>
      </div>
    </div>
  );
}
