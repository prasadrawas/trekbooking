"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Clock,
  MessageCircle,
  CheckCircle2,
  Mountain,
  ChevronDown,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
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
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const CONTACT_INFO = [
  {
    icon: Mail,
    label: "Email Us",
    value: "trekbooking.in@gmail.com",
    sublabel: "We'll get back to you soon",
    href: "mailto:trekbooking.in@gmail.com",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Phone,
    label: "Call / WhatsApp",
    value: "+91 7020845256",
    sublabel: "Mon–Sat, 9 AM – 7 PM",
    href: "tel:+917020845256",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: MapPin,
    label: "Visit Us",
    value: "Baner, Pune",
    sublabel: "Maharashtra 411045",
    href: "https://maps.google.com/?q=Baner,Pune,Maharashtra,411045",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: Clock,
    label: "Support Hours",
    value: "Mon–Sat",
    sublabel: "9:00 AM – 7:00 PM IST",
    href: null,
    color: "bg-purple-50 text-purple-600",
  },
]

const SUBJECTS = [
  "General Enquiry",
  "Booking Help",
  "Cancellation / Refund",
  "Organizer Partnership",
  "Technical Issue",
  "Media / Press",
  "Other",
]

const FAQS = [
  {
    q: "How do I cancel a booking?",
    a: "Log into your account, go to My Bookings, and click Cancel. Refunds are processed within 5–7 business days. Free cancellation is available up to 72 hours before the trek.",
  },
  {
    q: "How do I become a trek organizer?",
    a: "Visit our Partner page and fill out the application form. Our team will reach out within 1 business day to complete verification.",
  },
  {
    q: "Is my payment secure?",
    a: "Yes. All payments are processed via Razorpay with 256-bit SSL encryption. We never store your card details.",
  },
  {
    q: "What if a trek gets cancelled by the organizer?",
    a: "You'll receive a full refund within 48 hours if the organizer cancels. We also help you find an alternative trek.",
  },
]

// ---------------------------------------------------------------------------
// FAQ item component
// ---------------------------------------------------------------------------
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden hover:border-emerald-200 transition-colors">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full px-5 py-4 text-left"
      >
        <span className="font-semibold text-gray-900 text-sm pr-4">{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </motion.span>
      </button>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50"
        >
          <p className="pt-3">{a}</p>
        </motion.div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Input field helper
// ---------------------------------------------------------------------------
const inputCls =
  "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white"

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-800 py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-8 w-40 h-40 rounded-full border-4 border-white" />
          <div className="absolute bottom-8 right-8 w-64 h-64 rounded-full border-4 border-white" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-5">
            <MessageCircle className="w-4 h-4 text-emerald-300" />
            <span className="text-emerald-100 text-sm font-medium">We&apos;re Here to Help</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Get in Touch
          </h1>
          <p className="text-emerald-200 text-lg max-w-xl mx-auto">
            Have a question about a booking, an organizer partnership, or just want to say hi?
            Reach us via email or WhatsApp and we&apos;ll get back to you soon.
          </p>
        </motion.div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Main Content                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* ===== LEFT: Contact Info ===== */}
          <div className="space-y-5">
            {/* Contact cards */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {CONTACT_INFO.map(({ icon: Icon, label, value, sublabel, href, color }) => (
                <motion.div key={label} variants={itemFade}>
                  {href ? (
                    <a
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors">
                          {value}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                        <p className="font-semibold text-gray-900 text-sm">{value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>

            {/* Map placeholder */}
            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="h-48 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center relative">
                <div className="text-center">
                  <Mountain className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-emerald-600 font-medium">Baner, Pune</p>
                  <p className="text-xs text-gray-400 mt-1">Maharashtra 411045</p>
                </div>
                {/* Grid lines for map feel */}
                <div className="absolute inset-0 opacity-20">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={`h${i}`}
                      className="absolute w-full border-t border-emerald-300"
                      style={{ top: `${(i + 1) * 12.5}%` }}
                    />
                  ))}
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={`v${i}`}
                      className="absolute h-full border-l border-emerald-300"
                      style={{ left: `${(i + 1) * 12.5}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="p-3 text-center">
                <a
                  href="https://maps.google.com/?q=Baner,Pune,Maharashtra,411045"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-700 font-semibold hover:underline"
                >
                  Open in Google Maps →
                </a>
              </div>
            </motion.div>

          </div>

          {/* ===== RIGHT: Contact Form (spans 2 cols) ===== */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact form */}
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8"
            >
              {!submitted ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Send Us a Message</h2>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-800 block mb-1.5">
                          Your Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your Name"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-800 block mb-1.5">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-800 block mb-1.5">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className={`${inputCls} text-gray-700`}
                      >
                        <option value="">Select a topic...</option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-800 block mb-1.5">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us how we can help you..."
                        className={`${inputCls} resize-none`}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Message
                    </button>

                    <p className="text-xs text-gray-400 text-center">
                      We&apos;ll get back to you soon. No spam — just help.
                    </p>
                  </form>
                </>
              ) : (
                // Success state
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Thanks for reaching out!</h3>
                  <p className="text-gray-600 max-w-sm mx-auto mb-6">
                    Thank you! Please email us directly at{" "}
                    <strong>trekbooking.in@gmail.com</strong> for a faster response. We&apos;re
                    working on enabling this form.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false)
                      setName("")
                      setEmail("")
                      setSubject("")
                      setMessage("")
                    }}
                    className="text-sm text-emerald-700 font-semibold hover:underline"
                  >
                    Send another message
                  </button>
                </motion.div>
              )}
            </motion.div>

            {/* FAQ */}
            <motion.div
              custom={2}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-5">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {FAQS.map((faq) => (
                  <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
