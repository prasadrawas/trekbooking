import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner With Us — List Your Treks",
  description:
    "Are you a trek organizer in Maharashtra? Partner with TrekBooking to list your treks, manage bookings online, and grow your business — free setup, only 10% commission.",
  keywords: [
    "trek organizer partnership",
    "list treks online Pune",
    "trek business platform India",
    "organizer registration TrekBooking",
    "grow trek business Pune",
    "Sahyadri trek organizer platform",
    "become trek organizer partner",
    "Maharashtra trek listing",
    "online trek booking platform",
    "trek organizer commission India",
  ],
  openGraph: {
    title: "Partner With Us — List Your Treks | TrekBooking",
    description:
      "Grow your trekking business with TrekBooking. Free setup, 10% commission, instant payments. List your treks and reach trekkers in Pune and Maharashtra.",
    type: "website",
    url: "https://trekbooking.in/partner",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Partner With TrekBooking — List Your Sahyadri Treks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Partner With TrekBooking — List Your Treks",
    description:
      "Grow your trekking business. Free listing, instant payments, manage bookings without the WhatsApp chaos.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://trekbooking.in/partner",
  },
};

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
