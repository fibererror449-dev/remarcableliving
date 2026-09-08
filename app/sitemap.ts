import type { MetadataRoute } from "next";
import { listListings } from "../lib/listings";
import { siteOrigin } from "../lib/site-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await listListings();
  const staticRoutes = ["", "/residences", "/neighbourhoods", "/about", "/contact", "/student-housing", "/inventory"];
  return [
    ...staticRoutes.map((route) => ({ url: `${siteOrigin}${route}` })),
    ...listings.map((listing) => ({ url: `${siteOrigin}/residences/${listing.slug}`, lastModified: listing.lastVerified })),
  ];
}
