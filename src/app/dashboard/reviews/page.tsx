"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Star,
  CalendarDays,
  Pencil,
  MessageSquare,
  CheckCircle2,
  Clock,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { RatingStars } from "@/components/shared/rating-stars";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  trekName: string;
  trekDate: string;
  trekImage: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface PendingReview {
  bookingId: string;
  trekName: string;
  trekDate: string;
  trekImage: string;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiReview(r: any): Review {
  const booking = r.bookings ?? {};
  const evt = booking.trek_events ?? {};
  const trek = evt.treks ?? {};
  return {
    id: r.id,
    trekName: trek.title ?? "Trek",
    trekDate: fmtDate(evt.event_date ?? ""),
    trekImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=80&h=80&fit=crop",
    rating: r.rating ?? 0,
    comment: r.comment ?? "",
    createdAt: fmtDate(r.created_at ?? ""),
  };
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

function EditModal({
  review,
  onClose,
}: {
  review: Review | PendingReview & { rating?: number; comment?: string };
  onClose: () => void;
}) {
  const initial = "rating" in review ? (review.rating ?? 0) : 0;
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(initial);
  const [comment, setComment] = useState("comment" in review ? (review.comment ?? "") : "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const display = hovered || selected;

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(onClose, 800);
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {"rating" in review ? "Edit Review" : "Write Review"}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">{review.trekName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Star rating */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Your Rating
          </p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                onMouseEnter={() => setHovered(i + 1)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setSelected(i + 1)}
                className="p-0.5 transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={[
                    "w-8 h-8 transition-colors",
                    display >= i + 1 ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200",
                  ].join(" ")}
                />
              </button>
            ))}
            {display > 0 && (
              <span className="ml-2 text-sm text-slate-500">
                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][display]}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
            Your Review
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Share your experience on this trek..."
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
          />
          <p className="mt-1 text-xs text-slate-400 text-right">{comment.length}/500</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl border-slate-200"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            onClick={handleSave}
            disabled={selected === 0 || !comment.trim() || saving || saved}
          >
            {saved ? (
              <><CheckCircle2 className="w-4 h-4" /> Saved!</>
            ) : saving ? (
              "Saving..."
            ) : (
              <><Save className="w-4 h-4" /> Save Review</>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({ review, onEdit }: { review: Review; onEdit: () => void }) {
  return (
    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <img
            src={review.trekImage}
            alt={review.trekName}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm leading-snug">
                  {review.trekName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <RatingStars rating={review.rating} size="sm" />
                  <span className="text-xs text-slate-400">
                    <CalendarDays className="w-3 h-3 inline mr-0.5" />
                    {review.trekDate}
                  </span>
                </div>
              </div>
              <button
                onClick={onEdit}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-50"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3">
              {review.comment}
            </p>
            <p className="mt-1.5 text-xs text-slate-400">Posted on {review.createdAt}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Pending review card ──────────────────────────────────────────────────────

function PendingReviewCard({ pending, onWrite }: { pending: PendingReview; onWrite: () => void }) {
  return (
    <Card className="border-amber-100 bg-amber-50/40 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <img
            src={pending.trekImage}
            alt={pending.trekName}
            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm truncate">{pending.trekName}</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {pending.trekDate}
            </p>
          </div>
          <Button
            size="sm"
            className="h-8 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-1.5 flex-shrink-0"
            onClick={onWrite}
          >
            <Star className="w-3 h-3" />
            Write Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const [editTarget, setEditTarget] = useState<(Review | (PendingReview & { rating?: number; comment?: string })) | null>(null);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      try {
        const res = await fetch("/api/reviews");
        if (res.ok) {
          const data = await res.json();
          const reviews: Review[] = (data.reviews ?? []).map(mapApiReview);
          setMyReviews(reviews);
          // API doesn't have a pending reviews endpoint yet — keep empty
          setPendingReviews([]);
        }
      } catch {
        // keep empty
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Heading */}
        <motion.div variants={item}>
          <h1 className="text-2xl font-bold text-slate-900">My Reviews</h1>
          <p className="mt-1 text-sm text-slate-500">
            Share your trek experiences with the community.
          </p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <motion.div variants={item} className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading reviews…
          </motion.div>
        )}

        {/* Pending reviews */}
        {pendingReviews.length > 0 && (
          <motion.section variants={item} className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-800">Pending Reviews</h2>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                {pendingReviews.length}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              You have completed treks waiting for your feedback.
            </p>
            <motion.div
              className="space-y-3"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {pendingReviews.map((pending) => (
                <motion.div key={pending.bookingId} variants={item}>
                  <PendingReviewCard
                    pending={pending}
                    onWrite={() => setEditTarget(pending)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* My reviews */}
        <motion.section variants={item} className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-800">My Reviews</h2>
            <Badge className="bg-slate-100 text-slate-600 border-slate-200">
              {myReviews.length}
            </Badge>
          </div>

          {myReviews.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No reviews yet"
              description="Complete a trek and share your experience to help fellow trekkers."
              action={{ label: "Browse Treks", onClick: () => (window.location.href = "/treks") }}
            />
          ) : (
            <motion.div
              className="space-y-3"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {myReviews.map((review) => (
                <motion.div key={review.id} variants={item}>
                  <ReviewCard
                    review={review}
                    onEdit={() => setEditTarget(review)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* Stats footer */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100">
              <Star className="w-5 h-5 text-emerald-600 fill-emerald-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {myReviews.length > 0
                  ? `Your average rating: ${(myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length).toFixed(1)} / 5`
                  : "No reviews yet"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                {myReviews.length} reviews published · helping {myReviews.length * 12}+ trekkers
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Edit / Write modal */}
      <AnimatePresence>
        {editTarget && (
          <EditModal
            review={editTarget}
            onClose={() => setEditTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
