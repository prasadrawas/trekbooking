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
  title: "SahyadriBook — Book Weekend Treks Near Pune",
  description:
    "Discover and book verified weekend treks in the Sahyadri mountains near Pune. 400+ trek routes, 120+ organizers, instant online payment. Just show up and trek!",
  keywords: [
    "trek booking Pune",
    "Sahyadri treks",
    "weekend treks near Pune",
    "Maharashtra trek booking",
    "Lonavala trek",
    "Rajmachi trek",
    "Harishchandragad trek",
    "Kalsubai trek",
    "Bhimashankar trek",
    "verified trek organizers",
    "family treks Pune",
    "easy treks Maharashtra",
  ],
  openGraph: {
    title: "SahyadriBook — Book Weekend Treks Near Pune",
    description:
      "400+ verified trek routes in the Sahyadris. Book online, pay securely, just show up.",
    type: "website",
    locale: "en_IN",
    siteName: "SahyadriBook",
  },
  twitter: {
    card: "summary_large_image",
    title: "SahyadriBook — Book Weekend Treks Near Pune",
    description:
      "400+ verified trek routes in the Sahyadris. Book online, pay securely, just show up.",
  },
  robots: {
    index: true,
    follow: true,
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
