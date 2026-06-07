"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  X,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";


const EMPTY_PROFILE = {
  fullName: "",
  email: "",
  phone: "",
  city: "",
  avatarUrl: "",
  initials: "?",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
      <div className="p-2 rounded-xl bg-slate-100">
        <Icon className="w-4.5 h-4.5 text-slate-600" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10 rounded-xl border-slate-200 focus:border-emerald-400"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 60, x: "-50%" }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className={cn(
        "fixed bottom-6 left-1/2 z-[100] flex items-center gap-2.5 rounded-2xl px-5 py-3 shadow-xl text-sm font-medium",
        type === "success"
          ? "bg-emerald-600 text-white"
          : "bg-red-500 text-white"
      )}
    >
      {type === "success" ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <AlertTriangle className="w-4 h-4" />
      )}
      {message}
    </motion.div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteAccountModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [confirm, setConfirm] = useState("");
  const valid = confirm === "delete my account";

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
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <h3 className="text-lg font-bold text-slate-900">Delete Account</h3>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          This action is <strong className="text-slate-700">permanent and irreversible</strong>. All your bookings, reviews, and data will be deleted.
        </p>
        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Type &quot;delete my account&quot; to confirm
          </label>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="delete my account"
            className="rounded-xl border-slate-200 focus:border-red-400"
          />
        </div>
        <div className="mt-5 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className={cn(
              "flex-1 rounded-xl transition-all",
              valid
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-red-200 text-red-300 cursor-not-allowed"
            )}
            disabled={!valid}
            onClick={onConfirm}
          >
            Delete Account
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  // Profile state
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);

  // Password state
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  // UI state
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  // Fetch real profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/auth/profile");
        if (res.ok) {
          const { user } = await res.json();
          if (user) {
            const name = user.full_name ?? "";
            setProfile({
              fullName: name,
              email: user.email ?? "",
              phone: user.phone ?? "",
              city: user.city ?? "Pune",
              avatarUrl: user.avatar_url ?? "",
              initials: name
                ? name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
                : "?",
            });
            if (user.avatar_url) setAvatarPreview(user.avatar_url);
          }
        }
      } catch {
        // keep empty
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profile.fullName,
          phone: profile.phone,
          city: profile.city,
        }),
      });
      if (res.ok) {
        showToast("Profile updated successfully!");
      } else {
        showToast("Failed to update profile.", "error");
      }
    } catch {
      showToast("Failed to update profile.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (!pw.current) {
      showToast("Please enter your current password.", "error");
      return;
    }
    if (pw.next !== pw.confirm) {
      showToast("Passwords do not match.", "error");
      return;
    }
    if (pw.next.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: pw.current,
          new_password: pw.next,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Password updated successfully!");
        setPw({ current: "", next: "", confirm: "" });
      } else {
        showToast(data.error ?? "Failed to update password.", "error");
      }
    } catch {
      showToast("Failed to update password.", "error");
    } finally {
      setSavingPw(false);
    }
  };

  const initials = profile.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const containerVars: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09 } },
  };
  const itemVars: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0, 0, 0.58, 1] as [number, number, number, number] } },
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="space-y-6 max-w-2xl"
      >
        {/* Page heading */}
        <motion.div variants={itemVars}>
          <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your profile, password, and account preferences.
          </p>
        </motion.div>

        {/* ── Profile section ── */}
        <motion.div
          variants={itemVars}
          className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5"
        >
          <SectionHeading
            icon={User}
            title="Profile Information"
            description="Update your public trekker profile."
          />

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-emerald-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center ring-2 ring-emerald-200">
                  <span className="text-2xl font-bold text-emerald-600">{initials}</span>
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{profile.fullName}</p>
              <p className="text-xs text-slate-400 mt-0.5">Trekker · Pune, Maharashtra</p>
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                <Camera className="w-3 h-3" />
                Change photo
              </button>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Full Name</FieldLabel>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={profile.fullName}
                  onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                  className="pl-9 rounded-xl border-slate-200 focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Email Address</FieldLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <Input
                  value={profile.email}
                  readOnly
                  className="pl-9 rounded-xl border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">Email cannot be changed.</p>
            </div>

            <div>
              <FieldLabel>Phone Number</FieldLabel>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  className="pl-9 rounded-xl border-slate-200 focus:border-emerald-400"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <FieldLabel>City</FieldLabel>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={profile.city}
                  onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                  className="pl-9 rounded-xl border-slate-200 focus:border-emerald-400"
                  placeholder="Pune"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 min-w-32"
            >
              {savingProfile ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Saving…
                </span>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </Button>
          </div>
        </motion.div>

        {/* ── Password section ── */}
        <motion.div
          variants={itemVars}
          className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5"
        >
          <SectionHeading
            icon={Lock}
            title="Change Password"
            description="Use a strong password with at least 8 characters."
          />

          <div className="space-y-4">
            <div>
              <FieldLabel>Current Password</FieldLabel>
              <PasswordInput
                value={pw.current}
                onChange={(v) => setPw((p) => ({ ...p, current: v }))}
                placeholder="Enter current password"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>New Password</FieldLabel>
                <PasswordInput
                  value={pw.next}
                  onChange={(v) => setPw((p) => ({ ...p, next: v }))}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <FieldLabel>Confirm Password</FieldLabel>
                <PasswordInput
                  value={pw.confirm}
                  onChange={(v) => setPw((p) => ({ ...p, confirm: v }))}
                  placeholder="Repeat new password"
                />
              </div>
            </div>
          </div>

          {/* Password strength indicator */}
          {pw.next && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1.5"
            >
              <div className="flex gap-1">
                {[8, 12, 16].map((len, i) => (
                  <div
                    key={len}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      pw.next.length >= len
                        ? i === 0 ? "bg-red-400" : i === 1 ? "bg-amber-400" : "bg-emerald-500"
                        : "bg-slate-100"
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400">
                {pw.next.length < 8 ? "Too short" : pw.next.length < 12 ? "Weak" : pw.next.length < 16 ? "Fair" : "Strong"}
              </p>
            </motion.div>
          )}

          {pw.next && pw.confirm && pw.next !== pw.confirm && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Passwords do not match
            </p>
          )}

          <div className="flex justify-end pt-1">
            <Button
              onClick={handleSavePassword}
              disabled={savingPw || !pw.current || !pw.next || pw.next !== pw.confirm}
              className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl gap-2 min-w-40"
            >
              {savingPw ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Updating…
                </span>
              ) : (
                <><ShieldCheck className="w-4 h-4" /> Update Password</>
              )}
            </Button>
          </div>
        </motion.div>

        {/* ── Danger zone ── */}
        <motion.div
          variants={itemVars}
          className="rounded-2xl border border-red-100 bg-red-50/30 p-6 shadow-sm space-y-4"
        >
          <SectionHeading
            icon={AlertTriangle}
            title="Danger Zone"
            description="Irreversible actions that affect your account permanently."
          />

          <div className="flex items-start justify-between gap-4 rounded-xl border border-red-100 bg-white p-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Delete Account</p>
              <p className="text-xs text-slate-500 mt-0.5 max-w-sm">
                Permanently delete your account and all associated data including bookings, reviews, and videos.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDelete(true)}
              className="rounded-xl gap-1.5 flex-shrink-0 bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>
        </motion.div>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {showDelete && (
          <DeleteAccountModal
            onClose={() => setShowDelete(false)}
            onConfirm={async () => {
              setShowDelete(false);
              try {
                const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
                const data = await res.json();
                if (res.ok) {
                  window.location.href = "/";
                } else {
                  showToast(data.error ?? "Failed to delete account.", "error");
                }
              } catch {
                showToast("Failed to delete account.", "error");
              }
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
