import type { MetadataRoute } from "next";

import { resolveSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = resolveSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Comparisons are per-student selections, not pages worth indexing.
        disallow: ["/api/", "/compare"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
