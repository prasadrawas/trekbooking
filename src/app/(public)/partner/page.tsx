"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  BarChart3,
  MessageSquareOff,
  UserX,
  EyeOff,
  ClipboardX,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  IndianRupee,
  CalendarDays,
  Smartphone,
  LayoutDashboard,
  HeartHandshake,
  Rocket,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
}

const itemFade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const PAIN_POINTS = [
  {
    icon: MessageSquareOff,
    title: "WhatsApp Chaos",
    description:
      "Managing bookings through 47 different WhatsApp chats with participants texting at 11 PM to confirm their seat.",
    color: "bg-red-50 border-red-100 text-red-600",
  },
  {
    icon: UserX,
    title: "Last-Minute No-Shows",
    description:
      "Participants who confirmed verbally just... don't show up. Your vehicle leaves half-empty with real financial loss.",
    color: "bg-orange-50 border-orange-100 text-orange-600",
  },
  {
    icon: EyeOff,
    title: "Zero Online Visibility",
    description:
      "Your best treks are invisible to the thousands of Puneites searching online every weekend for what you offer.",
    color: "bg-amber-50 border-amber-100 text-amber-600",
  },
  {
    icon: ClipboardX,
    title: "Manual Everything",
    description:
      "Tracking payments in Excel, sending bank account numbers over text, chasing UPI receipts — hours of admin every week.",
    color: "bg-yellow-50 border-yellow-100 text-yellow-600",
  },
]

const SOLUTIONS = [
  {
    icon: Smartphone,
    title: "Online Booking Page",
    description: "Your own branded page on TrekBooking. Participants book in 60 seconds with instant payment.",
  },
  {
    icon: LayoutDashboard,
    title: "Organizer Dashboard",
    description: "Real-time manifest, seat tracking, revenue analytics, and participant contact — all in one place.",
  },
  {
    icon: Zap,
    title: "Instant Settlements",
    description: "Payments hit your bank account 3 days after trek completion. No chasing, no delays.",
  },
  {
    icon: BarChart3,
    title: "Growth Analytics",
    description: "See which treks get the most views, which dates fill fastest, and where your bookings come from.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Badge",
    description: "Stand out with a TrekBooking Verified badge that builds instant trust with new participants.",
  },
  {
    icon: HeartHandshake,
    title: "Dedicated Support",
    description: "A dedicated organizer success manager who helps you set up, optimize, and grow your listings.",
  },
]

const STEPS = [
  {
    number: "01",
    title: "Apply Online",
    description: "Fill our short application form. Tell us about your treks and experience.",
    icon: Rocket,
  },
  {
    number: "02",
    title: "Verification",
    description: "Our team reviews your certifications, equipment, and safety protocols. Usually 2–3 days.",
    icon: ShieldCheck,
  },
  {
    number: "03",
    title: "List Your Treks",
    description: "Add your first trek with dates, prices, and pickup points. We help you write a great listing.",
    icon: CalendarDays,
  },
  {
    number: "04",
    title: "Start Earning",
    description: "Go live and start receiving bookings. Your first 3 months are completely commission-free.",
    icon: IndianRupee,
  },
]

// Revenue calculator data
const CALC_DATA = [
  { bookings: 10, revenue: 14990, commission: 0, payout: 14990, label: "Getting Started" },
  { bookings: 25, revenue: 37475, commission: 0, payout: 37475, label: "Growing Fast" },
  { bookings: 50, revenue: 74950, commission: 7495, payout: 67455, label: "Established" },
  { bookings: 100, revenue: 149900, commission: 14990, payout: 134910, label: "Top Organizer" },
]


// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function PartnerPage() {
  const [monthlyTreks, setMonthlyTreks] = useState(2)
  const [avgParticipants, setAvgParticipants] = useState(15)
  const [avgPrice, setAvgPrice] = useState(1499)

  const grossRevenue = monthlyTreks * avgParticipants * avgPrice
  const commission = grossRevenue * 0.1
  const netPayout = grossRevenue - commission
  const annualPayout = netPayout * 12

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-800 pt-20 pb-28 px-4">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-emerald-300/10 blur-3xl -translate-x-1/3 translate-y-1/3" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6"
          >
            <TrendingUp className="w-4 h-4 text-emerald-300" />
            <span className="text-emerald-100 text-sm font-medium">For Trek Organizers</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight"
          >
            Grow Your Trek
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
              Business
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xl md:text-2xl text-emerald-100 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Stop managing bookings on WhatsApp. List your treks on TrekBooking and grow
            your trekking business in Pune.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="#apply"
              className="inline-flex items-center gap-2 bg-white text-emerald-800 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-emerald-50 active:scale-95 transition-all shadow-xl shadow-black/20"
            >
              Get Started Today — It&apos;s Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-emerald-200 font-semibold hover:text-white transition-colors text-sm"
            >
              See how it works
              <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Problem Section                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sound Familiar?
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">
            Every trek organizer in Pune is fighting the same battles. We know because we
            talked to all of you.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {PAIN_POINTS.map(({ icon: Icon, title, description, color }) => (
            <motion.div
              key={title}
              variants={itemFade}
              className={`p-6 rounded-2xl border-2 ${color}`}
            >
              <Icon className="w-8 h-8 mb-4" />
              <h3 className="font-bold text-gray-900 text-base mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Solution Section                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
              The Solution
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run a Modern Trek Business
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              TrekBooking replaces spreadsheets, WhatsApp groups, and manual bank transfers
              with a single, beautiful platform.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {SOLUTIONS.map(({ icon: Icon, title, description }) => (
              <motion.div
                key={title}
                variants={itemFade}
                className="flex gap-4 p-5 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Revenue Calculator                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Calculate Your Earnings
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            See exactly how much you could earn on TrekBooking.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Sliders */}
          <motion.div
            custom={1}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6"
          >
            <h3 className="font-bold text-gray-900 text-lg">Your Trek Numbers</h3>

            {[
              {
                label: "Treks per month",
                value: monthlyTreks,
                min: 1,
                max: 8,
                step: 1,
                unit: "treks",
                onChange: setMonthlyTreks,
              },
              {
                label: "Avg participants per trek",
                value: avgParticipants,
                min: 5,
                max: 40,
                step: 5,
                unit: "people",
                onChange: setAvgParticipants,
              },
              {
                label: "Average ticket price",
                value: avgPrice,
                min: 500,
                max: 3000,
                step: 250,
                unit: "₹",
                onChange: setAvgPrice,
              },
            ].map(({ label, value, min, max, step, unit, onChange }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className="font-bold text-emerald-700">
                    {unit === "₹" ? `₹${value.toLocaleString("en-IN")}` : `${value} ${unit}`}
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onChange={(e) => onChange(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{unit === "₹" ? `₹${min.toLocaleString("en-IN")}` : min}</span>
                  <span>{unit === "₹" ? `₹${max.toLocaleString("en-IN")}` : max}</span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Results */}
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-br from-emerald-700 to-teal-700 rounded-2xl p-6 text-white">
              <p className="text-emerald-200 text-sm mb-2">Monthly Gross Revenue</p>
              <motion.p
                key={grossRevenue}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                className="text-4xl font-black mb-1"
              >
                ₹{grossRevenue.toLocaleString("en-IN")}
              </motion.p>
              <p className="text-emerald-300 text-xs">
                {monthlyTreks} treks × {avgParticipants} participants × ₹{avgPrice.toLocaleString("en-IN")}
              </p>

              <div className="border-t border-white/20 my-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-200">Platform commission (10%)</span>
                  <span className="font-semibold">−₹{commission.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Your Monthly Payout</span>
                  <span className="text-xl">₹{netPayout.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-3 text-center mt-2">
                <p className="text-xs text-emerald-200 mb-1">Annual Earning Potential</p>
                <p className="text-2xl font-black">₹{annualPayout.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Comparison table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h4 className="font-bold text-gray-900 text-sm mb-4 uppercase tracking-wide">
                Earnings at Different Scales
              </h4>
              <div className="space-y-0 divide-y divide-gray-50">
                {CALC_DATA.map((row) => (
                  <div key={row.bookings} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {row.bookings} bookings/month
                      </p>
                      <p className="text-xs text-emerald-600">{row.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        ₹{row.payout.toLocaleString("en-IN")}/mo
                      </p>
                      {row.commission === 0 && (
                        <p className="text-xs text-emerald-500">0% commission*</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                *First 3 months are commission-free (time-based) for all new organizers.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How It Works                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section id="how-it-works" className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get Listed in 4 Steps
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              From application to first booking — most organizers go live within a week.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ number, title, description, icon: Icon }, i) => (
              <motion.div
                key={number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="text-center"
              >
                <div className="relative inline-flex mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>

                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Partnership Terms                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Partnership Terms</h2>

          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            {[
              {
                value: "₹0",
                label: "Setup Fee",
                sublabel: "No upfront cost ever",
                color: "text-emerald-400",
              },
              {
                value: "3 Months",
                label: "Free Period",
                sublabel: "Zero commission to start",
                color: "text-teal-300",
              },
              {
                value: "10%",
                label: "Commission",
                sublabel: "Only after free period",
                color: "text-amber-300",
              },
            ].map(({ value, label, sublabel, color }) => (
              <div key={label} className="text-center p-5 rounded-2xl bg-white/5 border border-white/10">
                <p className={`text-4xl font-black mb-1 ${color}`}>{value}</p>
                <p className="font-semibold text-white text-sm">{label}</p>
                <p className="text-white/50 text-xs mt-1">{sublabel}</p>
              </div>
            ))}
          </div>

          <ul className="space-y-3 mb-8">
            {[
              "Payouts within 3 days of trek completion",
              "Cancel anytime — no lock-in contracts",
              "Dedicated organizer success manager",
              "Free photography tips and listing optimization",
              "Priority support during trek days",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Founding Organizers CTA                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center bg-emerald-50 border border-emerald-200 rounded-3xl p-10"
          >
            <HeartHandshake className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Be Among Our Founding Organizers
            </h2>
            <p className="text-gray-600 text-lg">
              Be among our founding organizers and shape the platform. Your feedback directly
              influences how TrekBooking is built.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA / Application                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section id="apply" className="py-20 px-4">
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Ready to Grow Your Trek Business?
            </h2>
            <p className="text-gray-600 text-lg">
              Apply takes 3 minutes. Free setup. No contracts. Your first 3 months are on us.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-800 block mb-1.5">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-800 block mb-1.5">
                  Organisation Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Your organisation name"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-800 block mb-1.5">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="+91 7020845256"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-800 block mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-800 block mb-1.5">
                How many treks do you run per month?
              </label>
              <select className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700">
                <option value="">Select...</option>
                <option>1–2 treks</option>
                <option>3–5 treks</option>
                <option>6–10 treks</option>
                <option>10+ treks</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-800 block mb-1.5">
                Tell us about your treks
              </label>
              <textarea
                rows={3}
                placeholder="Describe the treks you run, regions covered, years of experience..."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <button
              type="button"
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-4 rounded-2xl text-base transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
            >
              Submit Application
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-xs text-gray-400 text-center">
              Our team will reach out within 1 business day. No spam, ever.
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
