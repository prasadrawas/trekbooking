"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Compass } from "lucide-react";

// Mountain SVG illustration
function MountainIllustration() {
  return (
    <svg
      viewBox="0 0 400 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-sm mx-auto"
      aria-hidden="true"
    >
      {/* Sky gradient background */}
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d1fae5" />
          <stop offset="100%" stopColor="#f0fdf4" />
        </linearGradient>
        <linearGradient id="mountainBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="mountainFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="400" height="220" fill="url(#skyGrad)" rx="16" />

      {/* Distant mountain range */}
      <path
        d="M0 180 L60 100 L120 140 L180 80 L240 130 L300 90 L360 120 L400 100 L400 220 L0 220Z"
        fill="url(#mountainBack)"
        opacity="0.5"
      />

      {/* Main mountain left */}
      <path
        d="M20 200 L130 70 L180 130 L240 200Z"
        fill="url(#mountainFront)"
      />

      {/* Main mountain right (slightly behind) */}
      <path
        d="M220 200 L310 85 L400 200Z"
        fill="#047857"
        opacity="0.85"
      />

      {/* Snow cap left peak */}
      <path d="M130 70 L115 95 L145 95Z" fill="white" opacity="0.9" />

      {/* Snow cap right peak */}
      <path d="M310 85 L297 108 L323 108Z" fill="white" opacity="0.9" />

      {/* Clouds */}
      <ellipse cx="70" cy="55" rx="30" ry="12" fill="white" opacity="0.8" />
      <ellipse cx="90" cy="50" rx="22" ry="10" fill="white" opacity="0.8" />
      <ellipse cx="55" cy="52" rx="18" ry="8" fill="white" opacity="0.7" />

      <ellipse cx="320" cy="42" rx="28" ry="11" fill="white" opacity="0.75" />
      <ellipse cx="340" cy="37" rx="20" ry="9" fill="white" opacity="0.75" />

      {/* Question mark path on mountain */}
      <text
        x="128"
        y="145"
        textAnchor="middle"
        fontSize="28"
        fontWeight="bold"
        fill="white"
        opacity="0.7"
        fontFamily="sans-serif"
      >
        ?
      </text>

      {/* Foreground hills */}
      <path
        d="M0 200 Q100 170 200 195 Q300 215 400 195 L400 220 L0 220Z"
        fill="#064e3b"
      />
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        {/* Mountain illustration */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <MountainIllustration />
        </motion.div>

        {/* 404 badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 rounded-full px-4 py-1.5 mb-5"
        >
          <span className="text-emerald-700 text-sm font-semibold tracking-wide">
            404 — Trail Not Found
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight"
        >
          Trail Not Found
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-lg text-gray-500 mb-10 max-w-md mx-auto leading-relaxed"
        >
          The trek you&apos;re looking for seems to have gone off-trail. Maybe
          it was moved, renamed, or never existed in the first place.
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm shadow-emerald-200"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/treks"
            className="inline-flex items-center gap-2 bg-white hover:bg-emerald-50 text-emerald-700 font-semibold px-6 py-3 rounded-xl border border-emerald-200 transition-colors"
          >
            <Compass className="w-4 h-4" />
            Explore Treks
          </Link>
        </motion.div>

        {/* Decorative divider */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-12 text-xs text-gray-400"
        >
          TrekBooking &mdash; Every trail has a story. This one&apos;s still
          unwritten.
        </motion.p>
      </div>
    </div>
  );
}
