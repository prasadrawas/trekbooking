import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How TrekBooking collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-sm text-emerald-200">Last updated: June 2026</p>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">

        <div className="prose prose-slate prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-slate-800">1. Introduction</h2>
            <p className="text-slate-600 leading-relaxed">
              TrekBooking (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the website trekbooking.in. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">2. Information We Collect</h2>
            <h3 className="text-base font-medium text-slate-700 mt-4">Personal Information</h3>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li>Name, email address, phone number (provided during registration)</li>
              <li>City and profile photo (optional, provided in settings)</li>
              <li>Emergency contact details (provided during booking)</li>
              <li>Payment information (processed by Razorpay — we do not store card details)</li>
            </ul>

            <h3 className="text-base font-medium text-slate-700 mt-4">Organizer Information</h3>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li>Organization name, description, phone, email</li>
              <li>Bank account details (for payout processing — stored securely, visible only to the account owner)</li>
              <li>Organization logo</li>
            </ul>

            <h3 className="text-base font-medium text-slate-700 mt-4">Automatically Collected Information</h3>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li>Browser type and version</li>
              <li>Pages visited and time spent</li>
              <li>IP address and approximate location</li>
              <li>Device information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li>To create and manage your account</li>
              <li>To process bookings and payments</li>
              <li>To communicate booking confirmations and updates</li>
              <li>To enable organizers to manage their treks and bookings</li>
              <li>To process payouts to organizers</li>
              <li>To improve our platform and user experience</li>
              <li>To send important service-related notifications</li>
              <li>To prevent fraud and ensure platform security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">4. Information Sharing</h2>
            <p className="text-slate-600 leading-relaxed">We share your information only in these cases:</p>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li><strong>With trek organizers:</strong> Your booking name, phone, email, and emergency contact are shared with the organizer of the trek you book — so they can coordinate logistics.</li>
              <li><strong>With payment processors:</strong> Razorpay processes your payment. Their privacy policy applies to payment data.</li>
              <li><strong>With authentication providers:</strong> If you sign in with Google, Google&rsquo;s privacy policy applies to authentication data.</li>
              <li><strong>As required by law:</strong> If required by legal process, regulation, or government request.</li>
            </ul>
            <p className="text-slate-600 leading-relaxed mt-2">
              We do <strong>not</strong> sell, rent, or trade your personal information to third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">5. Data Security</h2>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li>All data is transmitted over HTTPS (SSL/TLS encryption).</li>
              <li>Passwords are hashed and never stored in plain text.</li>
              <li>Bank account details are accessible only to the account owner via authenticated API.</li>
              <li>Database access is controlled by Row Level Security (RLS) policies.</li>
              <li>We use Supabase (hosted on AWS in Mumbai region) for data storage.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">6. Cookies</h2>
            <p className="text-slate-600 leading-relaxed">
              We use essential cookies for authentication and session management. These are strictly necessary for the platform to function and cannot be opted out of. We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">7. Your Rights</h2>
            <p className="text-slate-600 leading-relaxed">You have the right to:</p>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li><strong>Access:</strong> View all personal data we hold about you (via your dashboard settings).</li>
              <li><strong>Correct:</strong> Update your profile information at any time.</li>
              <li><strong>Delete:</strong> Request account deletion (Settings → Danger Zone). This permanently removes all your data.</li>
              <li><strong>Withdraw consent:</strong> You can stop using the platform at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">8. Data Retention</h2>
            <p className="text-slate-600 leading-relaxed">
              We retain your data for as long as your account is active. Booking and payment records are retained for 7 years for accounting and legal compliance. When you delete your account, personal data is permanently removed; anonymized booking records may be retained for analytics.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">9. Children&rsquo;s Privacy</h2>
            <p className="text-slate-600 leading-relaxed">
              TrekBooking is not intended for users under 18. We do not knowingly collect personal information from children. Child bookings must be made by a parent or guardian. The &ldquo;child-friendly&rdquo; filter refers to trek difficulty, not platform users.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">10. Changes to This Policy</h2>
            <p className="text-slate-600 leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. Continued use of the platform constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800">11. Contact</h2>
            <p className="text-slate-600 leading-relaxed">
              For privacy-related questions or requests, contact us at{" "}
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
