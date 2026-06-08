import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using the TrekBooking platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-sm text-emerald-200">Last updated: June 2026</p>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">

        <div className="prose prose-slate prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-slate-800">1. Acceptance of Terms</h2>
            <p className="text-slate-600 leading-relaxed">
              By accessing or using TrekBooking (trekbooking.in), you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">2. About the Platform</h2>
            <p className="text-slate-600 leading-relaxed">
              TrekBooking is an online marketplace that connects trekkers with verified trek organizers in the Sahyadri mountains, Maharashtra, India. We facilitate bookings and payments but do not directly organize or conduct treks.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">3. User Accounts</h2>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the confidentiality of your password.</li>
              <li>You must be at least 18 years old to create an account.</li>
              <li>One person may not maintain multiple accounts.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">4. Bookings & Payments</h2>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li>All payments are processed securely through Razorpay.</li>
              <li>Prices displayed are set by the trek organizer and include the platform commission.</li>
              <li>A booking is confirmed only after successful payment.</li>
              <li>TrekBooking is not responsible for price changes made by organizers.</li>
              <li>All prices are in Indian Rupees (INR).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">5. Cancellation & Refunds</h2>
            <p className="text-slate-600 leading-relaxed">
              Each trek has its own cancellation policy set by the organizer, which is displayed on the trek detail page and during booking. Refund amounts are calculated automatically based on how far in advance the cancellation is made. Please review the cancellation policy before booking.
            </p>
            <p className="text-slate-600 leading-relaxed mt-2">
              If an organizer cancels a trek, a full refund will be processed to the original payment method. Refunds typically take 5-7 business days to reflect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">6. Trek Organizers</h2>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li>Organizers are independent entities, not employees of TrekBooking.</li>
              <li>TrekBooking verifies organizer credentials but does not guarantee the quality of individual treks.</li>
              <li>Organizers are responsible for the safety, logistics, and execution of their treks.</li>
              <li>Organizers agree to a 10% platform commission on bookings generated through TrekBooking.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">7. User Conduct</h2>
            <p className="text-slate-600 leading-relaxed">You agree not to:</p>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li>Provide false or misleading information.</li>
              <li>Use the platform for any illegal or unauthorized purpose.</li>
              <li>Harass, abuse, or harm other users or organizers.</li>
              <li>Attempt to gain unauthorized access to the platform or other accounts.</li>
              <li>Post fake reviews or manipulate ratings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">8. Assumption of Risk</h2>
            <p className="text-slate-600 leading-relaxed">
              Trekking involves inherent risks including but not limited to physical injury, adverse weather conditions, and wildlife encounters. By booking a trek through TrekBooking, you acknowledge these risks and agree that TrekBooking is not liable for any injuries, losses, or damages that may occur during a trek.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">9. Intellectual Property</h2>
            <p className="text-slate-600 leading-relaxed">
              All content on TrekBooking, including text, graphics, logos, and software, is the property of TrekBooking or its content providers and is protected by intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">10. Limitation of Liability</h2>
            <p className="text-slate-600 leading-relaxed">
              TrekBooking acts as an intermediary platform. We are not liable for the actions, omissions, or negligence of trek organizers. Our total liability is limited to the amount you paid for the specific booking in question.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">11. Changes to Terms</h2>
            <p className="text-slate-600 leading-relaxed">
              We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms. We will notify registered users of significant changes via email or platform notification.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">12. Governing Law</h2>
            <p className="text-slate-600 leading-relaxed">
              These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Pune, Maharashtra.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">13. Contact</h2>
            <p className="text-slate-600 leading-relaxed">
              For questions about these terms, contact us at{" "}
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
