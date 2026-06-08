import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about TrekBooking — Pune's weekend trek booking platform. Founded in 2026 to make Sahyadri trek booking seamless for trekkers and organizers alike.",
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
      "Founded by trekkers for trekkers. TrekBooking connects adventurers with verified organizers across the Sahyadri mountains.",
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
