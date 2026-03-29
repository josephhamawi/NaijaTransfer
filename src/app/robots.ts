import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/_next/"],
      },
    ],
    sitemap: `${process.env.APP_URL || "https://nigeriatransfer.com"}/sitemap.xml`,
  };
}
