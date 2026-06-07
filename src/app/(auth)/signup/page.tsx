"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff, Backpack, Mountain, Loader2 } from "lucide-react";
import { signInWithGoogle } from "@/actions/auth";

type Role = "trekker" | "organizer";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.065 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.58, 1] as [number, number, number, number] } },
};

function getStrength(password: string): { label: string; color: string; width: string } {
  if (!password) return { label: "", color: "bg-gray-200", width: "w-0" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Weak", color: "bg-red-400", width: "w-1/3" };
  if (score <= 3) return { label: "Medium", color: "bg-amber-400", width: "w-2/3" };
  return { label: "Strong", color: "bg-green-500", width: "w-full" };
}

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("trekker");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const strength = getStrength(password);

  function validateForm(fd: globalThis.FormData): boolean {
    const errors: Record<string, string> = {};
    const name = (fd.get("full_name") as string)?.trim();
    const email = (fd.get("email") as string)?.trim();
    const pw = fd.get("password") as string;
    const phone = (fd.get("phone") as string)?.trim();

    if (!name || name.length < 2) errors.full_name = "Name must be at least 2 characters.";
    if (name && name.length > 100) errors.full_name = "Name is too long (max 100).";
    if (!email) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Invalid email format.";
    if (!pw) errors.password = "Password is required.";
    else if (pw.length < 8) errors.password = "Password must be at least 8 characters.";
    if (phone && !/^[6-9]\d{9}$/.test(phone)) errors.phone = "Must be a valid 10-digit Indian number.";
    if (!agreed) errors.agreed = "You must agree to the terms.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!validateForm(fd)) return;

    setIsPending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: (fd.get("full_name") as string)?.trim(),
          email: (fd.get("email") as string)?.trim(),
          password: fd.get("password") as string,
          phone: (fd.get("phone") as string)?.trim() || undefined,
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Signup failed. Please try again.");
      } else {
        router.push("/login?message=account_created");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-5">
        {/* Logo */}
        <motion.div variants={fadeUp} className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-green-700 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">TrekBooking</span>
        </motion.div>

        {/* Heading */}
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Join the trekking community</p>
        </motion.div>

        {/* Error alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
          >
            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Role selector */}
          <motion.div variants={fadeUp}>
            <input type="hidden" name="role" value={role} />
            <p className="text-sm font-medium text-gray-700 mb-2">I am a…</p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: "trekker", label: "Trekker", Icon: Backpack, desc: "Find & book treks" },
                  { value: "organizer", label: "Organizer", Icon: Mountain, desc: "List your treks" },
                ] as const
              ).map(({ value, label, Icon, desc }) => (
                <motion.button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-4 px-3 transition cursor-pointer ${
                    role === value
                      ? "border-green-600 bg-green-50 text-green-800"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${role === value ? "text-green-700" : "text-gray-400"}`}
                  />
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs text-current opacity-70">{desc}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Full name */}
          <motion.div variants={fadeUp}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <input
              type="text"
              name="full_name"
              required
              autoComplete="name"
              placeholder="Full Name"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-green-600 focus:bg-white focus:ring-3 focus:ring-green-600/10"
            />
            {fieldErrors.full_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.full_name}</p>}
          </motion.div>

          {/* Email */}
          <motion.div variants={fadeUp}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-green-600 focus:bg-white focus:ring-3 focus:ring-green-600/10"
            />
            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
          </motion.div>

          {/* Phone (optional) */}
          <motion.div variants={fadeUp}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <div className="flex">
              <span className="flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 text-sm text-gray-500 font-medium select-none">
                +91
              </span>
              <input
                type="tel"
                name="phone"
                autoComplete="tel"
                placeholder="98765 43210"
                maxLength={10}
                className="flex-1 rounded-r-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-green-600 focus:bg-white focus:ring-3 focus:ring-green-600/10"
              />
            </div>
            {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
          </motion.div>

          {/* Password + strength */}
          <motion.div variants={fadeUp}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-green-600 focus:bg-white focus:ring-3 focus:ring-green-600/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Strength bar */}
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: strength.width === "w-1/3" ? "33%" : strength.width === "w-2/3" ? "66%" : "100%" }}
                    transition={{ duration: 0.3 }}
                    className={`h-full rounded-full ${strength.color}`}
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    strength.label === "Weak"
                      ? "text-red-500"
                      : strength.label === "Medium"
                      ? "text-amber-500"
                      : "text-green-600"
                  }`}
                >
                  {strength.label}
                </span>
              </div>
            )}
            {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
          </motion.div>

          {/* Terms */}
          <motion.div variants={fadeUp}>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  name="agreed"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition ${
                    agreed ? "border-green-600 bg-green-600" : "border-gray-300 bg-white group-hover:border-green-400"
                  }`}
                  style={{ width: 18, height: 18 }}
                >
                  {agreed && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-600 leading-snug">
                I agree to the{" "}
                <Link href="/terms" className="font-medium text-green-700 hover:text-green-800">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-green-700 hover:text-green-800">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {fieldErrors.agreed && <p className="text-xs text-red-500 mt-1">{fieldErrors.agreed}</p>}
          </motion.div>

          {/* Submit */}
          <motion.div variants={fadeUp}>
            <button
              type="submit"
              disabled={isPending || !agreed}
              className="w-full rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-3 focus:ring-green-600/30"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </motion.div>
        </form>

        {/* Divider */}
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </motion.div>

        {/* Google */}
        <motion.div variants={fadeUp}>
          <form action={async () => { await signInWithGoogle(); }}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] focus:outline-none focus:ring-3 focus:ring-gray-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
            </button>
          </form>
        </motion.div>

        {/* Login link */}
        <motion.p variants={fadeUp} className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-green-700 hover:text-green-800 transition">
            Sign in
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
