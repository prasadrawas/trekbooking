"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Timer,
  Plus,
  Minus,
  User,
  Mail,
  Phone,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  ChevronRight,
  Loader2,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Mock data (fallback)
// ---------------------------------------------------------------------------
const TREK_EVENT = {
  title: "Rajgad Fort Trek",
  slug: "rajgad-fort-trek",
  date: "14 Jun 2026",
  day: "Sat–Sun",
  reportingTime: "10:00 PM, 13 Jun",
  adultPrice: 1499,
  childPrice: 999,
  is_child_friendly: false,
  availableSeats: 8,
  totalSeats: 20,
  coverImage: null as string | null,
  pickupPoints: [
    { id: "swargate", name: "Swargate Bus Stand", time: "10:00 PM", extraCharge: 0 },
    { id: "katraj", name: "Katraj Chowk", time: "10:20 PM", extraCharge: 0 },
    { id: "chandni", name: "Chandni Chowk", time: "10:35 PM", extraCharge: 0 },
    { id: "nhamboshi", name: "Nhamboshi (NH-48)", time: "11:00 PM", extraCharge: 100 },
  ],
  gradientFrom: "from-emerald-700",
  gradientTo: "to-teal-600",
}

type EventData = typeof TREK_EVENT

// ---------------------------------------------------------------------------
// Section fade-in variant
// ---------------------------------------------------------------------------
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
}

