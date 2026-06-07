"use client";

import Link from "next/link";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, RefreshCw, AlertTriangle } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error("[TrekBooking Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        {/* Icon cluster */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center mb-8"
        >
          {/* Mountain silhouette with warning */}
          <div className="relative">
            <svg
              viewBox="0 0 200 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-56 mx-auto"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="errMtn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              {/* Background hills */}
              <path
                d="M0 120 L40 70 L80 95 L120 60 L160 85 L200 65 L200 140 L0 140Z"
                fill="#fde68a"
                opacity="0.5"
              />
              {/* Main mountain */}
              <path
                d="M10 135 L100 30 L190 135Z"
                fill="url(#errMtn)"
              />
              {/* Snow cap */}
              <path d="M100 30 L85 55 L115 55Z" fill="white" opacity="0.9" />
              {/* Foreground ground */}
              <path
                d="M0 130 Q100 115 200 130 L200 140 L0 140Z"
                fill="#d97706"
                opacity="0.4"
              />
            </svg>

            {/* Warning badge on top */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-200">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Error badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="inline-flex items-center gap-2 bg-amber-100 border border-amber-200 rounded-full px-4 py-1.5 mb-5"
        >
          <span className="text-amber-700 text-sm font-semibold tracking-wide">
            Oops — Something went wrong
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight"
        >
          Something Went Wrong
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-lg text-gray-500 mb-10 max-w-md mx-auto leading-relaxed"
        >
          Don&apos;t worry, even the best trekkers take a wrong turn sometimes.
          Let&apos;s get you back on track.
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm shadow-amber-200"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white hover:bg-amber-50 text-amber-700 font-semibold px-6 py-3 rounded-xl border border-amber-200 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </motion.div>

        {/* Error digest for debugging */}
        {error.digest && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            className="mt-10 text-xs text-gray-400 font-mono"
          >
            Error ID: {error.digest}
          </motion.p>
        )}
      </div>
    </div>
  );
}
