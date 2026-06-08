import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

interface OrganizerRow {
  org_name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  avg_rating: number;
  is_verified: boolean;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("organizers")
    .select("org_name, slug, description, logo_url, avg_rating, is_verified")
    .eq("slug", slug)
    .single();

  const org = data as OrganizerRow | null;

  if (!org) {
    return {
      title: "Organizer Not Found",
      description: "The trek organizer profile you are looking for could not be found.",
    };
  }

  const name = org.org_name ?? "Trek Organizer";
  const description = org.description
    ? org.description.slice(0, 155).replace(/\n/g, " ").trim() + "\u2026"
    : `${name} is a ${org.is_verified ? "verified " : ""}trek organizer on TrekBooking. Book treks with ${name} in the Sahyadri mountains near Pune, Maharashtra.`;

  const coverImage = org.logo_url ?? "/og-image.jpg";
  const canonicalUrl = `https://trekbooking.in/organizers/${slug}`;

  return {
    title: name,
    description,
    keywords: [
      `${name} treks`,
      `${name} trek booking`,
      "verified trek organizer Pune",
      "trek organizer Sahyadri",
      "trek organizer Maharashtra",
      "book treks Pune",
      "Sahyadri trek organizer",
    ],
    openGraph: {
      title: `${name} | TrekBooking`,
      description,
      type: "profile",
      url: canonicalUrl,
      images: [
        {
          url: coverImage,
          width: 400,
          height: 400,
          alt: `${name} — Trek Organizer on TrekBooking`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | TrekBooking`,
      description,
      images: [coverImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
