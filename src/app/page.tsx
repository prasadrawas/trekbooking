"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import {
  Search,
  CreditCard,
  Mountain,
  ShieldCheck,
  IndianRupee,
  Zap,
  Baby,
  Star,
  ArrowRight,
  Check,
  Users,
  Map,
  TrendingUp,
} from "lucide-react";
import { SearchBar } from "@/components/shared/search-bar";
import { TrekCard } from "@/components/trek/trek-card";
import { mapApiTrek } from "@/lib/trek-mapper";

// ─── Animation helpers ─────────────────────────────────────────────────────

// Cubic-bezier as a typed tuple so framer-motion v12 accepts it
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Returns inline motion props for a fade-up-from-hidden entrance */
function fadeUpProps(delay: number = 0) {
  return {
    initial: { opacity: 0, y: 32 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.6, ease: EASE_OUT, delay },
  };
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

// ─── Mock data ─────────────────────────────────────────────────────────────

const MOCK_TREKS = [
  {
    title: "Rajmachi Fort via Udhewadi",
    slug: "rajmachi-fort-udhewadi",
    cover_image: null,
    difficulty: "easy" as const,
    duration: 1,
    distance: 14,
    price: 799,
    rating: 4.7,
    total_reviews: 238,
    available_seats: 8,
    total_seats: 20,
    next_date: "2026-06-14",
    is_child_friendly: true,
    organizer_name: "Summit Seekers",
    region: "Rajmachi",
  },
  {
    title: "Harishchandragad Night Trek",
    slug: "harishchandragad-night",
    cover_image: null,
    difficulty: "difficult" as const,
    duration: 2,
    distance: 22,
    price: 2499,
    rating: 4.9,
    total_reviews: 175,
    available_seats: 4,
    total_seats: 15,
    next_date: "2026-06-21",
    is_child_friendly: false,
    organizer_name: "WildTrails Pune",
    region: "Harishchandragad",
  },
  {
    title: "Kalsubai Peak — Highest Point in Maharashtra",
    slug: "kalsubai-peak",
    cover_image: null,
    difficulty: "moderate" as const,
    duration: 1,
    distance: 18,
    price: 1299,
    rating: 4.6,
    total_reviews: 312,
    available_seats: 12,
    total_seats: 25,
    next_date: "2026-06-15",
    is_child_friendly: false,
    organizer_name: "Sahyadri Explorers",
    region: "Kalsubai",
  },
  {
    title: "Bhimashankar Forest Trek",
    slug: "bhimashankar-forest",
    cover_image: null,
    difficulty: "easy" as const,
    duration: 1,
    distance: 12,
    price: 999,
    rating: 4.5,
    total_reviews: 196,
    available_seats: 15,
    total_seats: 20,
    next_date: "2026-06-13",
    is_child_friendly: true,
    organizer_name: "GreenPath Adventures",
    region: "Bhimashankar",
  },
];

const TESTIMONIALS = [
  {
    name: "Ananya Deshmukh",
    location: "Pune, Maharashtra",
    trek: "Rajmachi Fort Trek",
    rating: 5,
    comment:
      "Booked through TrekBooking last minute and it was seamless. The organizer was professional, the route was stunning, and the entire payment process took under 2 minutes. Will definitely book again!",
    avatarLetter: "A",
    avatarColor: "bg-emerald-500",
  },
  {
    name: "Rohan Patil",
    location: "Mumbai, Maharashtra",
    trek: "Harishchandragad Night Trek",
    rating: 5,
    comment:
      "Finally a platform that verifies organizers! Went for the Harishchandragad night trek and the guide was excellent. Got WhatsApp confirmation within seconds of booking. Highly recommended.",
    avatarLetter: "R",
    avatarColor: "bg-blue-500",
  },
  {
    name: "Priya Joshi",
    location: "Nashik, Maharashtra",
    trek: "Bhimashankar Family Trek",
    rating: 5,
    comment:
      "Took my 8-year-old daughter on the Bhimashankar trek booked here. The child-friendly filter was a game-changer — found the perfect easy route. My daughter is already asking to go again!",
    avatarLetter: "P",
    avatarColor: "bg-violet-500",
  },
];

// ─── Animated counter ──────────────────────────────────────────────────────

function AnimatedCounter({
  target,
  prefix = "",
  suffix = "",
  duration = 2,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, {
    damping: 35,
    stiffness: 120,
    duration,
  });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isInView) motionVal.set(target);
  }, [isInView, motionVal, target]);

  useEffect(() => {
    const unsubscribe = springVal.on("change", (v) =>
      setDisplay(Math.round(v))
    );
    return unsubscribe;
  }, [springVal]);

  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

