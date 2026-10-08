import type { Metadata } from "next";
import NeighbourhoodsClient from "./NeighbourhoodsClient";
import BangkokGuide from "../components/BangkokGuide";
import RevealOnScroll from "../components/RevealOnScroll";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";
import { listListings } from "../../lib/listings";
import { AREA_ALL, parseListingFacet, toPublicListing } from "../../lib/listings-data";
import { siteOrigin } from "../../lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Neighbourhoods, projects & universities | REMARCABLE LIVING",
  description: "Find Bangkok residences by university, development project and neighbourhood. Compare the matching homes by space, station access and monthly rent.",
  alternates: { canonical: `${siteOrigin}/neighbourhoods` },
};

export default async function NeighbourhoodsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const listings = (await listListings()).map(toPublicListing);
  return (
    <main className="neighbourhoods-page">
      <SiteNav current="neighbourhoods" />
      <NeighbourhoodsClient listings={listings} initialArea={parseListingFacet(params.area) || AREA_ALL} initialUniversity={parseListingFacet(params.university)} initialProject={parseListingFacet(params.project)} />
      <BangkokGuide />
      <RevealOnScroll />
      <SiteFooter />
    </main>
  );
}
