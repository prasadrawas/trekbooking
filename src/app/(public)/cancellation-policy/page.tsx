import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description: "Understand TrekBooking's cancellation and refund policy for trek bookings.",
};

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-white mb-2">Cancellation & Refund Policy</h1>
          <p className="text-sm text-emerald-200">Last updated: June 2026</p>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">

        <div className="prose prose-slate prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-slate-800">1. Overview</h2>
            <p className="text-slate-600 leading-relaxed">
              Each trek on TrekBooking has its own cancellation policy, set by the trek organizer. The specific refund rules are displayed on the trek detail page and during the booking process. Please review the policy before confirming your booking.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">2. Default Cancellation Rules</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Unless the organizer has set a custom policy, the following default rules apply:
            </p>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Cancellation Timing</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Refund</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-600">More than 48 hours before trek</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">100% refund</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-600">24–48 hours before trek</td>
                    <td className="px-4 py-3 font-semibold text-amber-600">50% refund</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-600">Less than 24 hours before trek</td>
                    <td className="px-4 py-3 font-semibold text-red-600">No refund</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">3. How to Cancel</h2>
            <ol className="list-decimal pl-5 text-slate-600 space-y-2">
              <li>Log in to your TrekBooking account.</li>
              <li>Go to <strong>Dashboard → My Bookings</strong>.</li>
              <li>Click on the booking you wish to cancel.</li>
              <li>Click <strong>&ldquo;Cancel Booking&rdquo;</strong> and provide a reason.</li>
              <li>The refund amount will be calculated automatically based on the cancellation rules.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">4. Refund Processing</h2>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li>Refunds are processed via Razorpay to the original payment method.</li>
              <li>Refunds typically take <strong>5–7 business days</strong> to reflect in your account.</li>
              <li>The refund amount is based on the trek&rsquo;s cancellation policy at the time of booking.</li>
              <li>Platform fees are included in the refund calculation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">5. Organizer-Initiated Cancellations</h2>
            <p className="text-slate-600 leading-relaxed">
              If an organizer cancels a trek (due to weather, safety concerns, or other reasons):
            </p>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li>You will receive a <strong>full 100% refund</strong>, regardless of the cancellation timing.</li>
              <li>Refund is processed automatically.</li>
              <li>You will be notified via your dashboard.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">6. Weather & Force Majeure</h2>
            <p className="text-slate-600 leading-relaxed">
              In cases of extreme weather, natural disasters, or government-imposed restrictions that make a trek unsafe or impossible:
            </p>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li>The organizer will cancel the trek and a full refund will be processed.</li>
              <li>Alternatively, the organizer may offer a reschedule to a future date.</li>
              <li>TrekBooking is not liable for weather-related disruptions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">7. No-Shows</h2>
            <p className="text-slate-600 leading-relaxed">
              If you do not show up at the meeting/pickup point without cancelling your booking, it is treated as a last-minute cancellation. No refund will be provided for no-shows.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">8. Disputes</h2>
            <p className="text-slate-600 leading-relaxed">
              If you believe a refund was calculated incorrectly, or have a dispute about a cancellation, contact us at{" "}
              <a href="mailto:trekbooking.in@gmail.com" className="text-emerald-600 hover:underline">
                trekbooking.in@gmail.com
              </a>{" "}
              with your booking number. We will review and resolve the issue within 3 business days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">9. Contact</h2>
            <p className="text-slate-600 leading-relaxed">
              For cancellation or refund queries, contact us at{" "}
              <a href="mailto:trekbooking.in@gmail.com" className="text-emerald-600 hover:underline">
                trekbooking.in@gmail.com
              </a>{" "}
              or call{" "}
              <a href="tel:+917020845256" className="text-emerald-600 hover:underline">
                +91 7020845256
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
