import type { Metadata } from "next";
import NeighbourhoodsClient from "./NeighbourhoodsClient";
import BangkokGuide from "../components/BangkokGuide";
import RevealOnScroll from "../components/RevealOnScroll";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";
import { listListings } from "../../lib/listings";
import { toPublicListing } from "../../lib/listings-data";
import { siteOrigin } from "../../lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bangkok neighbourhoods for students and interns | REMARCABLE LIVING",
  description: "Compare Ari, Ratchathewi, Thonglor and Rama 9 by commute, space and monthly rent, then read what to check before you sign.",
  alternates: { canonical: `${siteOrigin}/neighbourhoods` },
};

export default async function NeighbourhoodsPage() {
  const listings = (await listListings()).map(toPublicListing);
  return (
    <main className="neighbourhoods-page">
      <SiteNav current="neighbourhoods" />
      <NeighbourhoodsClient listings={listings} />
      <BangkokGuide />
      <RevealOnScroll />
      <SiteFooter />
    </main>
  );
}
