import type { MetadataRoute } from "next";
import { siteOrigin } from "../lib/site-data";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
