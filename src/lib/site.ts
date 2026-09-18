/**
 * Absolute site URL, needed for metadata, the sitemap and robots.txt.
 * Vercel provides its own domain, so only a custom domain needs configuring.
 */
export function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelDomain) return `https://${vercelDomain}`;

  return "http://localhost:3000";
}

export const SITE_NAME = "CollegeCompass";
