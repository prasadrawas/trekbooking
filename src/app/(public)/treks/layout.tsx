import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Treks",
  description:
    "Browse and book 400+ verified weekend treks in the Sahyadri mountains near Pune. Filter by difficulty, region, date, and group size. Easy online booking with instant confirmation.",
  keywords: [
    "trek booking Pune",
    "weekend treks near Pune",
    "Sahyadri trek booking",
    "Maharashtra treks",
    "easy treks Pune",
    "moderate treks Pune",
    "difficult treks Sahyadri",
    "family treks near Pune",
    "child friendly treks Pune",
    "night trek Pune",
    "Lohagad trek",
    "Rajgad trek",
    "Torna fort trek",
    "Kalsubai trek",
    "Harishchandragad trek",
    "Sinhagad trek",
    "1 day trek Pune",
    "2 day trek Pune",
  ],
  openGraph: {
    title: "Explore Treks | TrekBooking",
    description:
      "Browse 400+ verified weekend treks in the Sahyadri mountains near Pune. Filter, book, and just show up.",
    type: "website",
    url: "https://trekbooking.in/treks",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Sahyadri Treks — TrekBooking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Treks | TrekBooking",
    description:
      "Browse 400+ verified weekend treks in the Sahyadri mountains near Pune.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://trekbooking.in/treks",
  },
};

export default function TreksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
