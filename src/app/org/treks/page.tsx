"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Calendar,
  Copy,
  Eye,
  EyeOff,
  Mountain,
  Star,
  Users,
  IndianRupee,
  Loader2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatPrice } from "@/lib/utils";

// ─── Mock Data ─────────────────────────────────────────────────────────────────

type TrekStatus = "published" | "draft";

interface TrekCard {
  id: string;
  title: string;
  difficulty: "Easy" | "Moderate" | "Difficult" | "Very Difficult";
  status: TrekStatus;
  region: string;
  coverImage: string;
  totalBookings: number;
  avgRating: number;
  revenue: number;
  nextDate: string | null;
}

const MOCK_TREKS: TrekCard[] = [
  {
    id: "t1",
    title: "Rajmachi Fort Trek",
    difficulty: "Easy",
    status: "published",
    region: "Rajmachi",
    coverImage:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=70",
    totalBookings: 284,
    avgRating: 4.8,
    revenue: 568000,
    nextDate: "2026-06-14",
  },
  {
    id: "t2",
    title: "Harishchandragad Night Trek",
    difficulty: "Difficult",
    status: "published",
    region: "Harishchandragad",
    coverImage:
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=70",
    totalBookings: 196,
    avgRating: 4.6,
    revenue: 470400,
    nextDate: "2026-06-21",
  },
  {
    id: "t3",
    title: "Kalsubai Peak Sunrise",
    difficulty: "Moderate",
    status: "published",
    region: "Kalsubai",
    coverImage:
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&q=70",
    totalBookings: 112,
    avgRating: 4.5,
    revenue: 201600,
    nextDate: "2026-06-28",
  },
  {
    id: "t4",
    title: "Mulshi Valley Waterfall Trek",
    difficulty: "Easy",
    status: "draft",
    region: "Mulshi",
    coverImage:
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=70",
    totalBookings: 0,
    avgRating: 0,
    revenue: 0,
    nextDate: null,
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function difficultyColor(d: string) {
  const map: Record<string, string> = {
    Easy: "bg-green-100 text-green-700 border-green-200",
    Moderate: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Difficult: "bg-orange-100 text-orange-700 border-orange-200",
    "Very Difficult": "bg-red-100 text-red-700 border-red-200",
  };
  return map[d] ?? "bg-slate-100 text-slate-600";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Trek Card ─────────────────────────────────────────────────────────────────

function TrekListCard({
  trek,
  index,
  onToggleStatus,
}: {
  trek: TrekCard;
  index: number;
  onToggleStatus: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Cover image */}
        <div className="relative h-40 w-full sm:h-auto sm:w-44 shrink-0 overflow-hidden">
          <img
            src={trek.coverImage}
            alt={trek.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent sm:bg-gradient-to-r" />
          {/* Status badge over image */}
          <span
            className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              trek.status === "published"
                ? "bg-emerald-500 text-white"
                : "bg-slate-600 text-white"
            }`}
          >
            {trek.status}
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">{trek.title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${difficultyColor(
                    trek.difficulty
                  )}`}
                >
                  {trek.difficulty}
                </span>
                <span className="text-xs text-slate-400">{trek.region}</span>
              </div>
            </div>
            {trek.nextDate && (
              <div className="shrink-0 text-right">
                <p className="text-[11px] text-slate-400">Next date</p>
                <p className="text-xs font-semibold text-slate-700">
                  {formatDate(trek.nextDate)}
                </p>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-3 flex flex-wrap gap-4 border-t border-slate-50 pt-3">
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium">{trek.totalBookings}</span>
              <span className="text-slate-400 text-xs">bookings</span>
            </div>
            {trek.avgRating > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium">{trek.avgRating}</span>
              </div>
            )}
            {trek.revenue > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">{formatPrice(trek.revenue)}</span>
                <span className="text-slate-400 text-xs">earned</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/org/treks/${trek.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
            <Link
              href={`/org/treks/${trek.id}/events`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" />
              Manage Events
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => onToggleStatus(trek.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                trek.status === "published"
                  ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {trek.status === "published" ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Unpublish
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Publish
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrgTreksPage() {
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [treks, setTreks] = useState<TrekCard[]>(MOCK_TREKS);
  const [loading, setLoading] = useState(true);
  const [isMockData, setIsMockData] = useState(false);

  useEffect(() => {
    fetch("/api/organizers/me/treks").then(r => r.ok ? r.json() : null).then((res) => {
      const data = res?.treks ?? [];
      if (data.length > 0) {
        const mapped: TrekCard[] = data.map((t: { id: string; title: string; difficulty: string; is_published: boolean; slug: string; cover_image_url?: string; total_bookings: number }) => ({
          id: t.id,
          title: t.title,
          difficulty: (t.difficulty as TrekCard["difficulty"]) ?? "Moderate",
          status: t.is_published ? "published" : "draft",
          region: t.slug,
          coverImage:
            t.cover_image_url ??
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=70",
          totalBookings: t.total_bookings,
          avgRating: 0,
          revenue: 0,
          nextDate: null,
        }));
        setTreks(mapped);
        setIsMockData(false);
      } else {
        setIsMockData(true);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const filtered =
    filter === "all" ? treks : treks.filter((t) => t.status === filter);

  const handleToggle = (id: string) => {
    setTreks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "published" ? "draft" : "published" }
          : t
      )
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 lg:px-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Treks</h1>
          <p className="text-sm text-slate-500">
            {treks.length} treks in your portfolio
            {isMockData && (
              <span className="ml-2 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                Sample data
              </span>
            )}
          </p>
        </div>
        <Link
          href="/org/treks/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          Create New Trek
        </Link>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="all">
              All ({treks.length})
            </TabsTrigger>
            <TabsTrigger value="published">
              Published ({treks.filter((t) => t.status === "published").length})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Draft ({treks.filter((t) => t.status === "draft").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Trek list */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Mountain}
            title="No treks found"
            description={
              filter === "draft"
                ? "You don't have any draft treks. Start creating one!"
                : "You haven't published any treks yet."
            }
            action={{
              label: "Create New Trek",
              onClick: () => (window.location.href = "/org/treks/new"),
            }}
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((trek, i) => (
              <TrekListCard
                key={trek.id}
                trek={trek}
                index={i}
                onToggleStatus={handleToggle}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
