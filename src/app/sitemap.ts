import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://trekbooking.in";

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages
  const staticPages = [
    "",
    "/treks",
    "/about",
    "/contact",
    "/partner",
    "/login",
    "/signup",
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency:
      route === "/treks" ? ("daily" as const) : ("weekly" as const),
    priority: route === "" ? 1 : route === "/treks" ? 0.9 : 0.7,
  }));

  // TODO: In production, fetch trek slugs from Supabase
  // const { data: treks } = await supabase
  //   .from("treks")
  //   .select("slug, updated_at")
  //   .eq("is_published", true);
  // const trekPages = treks?.map((trek) => ({
  //   url: `${BASE_URL}/treks/${trek.slug}`,
  //   lastModified: new Date(trek.updated_at),
  //   changeFrequency: "weekly" as const,
  //   priority: 0.8,
  // })) ?? [];
  // return [...staticPages, ...trekPages];

  return staticPages;
}
