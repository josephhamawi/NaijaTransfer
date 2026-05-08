import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

/**
 * Stable per-route lastmod dates.
 *
 * Google deprioritises sitemaps where every URL's lastmod is "now" —
 * that signal is read as the site faking freshness. We hardcode the
 * date each route's content was meaningfully last touched. Update the
 * relevant entry in the same PR as a content change.
 *
 * Format: YYYY-MM-DD. Use the date the page's content actually changed.
 */
const STATIC_ROUTES: { path: string; lastmod: string; changefreq: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/",                                   lastmod: "2026-05-04", changefreq: "daily",   priority: 1.0 },
  { path: "/blog",                               lastmod: "2026-05-04", changefreq: "daily",   priority: 0.9 },
  { path: "/send-large-files-nigeria",           lastmod: "2026-04-19", changefreq: "monthly", priority: 0.85 },
  { path: "/wetransfer-alternative-nigeria",     lastmod: "2026-04-19", changefreq: "monthly", priority: 0.85 },
  { path: "/black-market-exchange-rate",         lastmod: "2026-05-08", changefreq: "hourly",  priority: 0.85 },
  { path: "/dollar-to-naira-black-market",       lastmod: "2026-05-08", changefreq: "hourly",  priority: 0.8 },
  { path: "/euro-to-naira-black-market",         lastmod: "2026-05-08", changefreq: "hourly",  priority: 0.75 },
  { path: "/pound-to-naira-black-market",        lastmod: "2026-05-08", changefreq: "hourly",  priority: 0.75 },
  { path: "/business",                           lastmod: "2026-04-01", changefreq: "monthly", priority: 0.7 },
  { path: "/pricing",                            lastmod: "2026-04-01", changefreq: "monthly", priority: 0.7 },
  { path: "/docs/api",                           lastmod: "2026-04-14", changefreq: "monthly", priority: 0.6 },
  { path: "/about",                              lastmod: "2026-03-29", changefreq: "yearly",  priority: 0.5 },
  { path: "/artists",                            lastmod: "2026-05-04", changefreq: "monthly", priority: 0.4 },
  { path: "/contact",                            lastmod: "2026-03-29", changefreq: "yearly",  priority: 0.3 },
  { path: "/privacy",                            lastmod: "2026-03-29", changefreq: "yearly",  priority: 0.3 },
  { path: "/terms",                              lastmod: "2026-03-29", changefreq: "yearly",  priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://naijatransfer.com";

  const staticRoutes: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: new Date(`${r.lastmod}T00:00:00Z`),
    changeFrequency: r.changefreq,
    priority: r.priority,
  }));

  const blogRoutes: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(`${post.updated ?? post.date}T00:00:00Z`),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
