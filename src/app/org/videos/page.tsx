"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Tv2 as Youtube,
  Plus,
  Pencil,
  Trash2,
  Link2,
  Mountain,
  X,
  Save,
  CheckCircle2,
  ExternalLink,
  PlayCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pat of patterns) {
    const m = url.match(pat);
    if (m) return m[1];
  }
  return null;
}

function ytThumb(id: string) {
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TrekOption {
  id: string;
  name: string;
}

interface Video {
  id: string;
  youtubeUrl: string;
  youtubeId: string;
  title: string;
  linkedTrekId: string | null;
  linkedTrekName: string | null;
}

// ─── Video form modal ─────────────────────────────────────────────────────────

interface VideoFormProps {
  initial?: Partial<Video>;
  treks: TrekOption[];
  onSave: (v: Omit<Video, "id">) => void;
  onClose: () => void;
}

function VideoFormModal({ initial, treks, onSave, onClose }: VideoFormProps) {
  const [url, setUrl] = useState(initial?.youtubeUrl ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [trekId, setTrekId] = useState(initial?.linkedTrekId ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const ytId = extractYouTubeId(url);
  const linkedTrek = treks.find((t) => t.id === trekId) ?? null;

  const handleSave = () => {
    if (!ytId || !title.trim()) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        onSave({
          youtubeUrl: url,
          youtubeId: ytId,
          title: title.trim(),
          linkedTrekId: trekId || null,
          linkedTrekName: linkedTrek?.name ?? null,
        });
        onClose();
      }, 600);
    }, 1000);
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            {initial?.id ? "Edit Video" : "Add Video"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* YouTube URL */}
        <div className="mb-4 space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            YouTube URL *
          </label>
          <div className="relative">
            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="pl-9 rounded-xl border-slate-200 focus:border-emerald-400"
            />
          </div>
          {url && !ytId && (
            <p className="text-xs text-red-500">Please enter a valid YouTube URL</p>
          )}
        </div>

        {/* Thumbnail preview */}
        <AnimatePresence>
          {ytId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="relative rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={ytThumb(ytId)}
                  alt="YouTube thumbnail"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle className="w-12 h-12 text-white/80" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title */}
        <div className="mb-4 space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Video Title *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your video..."
            className="rounded-xl border-slate-200 focus:border-emerald-400"
          />
        </div>

        {/* Link to trek */}
        <div className="mb-6 space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Link to Trek (optional)
          </label>
          <div className="relative">
            <Mountain className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={trekId}
              onChange={(e) => setTrekId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
            >
              <option value="">— No trek linked —</option>
              {treks.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-xl border-slate-200" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            onClick={handleSave}
            disabled={!ytId || !title.trim() || saving || saved}
          >
            {saved ? (
              <><CheckCircle2 className="w-4 h-4" /> Saved!</>
            ) : saving ? (
              "Saving..."
            ) : (
              <><Save className="w-4 h-4" /> Save Video</>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [treks, setTreks] = useState<TrekOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [channelUrl, setChannelUrl] = useState("");
  const [channelSaved, setChannelSaved] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch initial data ──────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [videosRes, treksRes, profileRes] = await Promise.all([
          fetch("/api/videos"),
          fetch("/api/treks?limit=50"),
          fetch("/api/auth/profile"),
        ]);

        if (videosRes.ok) {
          const data = await videosRes.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: Video[] = (data.videos ?? []).map((v: any) => ({
            id: v.id,
            youtubeUrl: v.youtube_url,
            youtubeId: extractYouTubeId(v.youtube_url ?? "") ?? "",
            title: v.title ?? v.youtube_url,
            linkedTrekId: v.treks?.id ?? null,
            linkedTrekName: v.treks?.title ?? null,
          }));
          setVideos(mapped);
        }

        if (treksRes.ok) {
          const data = await treksRes.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const opts: TrekOption[] = (data.treks ?? []).map((t: any) => ({
            id: t.id,
            name: t.title,
          }));
          setTreks(opts);
        }

        if (profileRes.ok) {
          const data = await profileRes.json();
          setChannelUrl(data.user?.youtube_channel_url ?? "");
        }
      } catch {
        // keep empty
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // ── CRUD handlers ───────────────────────────────────────────────────────────

  const handleSaveVideo = async (data: Omit<Video, "id">) => {
    try {
      if (editingVideo) {
        const res = await fetch(`/api/videos/${editingVideo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            youtube_url: data.youtubeUrl,
            trek_id: data.linkedTrekId ?? null,
            title: data.title,
          }),
        });
        if (res.ok) {
          setVideos((prev) =>
            prev.map((v) => (v.id === editingVideo.id ? { ...data, id: v.id } : v))
          );
        }
        setEditingVideo(null);
      } else {
        const res = await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            youtube_url: data.youtubeUrl,
            trek_id: data.linkedTrekId ?? null,
            title: data.title,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          const v = json.video;
          setVideos((prev) => [
            {
              id: v.id,
              youtubeUrl: v.youtube_url,
              youtubeId: extractYouTubeId(v.youtube_url ?? "") ?? "",
              title: v.title ?? v.youtube_url,
              linkedTrekId: data.linkedTrekId,
              linkedTrekName: data.linkedTrekName,
            },
            ...prev,
          ]);
        }
      }
    } catch {
      // ignore — optimistic update already done
    }
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    setDeleteId(null);
    try {
      await fetch(`/api/videos/${id}`, { method: "DELETE" });
    } catch {
      // silent
    }
  };

  const handleSaveChannel = async () => {
    setChannelSaved(true);
    try {
      await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_channel_url: channelUrl }),
      });
    } catch {
      // silent
    }
    setTimeout(() => setChannelSaved(false), 2000);
  };

  const containerVars: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const itemVars: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <>
      <motion.div
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Heading */}
        <motion.div variants={itemVars} className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Trek Videos</h1>
            <p className="mt-1 text-sm text-slate-500">
              Share your trek adventures with the community.
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Video</span>
          </Button>
        </motion.div>

        {/* YouTube Channel URL */}
        <motion.div
          variants={itemVars}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <Youtube className="w-4.5 h-4.5 text-red-500" />
            <h2 className="text-sm font-semibold text-slate-700">Your YouTube Channel</h2>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder="https://youtube.com/@yourchannel"
                className="pl-9 rounded-xl border-slate-200 focus:border-red-400"
              />
            </div>
            <Button
              onClick={handleSaveChannel}
              className={cn(
                "rounded-xl gap-1.5 transition-all",
                channelSaved
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                  : "bg-slate-800 hover:bg-slate-900 text-white"
              )}
            >
              {channelSaved ? (
                <><CheckCircle2 className="w-4 h-4" /> Saved</>
              ) : (
                "Save"
              )}
            </Button>
          </div>
          {channelUrl && (
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              View Channel
            </a>
          )}
        </motion.div>

        {/* Videos list */}
        {loading ? (
          <motion.div variants={itemVars} className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </motion.div>
        ) : videos.length === 0 ? (
          <motion.div variants={itemVars}>
            <EmptyState
              icon={Youtube}
              title="No videos yet"
              description="Share your trek adventures! Add YouTube videos from your channel to showcase your experiences."
              action={{ label: "Add Video", onClick: () => setShowForm(true) }}
            />
          </motion.div>
        ) : (
          <motion.div
            variants={containerVars}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {videos.map((video) => (
              <motion.div key={video.id} variants={itemVars} layout>
                <Card className="border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden group">
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden bg-slate-100">
                    <img
                      src={ytThumb(video.youtubeId)}
                      alt={video.title}
                      className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Play overlay */}
                    <a
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 shadow-lg">
                        <PlayCircle className="w-7 h-7 text-white" />
                      </div>
                    </a>
                    {/* YouTube badge */}
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
                        <Youtube className="w-3 h-3 text-red-400" />
                        YouTube
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-3">
                    <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
                      {video.title}
                    </h3>
                    {video.linkedTrekName && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600">
                        <Mountain className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{video.linkedTrekName}</span>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-1.5">
                      <button
                        onClick={() => { setEditingVideo(video); setShowForm(true); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors border border-slate-100"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(video.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors border border-slate-100"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Video form modal */}
      <AnimatePresence>
        {(showForm || editingVideo) && (
          <VideoFormModal
            initial={editingVideo ?? undefined}
            treks={treks}
            onSave={handleSaveVideo}
            onClose={() => { setShowForm(false); setEditingVideo(null); }}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm dialog */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Video?</h3>
              <p className="mt-2 text-sm text-slate-500">
                This will remove the video from your profile. You can always add it again.
              </p>
              <div className="mt-5 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setDeleteId(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => handleDelete(deleteId)}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
