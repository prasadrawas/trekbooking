import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://sahyadribook.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/org/", "/admin/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
