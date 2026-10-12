import type { MetadataRoute } from "next";
import { loadDiscovery } from "../lib/discovery";
import { placeHref } from "../lib/discovery-data";
import { siteOrigin } from "../lib/site-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { listings, places } = await loadDiscovery();
  const staticRoutes = ["", "/residences", "/neighbourhoods", "/areas", "/projects", "/universities", "/about", "/contact", "/student-housing", "/inventory"];
  return [
    ...staticRoutes.map((route) => ({ url: `${siteOrigin}${route}` })),
    ...places.map(place => ({ url: `${siteOrigin}${placeHref(place)}` })),
    ...listings.map((listing) => ({ url: `${siteOrigin}/residences/${listing.slug}` })),
  ];
}