// ─── Section: Hero ─────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative min-h-svh flex flex-col justify-center overflow-hidden">
      {/* Background — layered gradient that suggests mountain landscape */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(160deg, #052e16 0%, #14532d 28%, #166534 50%, #15803d 68%, #1e3a2f 100%)",
        }}
      />

      {/* Subtle topographic pattern overlay */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cellipse cx='50' cy='50' rx='40' ry='20' fill='none' stroke='white' stroke-width='1'/%3E%3Cellipse cx='50' cy='50' rx='30' ry='14' fill='none' stroke='white' stroke-width='1'/%3E%3Cellipse cx='50' cy='50' rx='20' ry='8' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: "120px 120px",
        }}
      />

      {/* Mountain silhouette at the bottom */}
      <div
        aria-hidden
        className="absolute bottom-0 inset-x-0 -z-10 h-48 opacity-20"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
        }}
      />
      <svg
        aria-hidden
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        className="absolute bottom-0 inset-x-0 w-full h-44 -z-10 opacity-30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 220L120 160L240 180L360 100L480 140L560 80L680 130L760 60L880 110L960 50L1080 100L1200 70L1320 120L1440 90V220H0Z"
          fill="rgba(0,0,0,0.35)"
        />
        <path
          d="M0 220L80 190L200 200L320 150L440 170L560 110L680 150L800 90L920 130L1040 80L1160 120L1280 100L1440 140V220H0Z"
          fill="rgba(0,0,0,0.2)"
        />
      </svg>

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-20 flex flex-col items-center text-center">
        {/* Badge */}
        <motion.div {...fadeUpProps(0)}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-emerald-200 backdrop-blur-sm mb-8">
            <TrendingUp className="h-3.5 w-3.5" />
            Curated Trek Routes. Verified Organizers. Instant Booking.
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          {...fadeUpProps(0.1)}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight max-w-4xl"
        >
          Discover Weekend Treks
          <br />
          <span className="text-emerald-300">in the Sahyadris</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          {...fadeUpProps(0.22)}
          className="mt-6 text-lg sm:text-xl text-white/75 max-w-2xl leading-relaxed"
        >
          Book verified treks near Pune.{" "}
          <span className="text-white/90 font-medium">Pay online.</span> Just
          show up.
        </motion.p>

        {/* Search bar */}
        <motion.div
          {...fadeUpProps(0.34)}
          className="mt-10 w-full max-w-5xl px-4"
        >
          <SearchBar />
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
        >
          {[
            { value: 0, suffix: "", label: "Verified Organizers", icon: Users, staticText: "Verified" },
            { value: 0, suffix: "", label: "Curated Routes", icon: Map, staticText: "Curated" },
            { value: 799, prefix: "₹", label: "Starting Price", icon: IndianRupee },
          ].map(({ value, suffix, prefix, label, icon: Icon, staticText }) => (
            <motion.div
              key={label}
              variants={staggerItem}
              className="flex flex-col items-center gap-1"
            >
              <div className="flex items-baseline gap-1">
                <Icon className="h-4 w-4 text-emerald-300 mb-0.5 mr-0.5 self-center" />
                <span className="text-3xl sm:text-4xl font-extrabold text-white">
                  {staticText ? staticText : (
                    <AnimatedCounter
                      target={value}
                      prefix={prefix}
                      suffix={suffix}
                    />
                  )}
                </span>
              </div>
              <span className="text-xs sm:text-sm text-white/60 font-medium">
                {label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
      >
        <span className="text-white/40 text-xs tracking-widest uppercase">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: [0.42, 0, 0.58, 1] as [number, number, number, number] }}
          className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent"
        />
      </motion.div>
    </section>
  );
}

// ─── Section: Trending Treks ───────────────────────────────────────────────

function TrendingTreksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [treks, setTreks] = useState(MOCK_TREKS);

  useEffect(() => {
    fetch("/api/treks?limit=4")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.treks?.length > 0) {
          setTreks(data.treks.map(mapApiTrek));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-20 sm:py-28 bg-white" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12"
        >
          <div>
            <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
              Popular picks
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Trending This Weekend
            </h2>
          </div>
          <Link
            href="/treks"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors group"
          >
            View All Treks
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {treks.map((trek) => (
            <motion.div key={trek.slug} variants={staggerItem}>
              <TrekCard trek={trek} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section: How It Works ─────────────────────────────────────────────────

const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    icon: Search,
    title: "Discover",
    description:
      "Browse verified trek routes across the Sahyadris. Filter by difficulty, region, date, and group size.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    number: "02",
    icon: CreditCard,
    title: "Book & Pay",
    description:
      "Secure your spot with instant online payment via Razorpay. Your seat is confirmed the moment you pay.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    number: "03",
    icon: Mountain,
    title: "Trek!",
    description:
      "Show up at the meeting point with your booking confirmation. Gear up and enjoy the Sahyadris.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
];

function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-20 sm:py-28 bg-slate-50" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
            Simple as 1-2-3
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
            From discovery to the trailhead, we&apos;ve made every step frictionless.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting dotted line — desktop only */}
          <div
            aria-hidden
            className="hidden lg:block absolute top-14 left-[calc(16.6667%+1.5rem)] right-[calc(16.6667%+1.5rem)] h-px border-t-2 border-dashed border-emerald-200"
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16 relative"
          >
            {HOW_IT_WORKS_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  variants={staggerItem}
                  className="flex flex-col items-center text-center gap-5"
                >
                  {/* Number + icon stack */}
                  <div className="relative">
                    <div
                      className={`w-28 h-28 rounded-full ${step.bg} border-2 ${step.border} flex items-center justify-center`}
                    >
                      <Icon className={`w-10 h-10 ${step.color}`} strokeWidth={1.5} />
                    </div>
                    <span
                      className={`absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border-2 ${step.border} flex items-center justify-center text-[11px] font-bold ${step.color}`}
                    >
                      {step.number}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Section: Why TrekBooking ─────────────────────────────────────────────

const WHY_FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified Organizers",
    description:
      "Every organizer on the platform is manually verified. Trek with complete confidence knowing your safety is our priority.",
    gradient: "from-emerald-500/10 to-emerald-600/5",
    iconColor: "text-emerald-600",
    borderColor: "border-emerald-200/60 hover:border-emerald-400/60",
  },
  {
    icon: IndianRupee,
    title: "No No-Shows",
    description:
      "Pay online to secure your seat. No payment, no booking — eliminating last-minute cancellations for good.",
    gradient: "from-blue-500/10 to-blue-600/5",
    iconColor: "text-blue-600",
    borderColor: "border-blue-200/60 hover:border-blue-400/60",
  },
  {
    icon: Zap,
    title: "Instant Confirmation",
    description:
      "Your booking is confirmed instantly after payment. View details in your dashboard — no waiting, no uncertainty.",
    gradient: "from-amber-500/10 to-amber-600/5",
    iconColor: "text-amber-600",
    borderColor: "border-amber-200/60 hover:border-amber-400/60",
  },
  {
    icon: Baby,
    title: "Child-Friendly Filter",
    description:
      "Dedicated filter to find treks perfect for kids. Let the whole family experience the magic of the Sahyadris.",
    gradient: "from-violet-500/10 to-violet-600/5",
    iconColor: "text-violet-600",
    borderColor: "border-violet-200/60 hover:border-violet-400/60",
  },
];

function WhyTrekBookingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-20 sm:py-28 bg-white" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
            Why trekkers love us
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
            Why TrekBooking
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
            We built the platform trekkers and organizers both deserve.
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {WHY_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={staggerItem}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className={`group relative rounded-2xl border bg-gradient-to-br ${feature.gradient} ${feature.borderColor} p-6 flex flex-col gap-4 cursor-default transition-colors duration-200`}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center ${feature.iconColor}`}
                >
                  <Icon className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base font-bold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section: Become a Partner CTA ────────────────────────────────────────

const PARTNER_BULLETS = [
  "Free listing — no setup fees ever",
  "Only 10% commission per booking",
  "Payments transferred within 3 days",
  "Manage bookings from your dashboard",
  "First 3 months with zero commission",
];

function PartnerCTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden" ref={ref}>
      {/* Green gradient background */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, #052e16 0%, #14532d 40%, #166534 70%, #15803d 100%)",
        }}
      />

      {/* Texture overlay */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='1.5' fill='white'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: content */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="flex flex-col gap-6"
          >
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-emerald-200">
              For Organizers
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Are You a Trek
              <br />
              Organizer?
            </h2>

            <p className="text-lg text-white/70 leading-relaxed max-w-md">
              Grow your trekking business with TrekBooking. Reach thousands of
              adventure-seekers in Pune and Maharashtra with zero upfront cost.
            </p>

            <ul className="flex flex-col gap-3">
              {PARTNER_BULLETS.map((point) => (
                <li key={point} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-300" />
                  </span>
                  <span className="text-white/80 text-sm">{point}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 mt-2">
              <Link
                href="/partner"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-700 shadow-lg hover:bg-emerald-50 active:scale-95 transition-all duration-150"
              >
                Partner With Us
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/partner"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 active:scale-95 transition-all duration-150"
              >
                Learn More
              </Link>
            </div>
          </motion.div>

          {/* Right: stats visual */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.15 }}
            className="hidden lg:flex flex-col gap-5"
          >
            {[
              { label: "Commission", value: "10%", sub: "only — first 3 months free" },
              { label: "Setup Cost", value: "₹0", sub: "free listing, no hidden charges" },
              { label: "Payout Speed", value: "3 Days", sub: "after trek completion" },
              { label: "Platform", value: "24/7", sub: "online booking & dashboard" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: EASE_OUT }}
                className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs text-white/50 font-medium">{stat.label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{stat.sub}</p>
                </div>
                <span className="text-2xl font-extrabold text-white">
                  {stat.value}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Section: Testimonials ─────────────────────────────────────────────────

function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-20 sm:py-28 bg-slate-50" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
            Trekker experiences
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
            What Trekkers Love
          </h2>
        </motion.div>

        {/* Cards — horizontal scroll on mobile, grid on desktop */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0 -mx-4 px-4 md:mx-0 md:px-0"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={staggerItem}
              className="snap-start shrink-0 w-[85vw] sm:w-[70vw] md:w-auto rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col gap-4"
            >
              {/* Rating */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < t.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-200 fill-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Comment */}
              <p className="text-sm text-slate-600 leading-relaxed flex-1">
                &ldquo;{t.comment}&rdquo;
              </p>

              {/* Trek tag */}
              <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                {t.trek}
              </span>

              {/* Author */}
              <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                <div
                  className={`w-9 h-9 rounded-full ${t.avatarColor} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}
                >
                  {t.avatarLetter}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Bottom CTA strip ──────────────────────────────────────────────────────

function BottomCTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-20 bg-white" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <Mountain className="w-8 h-8 text-emerald-600" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Ready to Hit the Trail?
        </h2>
        <p className="text-lg text-slate-500 max-w-md">
          Explore the Sahyadri mountains with verified organizers every
          weekend. Your next adventure is one click away.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/treks"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition-all duration-150"
          >
            Explore All Treks
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-7 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all duration-150"
          >
            Create Free Account
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

// ─── JSON-LD structured data ───────────────────────────────────────────────

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TrekBooking",
  url: "https://trekbooking.in",
  logo: "https://trekbooking.in/icon.svg",
  description:
    "TrekBooking is a platform for booking verified weekend treks in the Sahyadri mountains near Pune. Curated trek routes, verified organizers, instant online payment.",
  foundingLocation: {
    "@type": "Place",
    name: "Pune, Maharashtra, India",
  },
  areaServed: {
    "@type": "Place",
    name: "Sahyadri Mountains, Maharashtra, India",
  },
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "trekbooking.in@gmail.com",
    availableLanguage: ["English", "Hindi", "Marathi"],
  },
};

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TrekBooking",
  url: "https://trekbooking.in",
  description:
    "Book verified weekend treks in the Sahyadri mountains near Pune. Curated routes, instant payment.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://trekbooking.in/treks?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const SITELINKS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: [
    {
      "@type": "SiteNavigationElement",
      position: 1,
      name: "Explore Treks",
      description: "Browse and book verified weekend treks near Pune",
      url: "https://trekbooking.in/treks",
    },
    {
      "@type": "SiteNavigationElement",
      position: 2,
      name: "About Us",
      description: "Learn about TrekBooking and our mission",
      url: "https://trekbooking.in/about",
    },
    {
      "@type": "SiteNavigationElement",
      position: 3,
      name: "Partner With Us",
      description: "List your treks on TrekBooking — grow your business",
      url: "https://trekbooking.in/partner",
    },
    {
      "@type": "SiteNavigationElement",
      position: 4,
      name: "Contact",
      description: "Get in touch with the TrekBooking team",
      url: "https://trekbooking.in/contact",
    },
    {
      "@type": "SiteNavigationElement",
      position: 5,
      name: "Sign Up",
      description: "Create your free TrekBooking account",
      url: "https://trekbooking.in/signup",
    },
    {
      "@type": "SiteNavigationElement",
      position: 6,
      name: "Login",
      description: "Sign in to your TrekBooking account",
      url: "https://trekbooking.in/login",
    },
  ],
};

// ─── Page root ─────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SITELINKS_SCHEMA) }}
      />
      <HeroSection />
      <TrendingTreksSection />
      <HowItWorksSection />
      <WhyTrekBookingSection />
      <PartnerCTASection />
      <TestimonialsSection />
      <BottomCTASection />
    </>
  );
}
