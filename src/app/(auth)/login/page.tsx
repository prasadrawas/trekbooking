"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { signIn, signInWithGoogle } from "@/actions/auth";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0, 0, 0.58, 1] as [number, number, number, number] },
  }),
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(signIn, null);
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = searchParams.get("redirect") ?? "";
  const urlError = searchParams.get("error");

  const errorMessage =
    state?.error ??
    (urlError === "auth_failed" ? "Authentication failed. Please try again." : null);

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="flex items-center gap-2.5 mb-8"
      >
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
        <span className="text-xl font-bold text-gray-900 tracking-tight">
          TrekBooking
        </span>
      </motion.div>

      {/* Heading */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
      </motion.div>

      {/* Error alert */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
        >
          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-700">{errorMessage}</p>
        </motion.div>
      )}

      {/* Form */}
      <form action={formAction} className="flex flex-col gap-4">
        {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
        {/* Email */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email address
          </label>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-green-600 focus:bg-white focus:ring-3 focus:ring-green-600/10"
          />
        </motion.div>

        {/* Password */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-green-700 hover:text-green-800 transition"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
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
        </motion.div>

        {/* Submit */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-3 focus:ring-green-600/30 mt-1"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </motion.div>
      </form>

      {/* Divider */}
      <motion.div
        custom={5}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="flex items-center gap-3 my-5"
      >
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or continue with</span>
        <div className="flex-1 h-px bg-gray-200" />
      </motion.div>

      {/* Google sign-in */}
      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show">
        <form action={async () => { await signInWithGoogle(); }}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] focus:outline-none focus:ring-3 focus:ring-gray-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </form>
      </motion.div>

      {/* Sign up link */}
      <motion.p
        custom={7}
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="text-center text-sm text-gray-500 mt-6"
      >
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-green-700 hover:text-green-800 transition">
          Sign up
        </Link>
      </motion.p>
    </div>
  );
}