// ---------------------------------------------------------------------------
// Stepper sub-component
// ---------------------------------------------------------------------------
function Stepper({
  label,
  sublabel,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  sublabel?: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-base font-bold text-gray-900 w-6 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Input field wrapper
// ---------------------------------------------------------------------------
function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-800">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white"

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const eventId = params.eventId as string

  // Data fetching state
  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Payment state
  const [paying, setPaying] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  // Participants
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)

  // Pickup
  const [selectedPickup, setSelectedPickup] = useState("")

  // Contact info
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [emergency, setEmergency] = useState("")
  const [specialRequests, setSpecialRequests] = useState("")

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // Fetch trek + event data
  useEffect(() => {
    async function fetchEvent() {
      setLoading(true)
      setFetchError(null)
      try {
        const res = await fetch(`/api/treks/${slug}`)
        if (!res.ok) throw new Error("Failed to load trek data")
        const data = await res.json()
        const trek = data.trek

        const trekEvent = trek.trek_events?.find(
          (e: any) => e.id === eventId
        )
        if (!trekEvent) {
          setFetchError("Event not found. It may have been cancelled or removed.")
          setLoading(false)
          return
        }

        // Map API response to our EventData shape
        const rawPickups: any[] =
          trekEvent.pickup_points?.length > 0
            ? trekEvent.pickup_points
            : trek.default_pickup_points ?? []

        const pickupPoints = rawPickups.map((p: any) => ({
          id: p.id ?? p.label,
          name: p.label,
          time: p.pickup_time,
          extraCharge: p.extra_charge ?? 0,
        }))

        const eventDate = new Date(trekEvent.event_date)
        const formattedDate = eventDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })

        const coverImage =
          trek.trek_images?.find((img: any) => img.is_cover)?.image_url ??
          trek.trek_images?.[0]?.image_url ??
          null

        const mapped: EventData = {
          title: trek.title,
          slug: trek.slug,
          date: formattedDate,
          day: eventDate.toLocaleDateString("en-IN", { weekday: "short" }),
          reportingTime: trekEvent.reporting_time,
          adultPrice: trekEvent.price,
          childPrice: trekEvent.child_price ?? 0,
          is_child_friendly: trek.is_child_friendly,
          availableSeats: trekEvent.total_seats - trekEvent.booked_seats,
          totalSeats: trekEvent.total_seats,
          coverImage,
          pickupPoints,
          gradientFrom: "from-emerald-700",
          gradientTo: "to-teal-600",
        }

        setEvent(mapped)
        if (pickupPoints.length > 0) {
          setSelectedPickup(pickupPoints[0].id)
        }
      } catch (err: any) {
        console.error("Error fetching trek event:", err)
        setFetchError(err.message ?? "Something went wrong. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (slug && eventId) {
      fetchEvent()
    }
  }, [slug, eventId])

  // Derived calculations (safe to compute even before event loads)
  const activeEvent = event ?? TREK_EVENT
  const selectedPickupData = activeEvent.pickupPoints.find((p) => p.id === selectedPickup) ??
    activeEvent.pickupPoints[0] ?? { id: "", name: "", time: "", extraCharge: 0 }

  const adultTotal = adults * activeEvent.adultPrice
  const childTotal = children * (activeEvent.childPrice ?? 0)
  const pickupTotal = selectedPickupData.extraCharge * (adults + children)
  const grandTotal = adultTotal + childTotal + pickupTotal

  const totalParticipants = adults + children
  const seatsOk = totalParticipants <= activeEvent.availableSeats

  const formValid = name.trim() !== "" && email.trim() !== "" && phone.trim() !== ""

  // Payment handler
  async function handlePayNow() {
    if (!formValid || !seatsOk || paying) return

    setBookingError(null)
    setPaying(true)

    try {
      // Step 1: Create booking
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trek_event_id: eventId,
          num_adults: adults,
          num_children: children,
          booking_name: name,
          booking_email: email,
          booking_phone: phone,
          emergency_contact: emergency || undefined,
          special_requests: specialRequests || undefined,
          selected_pickup_id: selectedPickup || undefined,
        }),
      })

      const data = await res.json()

      if (res.status === 401) {
        // Not logged in — redirect to login with return URL
        const currentPath = `/treks/${slug}/book/${eventId}`
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
        return
      }

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create booking. Please try again.")
      }

      // Step 2: Open Razorpay Checkout
      const options = {
        key: data.razorpay.key_id,
        amount: data.razorpay.amount,
        currency: "INR",
        name: "TrekBooking",
        description: `Booking: ${activeEvent.title}`,
        order_id: data.razorpay.order_id,
        prefill: { name, email, contact: phone },
        theme: { color: "#059669" },
        handler: async function (response: any) {
          // Step 3: Verify payment
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          })
          const verifyData = await verifyRes.json()
          if (verifyData.success) {
            router.push(`/dashboard/bookings/${verifyData.booking_id}/confirmation`)
          } else {
            setBookingError("Payment verification failed. Please contact support.")
            setPaying(false)
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false)
          },
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      console.error("Payment error:", err)
      setBookingError(err.message ?? "Something went wrong. Please try again.")
      setPaying(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium">Loading booking details…</p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Error / not found state
  // ---------------------------------------------------------------------------
  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900">Event Not Found</h2>
          <p className="text-sm text-gray-500">{fetchError}</p>
          <Link
            href={`/treks/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to trek
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ------------------------------------------------------------------ */}
      {/* Top progress bar / header strip                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href={`/treks/${activeEvent.slug}`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to trek
          </Link>
          <div className="h-4 w-px bg-gray-200" />
          <p className="text-sm font-semibold text-gray-900 truncate">{activeEvent.title}</p>

          {/* Step indicator */}
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                1
              </span>
              Booking Details
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="flex items-center gap-1 opacity-40">
              <span className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-xs">
                2
              </span>
              Payment
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="flex items-center gap-1 opacity-40">
              <span className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-xs">
                3
              </span>
              Confirmation
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main layout                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12 items-start">
          {/* ===== LEFT: Booking Form ===== */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Trek summary at top */}
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="bg-gradient-to-r from-emerald-700 to-teal-600 rounded-2xl p-5 text-white"
            >
              <p className="text-emerald-200 text-xs font-medium mb-1 uppercase tracking-wide">
                You are booking
              </p>
              <h1 className="text-xl font-bold mb-3">{activeEvent.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-emerald-100">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-300" />
                  {activeEvent.date} ({activeEvent.day})
                </span>
                <span className="flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-emerald-300" />
                  Report by {activeEvent.reportingTime}
                </span>
                <span className="flex items-center gap-1.5 text-amber-200 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {activeEvent.availableSeats} seats left
                </span>
              </div>
            </motion.div>

            {/* ---- Pickup Point ---- */}
            <motion.section
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
              <h2 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Select Pickup Point
              </h2>
              <p className="text-xs text-gray-500 mb-4">Choose your nearest boarding location</p>

              <div className="space-y-2.5">
                {activeEvent.pickupPoints.map((point) => (
                  <label
                    key={point.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedPickup === point.id
                        ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400/40"
                        : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pickup"
                      value={point.id}
                      checked={selectedPickup === point.id}
                      onChange={() => setSelectedPickup(point.id)}
                      className="accent-emerald-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{point.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Timer className="w-3 h-3" />
                        {point.time}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {point.extraCharge > 0 ? (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          +₹{point.extraCharge}/person
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Included
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </motion.section>

            {/* ---- Participants ---- */}
            <motion.section
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
              <h2 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-500" />
                Participants
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Max {activeEvent.availableSeats} participants for this event
              </p>

              <div className="divide-y divide-gray-100">
                <Stepper
                  label="Adults"
                  sublabel={`Age 13+ · ₹${activeEvent.adultPrice.toLocaleString("en-IN")}/person`}
                  value={adults}
                  min={1}
                  max={Math.min(activeEvent.availableSeats, 10)}
                  onChange={setAdults}
                />
                {activeEvent.is_child_friendly && activeEvent.childPrice != null && (
                  <Stepper
                    label="Children"
                    sublabel={`Age 5–12 · ₹${activeEvent.childPrice.toLocaleString("en-IN")}/child`}
                    value={children}
                    min={0}
                    max={Math.min(activeEvent.availableSeats - adults, 5)}
                    onChange={setChildren}
                  />
                )}
              </div>

              {!seatsOk && (
                <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Only {activeEvent.availableSeats} seats available for this date.
                </div>
              )}
            </motion.section>

            {/* ---- Contact Info ---- */}
            <motion.section
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
              <h2 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-500" />
                Contact Information
              </h2>
              <p className="text-xs text-gray-500 mb-5">
                Booking confirmation and updates will be sent here
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Full Name" required>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className={`${inputCls} pl-10`}
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </FormField>

                <FormField label="Email Address" required>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      className={`${inputCls} pl-10`}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </FormField>

                <FormField label="Phone Number" required>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      className={`${inputCls} pl-10`}
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </FormField>

                <FormField label="Emergency Contact">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      className={`${inputCls} pl-10`}
                      placeholder="Emergency contact number"
                      value={emergency}
                      onChange={(e) => setEmergency(e.target.value)}
                    />
                  </div>
                </FormField>
              </div>

              <div className="mt-4">
                <FormField label="Special Requests">
                  <textarea
                    rows={3}
                    className={`${inputCls} resize-none`}
                    placeholder="Dietary requirements, medical conditions, or any special needs…"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                  />
                </FormField>
              </div>
            </motion.section>

            {/* ---- Booking error ---- */}
            {bookingError && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{bookingError}</p>
              </motion.div>
            )}

            {/* ---- Terms acknowledgement ---- */}
            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-600"
            >
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p>
                By proceeding, you agree to our{" "}
                <Link href="/cancellation-policy" className="text-emerald-700 underline">
                  Cancellation Policy
                </Link>{" "}
                and{" "}
                <Link href="/terms" className="text-emerald-700 underline">
                  Terms of Service
                </Link>
                . Bookings are non-refundable 48 hours before the trek.
              </p>
            </motion.div>

            {/* Mobile: Pay button (shows below form on mobile) */}
            <div className="lg:hidden">
              <button
                type="button"
                onClick={handlePayNow}
                disabled={!formValid || !seatsOk || paying}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-4 rounded-2xl text-base transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing…
                  </>
                ) : (
                  `Pay ₹${grandTotal.toLocaleString("en-IN")} Now`
                )}
              </button>
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Secure via Razorpay
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Instant Confirmation
                </span>
              </div>
            </div>
          </div>

          {/* ===== RIGHT: Order Summary (sticky) ===== */}
          <div className="lg:w-96 w-full shrink-0">
            <div className="sticky top-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
              >
                {/* Trek image */}
                {activeEvent.coverImage ? (
                  <div className="h-36 relative overflow-hidden">
                      <Image
                      src={activeEvent.coverImage}
                      alt={activeEvent.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 384px"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-white font-bold text-base leading-tight">{activeEvent.title}</p>
                      <p className="text-white/70 text-xs mt-0.5">
                        {activeEvent.date} · {activeEvent.day}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`h-36 bg-gradient-to-br ${activeEvent.gradientFrom} ${activeEvent.gradientTo} relative flex items-center justify-center`}
                  >
                    <span className="text-white/20 text-5xl font-black select-none">⛰️</span>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-white font-bold text-base leading-tight">{activeEvent.title}</p>
                      <p className="text-white/70 text-xs mt-0.5">
                        {activeEvent.date} · {activeEvent.day}
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-5 space-y-4">
                  <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                    Order Summary
                  </h3>

                  {/* Price breakdown */}
                  <div className="space-y-2.5">
                    {/* Adults line */}
                    <div className="flex items-start justify-between text-sm">
                      <div>
                        <p className="text-gray-700">
                          {adults} {adults === 1 ? "Adult" : "Adults"} × ₹
                          {activeEvent.adultPrice.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ₹{adultTotal.toLocaleString("en-IN")}
                      </p>
                    </div>

                    {/* Children line */}
                    {children > 0 && activeEvent.childPrice != null && (
                      <div className="flex items-start justify-between text-sm">
                        <p className="text-gray-700">
                          {children} {children === 1 ? "Child" : "Children"} × ₹
                          {activeEvent.childPrice.toLocaleString("en-IN")}
                        </p>
                        <p className="font-semibold text-gray-900">
                          ₹{childTotal.toLocaleString("en-IN")}
                        </p>
                      </div>
                    )}

                    {/* Pickup surcharge */}
                    {selectedPickupData.extraCharge > 0 && (
                      <div className="flex items-start justify-between text-sm">
                        <p className="text-gray-700">
                          Pickup: {selectedPickupData.name}
                          <br />
                          <span className="text-xs text-gray-400">
                            +₹{selectedPickupData.extraCharge} × {totalParticipants} people
                          </span>
                        </p>
                        <p className="font-semibold text-gray-900">
                          ₹{pickupTotal.toLocaleString("en-IN")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dashed border-gray-200 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900 text-base">Total</p>
                      <motion.p
                        key={grandTotal}
                        initial={{ scale: 1.1, color: "#059669" }}
                        animate={{ scale: 1, color: "#111827" }}
                        transition={{ duration: 0.3 }}
                        className="text-2xl font-black text-gray-900"
                      >
                        ₹{grandTotal.toLocaleString("en-IN")}
                      </motion.p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Inclusive of all taxes and fees
                    </p>
                  </div>

                  {/* Seat availability reminder */}
                  {activeEvent.availableSeats <= 5 && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Only {activeEvent.availableSeats} seats left! Book before they fill up.
                    </div>
                  )}

                  {/* Pay Now button */}
                  <button
                    type="button"
                    onClick={handlePayNow}
                    disabled={!formValid || !seatsOk || paying}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-4 rounded-2xl text-base transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {paying ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Pay ₹{grandTotal.toLocaleString("en-IN")} Now
                      </>
                    )}
                  </button>

                  {/* Trust badges */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Secure Payment via Razorpay — 256-bit SSL encryption</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Instant Confirmation — view details in your dashboard</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Free cancellation up to 72 hours before the trek</span>
                    </div>
                  </div>

                  {/* Payment methods */}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center mb-2">We accept</p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {["UPI", "Cards", "Net Banking", "Wallets"].map((method) => (
                        <span
                          key={method}
                          className="text-xs font-medium px-2.5 py-1 rounded-md bg-gray-100 text-gray-600"
                        >
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Need help */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-center text-sm text-gray-500"
              >
                Have questions?{" "}
                <Link href="/contact" className="text-emerald-700 font-semibold hover:underline">
                  Contact Support
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
