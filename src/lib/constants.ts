export const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy", color: "bg-green-100 text-green-800" },
  { value: "moderate", label: "Moderate", color: "bg-yellow-100 text-yellow-800" },
  { value: "difficult", label: "Difficult", color: "bg-orange-100 text-orange-800" },
  { value: "very_difficult", label: "Very Difficult", color: "bg-red-100 text-red-800" },
] as const;

export const REGIONS = [
  "Lonavala",
  "Mulshi",
  "Tamhini",
  "Malshej",
  "Bhimashankar",
  "Rajmachi",
  "Harishchandragad",
  "Kalsubai",
  "Sahyadri Central",
  "Kolhapur",
  "Satara",
  "Raigad",
  "Other",
] as const;

export type Region = (typeof REGIONS)[number];

export const DURATION_OPTIONS = [
  { value: 1, label: "1 Day" },
  { value: 2, label: "2 Days" },
  { value: 3, label: "3 Days" },
  { value: 4, label: "4 Days" },
  { value: 5, label: "5 Days" },
  { value: 6, label: "6 Days" },
  { value: 7, label: "7+ Days" },
] as const;

/** Platform commission taken from each booking (10%). */
export const COMMISSION_RATE = 0.10;

/** Minimum organiser rating required to remain listed. */
export const MIN_RATING = 3.5;

/** Days after trek completion before payout is initiated. */
export const PAYOUT_DAYS = 3;

/** Number of months new organizers get zero commission. */
export const FREE_PERIOD_MONTHS = 3;

export const SITE_CONFIG = {
  name: "TrekBooking",
  description:
    "Book weekend treks near Pune. Explore Sahyadri mountains with verified organizers.",
  url: process.env.NEXT_PUBLIC_BASE_URL || "https://trekbooking.in",
  ogImage: "/og-image.jpg",
  email: "hello@trekbooking.in",
  phone: "+91 XXXXX XXXXX",
} as const;
