import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with TrekBooking. Have questions about a trek, a booking, or want to become an organizer? We're here to help — reach us via email or WhatsApp.",
  keywords: [
    "contact TrekBooking",
    "trek booking support",
    "trek help Pune",
    "TrekBooking email",
    "trek organizer enquiry",
    "Sahyadri trek contact",
  ],
  openGraph: {
    title: "Contact Us | TrekBooking",
    description:
      "Questions about a trek or booking? Get in touch with the TrekBooking team — we'll get back to you soon.",
    type: "website",
    url: "https://trekbooking.in/contact",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Contact TrekBooking",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Contact Us | TrekBooking",
    description:
      "Questions about a trek or booking? Reach the TrekBooking team any time.",
  },
  alternates: {
    canonical: "https://trekbooking.in/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
