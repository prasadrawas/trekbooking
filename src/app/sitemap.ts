import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://trekbooking.in";

interface TrekSlugRow {
  slug: string;
  updated_at: string;
}

interface OrganizerSlugRow {
  slug: string;
  created_at: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/treks`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/partner`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  // Fetch published trek slugs and verified organizer slugs from Supabase
  let trekPages: MetadataRoute.Sitemap = [];
  let organizerPages: MetadataRoute.Sitemap = [];

  try {
    const supabase = createAdminClient();

    const [trekResult, organizerResult] = await Promise.all([
      supabase
        .from("treks")
        .select("slug, updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false }),
      supabase
        .from("organizers")
        .select("slug, created_at")
        .eq("is_verified", true)
        .order("created_at", { ascending: false }),
    ]);

    if (trekResult.data) {
      const treks = trekResult.data as TrekSlugRow[];
      trekPages = treks.map((trek) => ({
        url: `${BASE_URL}/treks/${trek.slug}`,
        lastModified: trek.updated_at ? new Date(trek.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }

    if (organizerResult.data) {
      const orgs = organizerResult.data as OrganizerSlugRow[];
      organizerPages = orgs.map((org) => ({
        url: `${BASE_URL}/organizers/${org.slug}`,
        lastModified: org.created_at ? new Date(org.created_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // If Supabase is unavailable during build, return static pages only
  }

  return [...staticPages, ...trekPages, ...organizerPages];
}
