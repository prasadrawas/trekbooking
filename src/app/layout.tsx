import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LayoutShell } from "@/components/layout/layout-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trekbooking.in"),
  title: {
    default: "TrekBooking — Book Weekend Treks Near Pune",
    template: "%s | TrekBooking",
  },
  description:
    "Discover and book verified weekend treks in the Sahyadri mountains near Pune. 400+ trek routes, 120+ organizers, instant online payment. Just show up and trek!",
  keywords: [
    "trek booking Pune",
    "weekend treks near Pune",
    "Sahyadri trek booking",
    "Rajgad trek booking",
    "Torna fort trek",
    "Lohagad trek",
    "Kalsubai trek booking",
    "family treks Pune",
    "night trek near Pune",
    "trek booking online India",
    "Maharashtra trek booking",
    "verified trek organizers Pune",
    "Sahyadri treks",
    "Lonavala trek",
    "Rajmachi trek",
    "Harishchandragad trek",
    "Bhimashankar trek",
    "easy treks Maharashtra",
    "Pune adventure travel",
    "Western Ghats trekking",
  ],
  authors: [{ name: "TrekBooking", url: "https://trekbooking.in" }],
  creator: "TrekBooking",
  publisher: "TrekBooking",
  openGraph: {
    title: "TrekBooking — Book Weekend Treks Near Pune",
    description:
      "400+ verified trek routes in the Sahyadris. Book online, pay securely, just show up.",
    type: "website",
    locale: "en_IN",
    siteName: "TrekBooking",
    url: "https://trekbooking.in",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TrekBooking — Weekend Treks in the Sahyadri Mountains near Pune",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrekBooking — Book Weekend Treks Near Pune",
    description:
      "400+ verified trek routes in the Sahyadris. Book online, pay securely, just show up.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://trekbooking.in",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} scroll-smooth h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
