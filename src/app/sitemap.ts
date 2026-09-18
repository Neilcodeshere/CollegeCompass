import type { MetadataRoute } from "next";

import { getCollegeSitemapEntries } from "@/lib/services/colleges";
import { resolveSiteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = resolveSiteUrl();
  const colleges = await getCollegeSitemapEntries();

  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/colleges`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/predictor`, changeFrequency: "monthly", priority: 0.8 },
    // /compare is only meaningful with colleges chosen, so it isn't listed.
    ...colleges.map((college) => ({
      url: `${siteUrl}/colleges/${college.slug}`,
      lastModified: college.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
