"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Filter } from "lucide-react";
import { Select } from "@/components/ui/select";
import { RatingStars } from "@/components/shared/rating-stars";

// ─── Mock Data ─────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  trek: string;
  trekker: string;
  date: string;
  rating: number;
  comment: string;
}

const ALL_REVIEWS: Review[] = [
  {
    id: "r1",
    trek: "Rajmachi Fort Trek",
    trekker: "Priya Sharma",
    date: "2026-06-01",
    rating: 5,
    comment:
      "Absolutely fantastic experience! The trek leader was knowledgeable and the route was breathtaking. Breakfast at the top was a nice touch. Will definitely book again!",
  },
  {
    id: "r2",
    trek: "Harishchandragad Night Trek",
    trekker: "Amit Kulkarni",
    date: "2026-05-25",
    rating: 4,
    comment:
      "Great night trek with stunning sunrise views from Kokankada. The pace was comfortable and the safety measures were well in place. The coffee at base camp made it even better.",
  },
  {
    id: "r3",
    trek: "Kalsubai Peak Sunrise",
    trekker: "Sneha Patil",
    date: "2026-05-18",
    rating: 5,
    comment:
      "Kalsubai is stunning and Summit Trails made it even more memorable. Perfect organisation, zero hiccups. Highly recommended!",
  },
  {
    id: "r4",
    trek: "Rajmachi Fort Trek",
    trekker: "Rahul Desai",
    date: "2026-05-10",
    rating: 4,
    comment:
      "Very well organised. The guide was helpful and knew the routes like the back of his hand. Slightly delayed pickup but overall a great day out.",
  },
  {
    id: "r5",
    trek: "Bhimashankar Trek",
    trekker: "Meera Joshi",
    date: "2026-04-22",
    rating: 3,
    comment:
      "The trek itself was beautiful but the food quality could be improved. The trek leader was good though. Decent overall, has scope for improvement.",
  },
  {
    id: "r6",
    trek: "Rajmachi Fort Trek",
    trekker: "Kiran Pawar",
    date: "2026-04-15",
    rating: 5,
    comment:
      "My 5th trek with Summit Trails and they keep getting better! The new inclusion of tea/coffee at the top is a fantastic touch. Loyal customer for life.",
  },
  {
    id: "r7",
    trek: "Harishchandragad Night Trek",
    trekker: "Pooja Nair",
    date: "2026-04-05",
    rating: 5,
    comment:
      "The night trek was an experience of a lifetime. Everything from pickup to drop was seamless. The star gazing break mid-trail was magical!",
  },
  {
    id: "r8",
    trek: "Kalsubai Peak Sunrise",
    trekker: "Suresh More",
    date: "2026-03-28",
    rating: 4,
    comment:
      "Good trek with a well-paced group. The sunrise was worth every step. Would love to see more vegetarian breakfast options.",
  },
];

const MOCK_REVIEWS = ALL_REVIEWS;
const RATING_OPTIONS = ["All Ratings", "5", "4", "3", "2", "1"];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex w-6 items-center justify-end gap-0.5">
        <span className="text-xs font-medium text-slate-600">{star}</span>
        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      </div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-full rounded-full bg-amber-400"
        />
      </div>
      <span className="w-8 text-right text-xs text-slate-400 tabular-nums">{count}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrgReviewsPage() {
  const [trekFilter, setTrekFilter] = useState("All Treks");
  const [ratingFilter, setRatingFilter] = useState("All Ratings");
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [avgRatingVal, setAvgRatingVal] = useState(
    MOCK_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / MOCK_REVIEWS.length
  );
  const [breakdownData, setBreakdownData] = useState(
    [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: MOCK_REVIEWS.filter((r) => r.rating === star).length,
    }))
  );
  const [isMock, setIsMock] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/organizers/me/reviews").then(r => r.ok ? r.json() : null).then((data) => {
      if (data && data.reviews.length > 0) {
        setReviews(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.reviews.map((r: any) => ({
            id: r.id,
            trek: r.trek_title ?? "Unknown Trek",
            trekker: r.trekker_name ?? "Anonymous",
            date: r.created_at,
            rating: r.rating,
            comment: r.comment ?? "",
          }))
        );
        setAvgRatingVal(data.avgRating);
        setBreakdownData(
          [5, 4, 3, 2, 1].map((star) => ({
            star,
            count: (data.breakdown as Record<string, number>)[String(star)] ?? 0,
          }))
        );
        setIsMock(false);
      }
      setLoading(false);
    });
  }, []);

  const trekOptions = ["All Treks", ...Array.from(new Set(reviews.map((r) => r.trek)))];

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const matchTrek = trekFilter === "All Treks" || r.trek === trekFilter;
      const matchRating =
        ratingFilter === "All Ratings" || r.rating === Number(ratingFilter);
      return matchTrek && matchRating;
    });
  }, [reviews, trekFilter, ratingFilter]);

  const avgRating = avgRatingVal;
  const breakdown = breakdownData;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
          {!loading && isMock && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
              Sample data
            </span>
          )}
          {loading && (
            <span className="text-sm text-slate-400">Loading…</span>
          )}
        </div>
        <p className="text-sm text-slate-500">Trekker feedback across all your treks</p>
      </motion.div>

      {/* Overview card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Big rating */}
          <div className="flex flex-col items-center justify-center sm:w-40 sm:border-r sm:border-slate-100 sm:pr-6">
            <p className="text-6xl font-extrabold text-slate-900 leading-none">{avgRating.toFixed(1)}</p>
            <div className="mt-2">
              <RatingStars rating={avgRating} size="md" />
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Rating breakdown */}
          <div className="flex-1 space-y-2">
            {breakdown.map((item) => (
              <RatingBar
                key={item.star}
                star={item.star}
                count={item.count}
                total={reviews.length}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap items-center gap-3"
      >
        <Filter className="h-4 w-4 text-slate-400 shrink-0" />
        <div className="w-52">
          <Select value={trekFilter} onChange={(e) => setTrekFilter(e.target.value)}>
            {trekOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <div className="w-36">
          <Select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
            {RATING_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </div>
        <span className="text-sm text-slate-500">
          {filtered.length} review{filtered.length !== 1 ? "s" : ""}
        </span>
      </motion.div>

      {/* Reviews list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-14 text-center">
            <Star className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600">No reviews match your filters</p>
          </div>
        ) : (
          filtered.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {review.trekker.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{review.trekker}</p>
                    <p className="text-xs text-slate-400">{review.trek}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <RatingStars rating={review.rating} size="sm" />
                  <p className="mt-0.5 text-[11px] text-slate-400">{formatDate(review.date)}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-700 leading-relaxed">{review.comment}</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
