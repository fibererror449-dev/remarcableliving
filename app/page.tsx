import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { listListings } from "../lib/listings";
import { toPublicListing } from "../lib/listings-data";
import { siteOrigin } from "../lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: siteOrigin },
};

export default async function HomePage() {
  const listings = (await listListings()).map(toPublicListing);
  return <HomeClient listings={listings} />;
}
