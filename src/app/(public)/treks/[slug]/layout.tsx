import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

interface TrekRow {
  title: string;
  slug: string;
  description: string | null;
  difficulty: string;
  duration_days: number;
  distance_km: number | null;
  region: string | null;
  is_child_friendly: boolean;
  organizers: { org_name: string } | null;
  trek_images: Array<{ image_url: string; is_cover: boolean }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("treks")
    .select(
      "title, slug, description, difficulty, duration_days, distance_km, region, is_child_friendly, organizers ( org_name ), trek_images ( image_url, is_cover )"
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  const trek = data as TrekRow | null;

  if (!trek) {
    return {
      title: "Trek Not Found",
      description: "The trek you are looking for could not be found.",
    };
  }

  const organizerName = trek.organizers?.org_name ?? "Verified Organizer";

  const images = trek.trek_images ?? [];
  const coverImage =
    images.find((i) => i.is_cover)?.image_url ??
    images[0]?.image_url ??
    "/og-image.jpg";

  const title = trek.title;
  const difficultyLabel =
    trek.difficulty === "very_difficult"
      ? "Very Difficult"
      : trek.difficulty.charAt(0).toUpperCase() + trek.difficulty.slice(1);

  const description = trek.description
    ? trek.description.slice(0, 155).replace(/\n/g, " ").trim() + "\u2026"
    : `Book the ${title} with ${organizerName}. ${difficultyLabel} trek in the Sahyadri mountains near Pune. ${trek.duration_days} day${trek.duration_days !== 1 ? "s" : ""}, ${trek.distance_km ?? ""} km. Instant online booking.`;

  const canonicalUrl = `https://trekbooking.in/treks/${slug}`;

  return {
    title,
    description,
    keywords: [
      `${title} booking`,
      `${trek.region ?? "Sahyadri"} trek booking`,
      `${trek.region ?? "Sahyadri"} trek Pune`,
      `${difficultyLabel.toLowerCase()} trek near Pune`,
      `${trek.duration_days} day trek Pune`,
      "trek booking Pune",
      "Sahyadri trek booking",
      "weekend treks near Pune",
      "Maharashtra trek",
      ...(trek.is_child_friendly ? ["family trek Pune", "child friendly trek"] : []),
    ],
    openGraph: {
      title: `${title} | TrekBooking`,
      description,
      type: "website",
      url: canonicalUrl,
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: `${title} — TrekBooking`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | TrekBooking`,
      description,
      images: [coverImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function TrekDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
