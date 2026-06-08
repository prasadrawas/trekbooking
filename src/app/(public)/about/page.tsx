"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  Mountain,
  Heart,
  ShieldCheck,
  Users,
  MapPin,
  ArrowRight,
  Leaf,
  Globe,
  Zap,
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
const STATS = [
  { icon: Users, value: "Verified", label: "Organizers", color: "text-emerald-600" },
  { icon: MapPin, value: "Curated", label: "Routes", color: "text-teal-600" },
  { icon: Zap, value: "Instant", label: "Booking", color: "text-amber-500" },
  { icon: ShieldCheck, value: "Safe &", label: "Secure", color: "text-blue-600" },
]

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Safety First",
    description:
      "Every organizer on TrekBooking is manually verified. We check certifications, equipment standards, and past safety records before they list a single trek.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Heart,
    title: "Trekker Delight",
    description:
      "From instant booking confirmations to 24/7 support on the trail, we obsess over every touchpoint in the trekker journey.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Leaf,
    title: "Responsible Trekking",
    description:
      "We promote Leave No Trace principles and partner only with organizers who respect the fragile ecosystems of the Sahyadris.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Globe,
    title: "Community Growth",
    description:
      "By empowering local organizers with technology, we help sustain livelihoods in rural Sahyadri communities while growing the trekking ecosystem.",
    color: "bg-purple-50 text-purple-600",
  },
]

const TEAM = [
  {
    name: "Prasad Rawas",
    role: "Leading Development",
    avatar: "PR",
    gradient: "from-emerald-500 to-teal-600",
    bio: "Full-stack developer building the platform from ground up.",
  },
  {
    name: "Suraj Shelke",
    role: "Leading Business Ops",
    avatar: "SS",
    gradient: "from-rose-500 to-pink-600",
    bio: "Managing organizer partnerships and business growth.",
  },
  {
    name: "Pratik",
    role: "Leading Business Ops",
    avatar: "P",
    gradient: "from-amber-500 to-orange-600",
    bio: "Operations and trekker community engagement.",
  },
]

const TIMELINE = [
  { year: "2026", event: "Founded in Pune with a mission to make trek booking seamless for both trekkers and organizers." },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-900 py-24 px-4">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6"
          >
            <Mountain className="w-4 h-4 text-emerald-300" />
            <span className="text-emerald-100 text-sm font-medium">Our Story</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight"
          >
            About{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
              TrekBooking
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed"
          >
            We started with a simple frustration — booking a Sahyadri trek should not require
            five WhatsApp messages and a prayer. So we built the platform we wished existed.
          </motion.p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Stats                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-6xl mx-auto px-4 -mt-10 relative z-10">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {STATS.map(({ icon: Icon, value, label, color }) => (
            <motion.div
              key={label}
              variants={itemFade}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center hover:shadow-md transition-shadow"
            >
              <Icon className={`w-7 h-7 mx-auto mb-3 ${color}`} />
              <p className="text-3xl font-black text-gray-900 mb-1">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Mission statement                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <blockquote className="text-2xl md:text-3xl font-light text-gray-700 leading-relaxed italic border-l-4 border-emerald-500 pl-6 text-left">
            "To make every Sahyadri summit accessible — by connecting passionate organizers with
            curious trekkers through technology that just works."
          </blockquote>
          <p className="mt-8 text-lg text-gray-600 leading-relaxed">
            The Sahyadri mountains are one of India's most spectacular trekking destinations, yet
            booking a trek here has historically been chaotic — WhatsApp groups, cash-only
            payments, last-minute cancellations. TrekBooking changes that. We&apos;re building the
            infrastructure that the Sahyadri trekking community deserves.
          </p>
        </motion.div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Values                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-3">What We Stand For</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Four principles guide every decision we make at TrekBooking.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {VALUES.map(({ icon: Icon, title, description, color }) => (
              <motion.div
                key={title}
                variants={itemFade}
                className="p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Timeline                                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Story</h2>
          <p className="text-gray-500">How TrekBooking began.</p>
        </motion.div>

        <div className="space-y-0">
          {TIMELINE.map((item, i) => (
            <motion.div
              key={item.year}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex gap-6"
            >
              {/* Timeline spine */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-md">
                  {item.year.slice(2)}
                </div>
                {i < TIMELINE.length - 1 && (
                  <div className="w-0.5 flex-1 bg-emerald-100 my-2" />
                )}
              </div>

              {/* Content */}
              <div className={`pb-8 pt-1.5 flex-1 ${i === TIMELINE.length - 1 ? "pb-0" : ""}`}>
                <p className="text-xs text-emerald-600 font-bold mb-1">{item.year}</p>
                <p className="text-gray-700 text-sm leading-relaxed">{item.event}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Team                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-3">The Team</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Trekkers, builders, and dreamers — united by a love for the Sahyadris.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {TEAM.map(({ name, role, avatar, gradient, bio }) => (
              <motion.div
                key={name}
                variants={itemFade}
                className="text-center group"
              >
                {/* Avatar */}
                <div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} text-white text-xl font-black flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-105 transition-transform`}
                >
                  {avatar}
                </div>
                <h3 className="font-bold text-gray-900 mb-0.5">{name}</h3>
                <p className="text-xs text-emerald-600 font-medium mb-2">{role}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{bio}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 px-4">
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center bg-gradient-to-br from-emerald-700 to-teal-700 rounded-3xl p-10 text-white"
        >
          <Mountain className="w-12 h-12 mx-auto mb-4 text-emerald-200" />
          <h2 className="text-2xl font-bold mb-3">Ready to Explore the Sahyadris?</h2>
          <p className="text-emerald-200 mb-6">
            Join our community of trekkers and discover the magic of the Western Ghats with
            TrekBooking.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/treks"
              className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 active:scale-95 transition-all"
            >
              Browse Treks
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/partner"
              className="inline-flex items-center gap-2 bg-emerald-600/50 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-emerald-600/70 active:scale-95 transition-all"
            >
              Become a Partner
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
