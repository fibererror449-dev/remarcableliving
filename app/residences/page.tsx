import type { Metadata } from "next";
import ResidencesClient from "./ResidencesClient";
import { listListings } from "../../lib/listings";
import { parseArea, parseBudget, toPublicListing } from "../../lib/listings-data";
import { siteOrigin } from "../../lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bangkok residences for exchange students and interns | REMARCABLE LIVING",
  description: "The current REMARCABLE LIVING collection of Bangkok condominiums, filtered by area and monthly budget. Availability and asking rent are confirmed before any viewing.",
  alternates: { canonical: `${siteOrigin}/residences` },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ResidencesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const listings = (await listListings()).map(toPublicListing);
  return <ResidencesClient listings={listings} initialArea={parseArea(params.area)} initialBudget={parseBudget(params.budget)} />;
}
