"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ShieldCheck, CheckCircle, Building2, Bell, User, Loader2, CalendarX, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getOrganizer } from "@/actions/organizer";
import { CancellationRulesBuilder } from "@/components/shared/cancellation-rules-builder";
import type { CancellationRule } from "@/components/shared/cancellation-rules-builder";

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrgSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Org info
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Bank
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");

  // Default cancellation rules
  const [cancellationRules, setCancellationRules] = useState<CancellationRule[]>([
    { hours_before: 48, refund_percent: 100 },
    { hours_before: 24, refund_percent: 50 },
    { hours_before: 0, refund_percent: 0 },
  ]);

  // Password
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Notifications
  const [notifs, setNotifs] = useState({
    newBookingEmail: true,
    cancellationEmail: true,
    payoutProcessed: true,
    weeklySummary: false,
  });

  // Fetch real data on mount
  useEffect(() => {
    async function fetchOrg() {
      try {
        const org = await getOrganizer();
        if (org) {
          setOrgName(org.org_name ?? "");
          setSlug(org.slug ?? "");
          setDescription(org.description ?? "");
          setContactEmail(org.email ?? "");
          setContactPhone(org.phone ?? "");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const orgAny = org as any;
          setAccountHolder(orgAny.bank_account_name ?? "");
          setAccountNumber(orgAny.bank_account_number ?? "");
          setIfsc(orgAny.bank_ifsc ?? "");
          if (orgAny.default_cancellation_rules?.length) {
            setCancellationRules(orgAny.default_cancellation_rules);
          }
          if (org.logo_url) setLogoPreview(org.logo_url);
        }
      } catch {
        // keep empty defaults
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, []);

  const toggleNotif = (key: keyof typeof notifs) =>
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleChangePassword = async () => {
    setPwMessage(null);
    if (!pw.current) { setPwMessage({ text: "Enter your current password.", type: "error" }); return; }
    if (pw.next.length < 8) { setPwMessage({ text: "New password must be at least 8 characters.", type: "error" }); return; }
    if (pw.next !== pw.confirm) { setPwMessage({ text: "Passwords do not match.", type: "error" }); return; }
    setSavingPw(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: pw.current, new_password: pw.next }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMessage({ text: "Password updated successfully!", type: "success" });
        setPw({ current: "", next: "", confirm: "" });
      } else {
        setPwMessage({ text: data.error ?? "Failed to update password.", type: "error" });
      }
    } catch {
      setPwMessage({ text: "Failed to update password.", type: "error" });
    } finally {
      setSavingPw(false);
    }
  };

  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let logoUrl: string | undefined;

      // Upload logo if a new file was selected
      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        fd.append("bucket", "organizer-logos");
        fd.append("folder", "logos");

        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.url) {
          logoUrl = uploadData.url;
          setLogoFile(null);
        }
      }

      const res = await fetch("/api/organizers/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: orgName,
          description,
          email: contactEmail,
          phone: contactPhone,
          bank_account_name: accountHolder,
          bank_account_number: accountNumber,
          bank_ifsc: ifsc,
          default_cancellation_rules: cancellationRules,
          ...(logoUrl ? { logo_url: logoUrl } : {}),
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your organizer profile, bank details, and preferences</p>
      </motion.div>

      {/* Organization Info */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <SettingsSection
          title="Organization Information"
          description="Public-facing details shown to trekkers"
          icon={User}
        >
          {/* Logo */}
          <div className="mb-6 flex items-center gap-5">
            <div className="relative">
              <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-slate-400">
                    {orgName ? orgName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "?"}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 transition-colors">
                <Camera className="h-3.5 w-3.5" />
                <input type="file" accept="image/*" className="sr-only" onChange={handleLogoChange} />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Organization Logo</p>
              <p className="text-xs text-slate-400">JPG or PNG, recommended 256×256 px</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Organization Name *
                </label>
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  URL Slug <span className="text-slate-400 font-normal text-xs">(read-only)</span>
                </label>
                <div className="flex h-9 w-full items-center rounded-md border border-input bg-slate-50 px-3 text-sm text-slate-500 overflow-hidden whitespace-nowrap">
                  <span className="shrink-0">trekbooking.in/</span><span className="font-medium text-slate-700 truncate">{slug}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Contact Email
                </label>
                <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Contact Phone
                </label>
                <Input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </div>
            </div>
          </div>
        </SettingsSection>
      </motion.div>

      {/* Bank Account */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <SettingsSection
          title="Bank Account"
          description="Payouts will be credited to this account"
          icon={Building2}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Bank details are encrypted and stored securely. Never shared with third parties.
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Account Holder Name *
              </label>
              <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Account Number *
                </label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  IFSC Code *
                </label>
                <Input
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  maxLength={11}
                />
              </div>
            </div>
          </div>
        </SettingsSection>
      </motion.div>

      {/* Default Cancellation Policy */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
        <SettingsSection
          title="Default Cancellation Policy"
          description="Applied to all new treks unless overridden per trek"
          icon={CalendarX}
        >
          <CancellationRulesBuilder
            rules={cancellationRules}
            onChange={setCancellationRules}
          />
        </SettingsSection>
      </motion.div>

      {/* Notification Preferences */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <SettingsSection
          title="Notification Preferences"
          description="Choose when you'd like to be notified"
          icon={Bell}
        >
          <div className="divide-y divide-slate-50">
            {[
              {
                key: "newBookingEmail" as const,
                label: "New Booking",
                description: "Get notified when someone books one of your treks",
              },
              {
                key: "cancellationEmail" as const,
                label: "Booking Cancellation",
                description: "Get notified when a trekker cancels their booking",
              },
              {
                key: "payoutProcessed" as const,
                label: "Payout Processed",
                description: "Get notified when a payout is credited to your account",
              },
              {
                key: "weeklySummary" as const,
                label: "Weekly Summary",
                description: "Receive a weekly digest of your bookings and revenue",
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
                <Toggle
                  checked={notifs[item.key]}
                  onChange={() => toggleNotif(item.key)}
                />
              </div>
            ))}
          </div>
        </SettingsSection>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
        <SettingsSection
          title="Change Password"
          description="Use a strong password with at least 8 characters"
          icon={Lock}
        >
          <div className="space-y-4">
            {pwMessage && (
              <div className={cn(
                "rounded-lg px-4 py-2.5 text-sm",
                pwMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
              )}>
                {pwMessage.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
              <div className="relative">
                <Input
                  type={showPw.current ? "text" : "password"}
                  value={pw.current}
                  onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                  placeholder="Enter current password"
                />
                <button type="button" onClick={() => setShowPw((s) => ({ ...s, current: !s.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Input
                    type={showPw.next ? "text" : "password"}
                    value={pw.next}
                    onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                    placeholder="Min. 8 characters"
                  />
                  <button type="button" onClick={() => setShowPw((s) => ({ ...s, next: !s.next }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showPw.confirm ? "text" : "password"}
                    value={pw.confirm}
                    onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repeat new password"
                  />
                  <button type="button" onClick={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={savingPw} variant="outline" className="gap-2">
                {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Update Password
              </Button>
            </div>
          </div>
        </SettingsSection>
      </motion.div>

      {/* Save button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex items-center gap-3 pb-8"
      >
        <Button onClick={handleSave} disabled={saving} className="px-8">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving...</> : "Save Changes"}
        </Button>

        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-sm font-medium text-emerald-600"
            >
              <CheckCircle className="h-4 w-4" />
              Changes saved!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
