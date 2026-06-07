"use client";

import { useActionState, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { resetPassword } from "@/actions/auth";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0, 0, 0.58, 1] as [number, number, number, number] },
  }),
};

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetPassword, null);
  const [submitted, setSubmitted] = useState(false);

  async function handleAction(formData: FormData) {
    await formAction(formData);
    if (!state?.error) setSubmitted(true);
  }

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
        <span className="text-xl font-bold text-gray-900 tracking-tight">TrekBooking</span>
      </motion.div>

      <AnimatePresence mode="wait">
        {submitted && !state?.error ? (
          /* Success state */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0, 0, 0.58, 1] as [number, number, number, number] }}
            className="flex flex-col items-center text-center gap-5"
          >
            <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center">
              <Mail className="w-8 h-8 text-green-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                We&apos;ve sent a password reset link to your email address. It may take
                a minute to arrive.
              </p>
            </div>
            <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              Didn&apos;t get it? Check your spam folder, or{" "}
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="font-semibold underline hover:text-amber-900"
              >
                try again
              </button>
              .
            </div>
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </motion.div>
        ) : (
          /* Form state */
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Heading */}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
              <p className="text-sm text-gray-500 mt-1">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </motion.div>

            {/* Error alert */}
            {state?.error && (
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
                <p className="text-sm text-red-700">{state.error}</p>
              </motion.div>
            )}

            <form action={handleAction} className="flex flex-col gap-4">
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

              {/* Submit */}
              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-3 focus:ring-green-600/30"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Sending link…
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </motion.div>
            </form>

            {/* Back link */}
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="mt-6">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
