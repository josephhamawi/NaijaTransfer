import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://naijatransfer.com";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${baseUrl}/send-large-files-nigeria`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/wetransfer-alternative-nigeria`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/business`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/docs/api`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/artists`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const posts = getAllPosts();
  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date((post.updated ?? post.date) + "T00:00:00Z"),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  return [...staticRoutes, ...blogRoutes];
}
