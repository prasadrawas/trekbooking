import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about TrekBooking — Pune's leading weekend trek booking platform. Founded by trekkers for trekkers. 120+ verified organizers, 400+ Sahyadri routes, 12,000+ happy adventurers.",
  keywords: [
    "about TrekBooking",
    "trek booking platform Pune",
    "Sahyadri trekking company",
    "verified trek organizers Pune",
    "trekking startup Pune",
    "weekend trek booking India",
    "Western Ghats trekking platform",
    "Maharashtra adventure travel",
  ],
  openGraph: {
    title: "About Us | TrekBooking",
    description:
      "Founded by trekkers for trekkers. TrekBooking connects 12,000+ adventurers with 120+ verified organizers across the Sahyadri mountains.",
    type: "website",
    url: "https://trekbooking.in/about",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "About TrekBooking — Sahyadri Trek Booking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | TrekBooking",
    description:
      "Founded by trekkers for trekkers. TrekBooking connects adventurers with verified Sahyadri trek organizers.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://trekbooking.in/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
