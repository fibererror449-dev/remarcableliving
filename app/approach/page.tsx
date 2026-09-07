import type { Metadata } from "next";
import JourneySteps from "../components/JourneySteps";
import Manifesto from "../components/Manifesto";
import RevealOnScroll from "../components/RevealOnScroll";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";
import { siteOrigin } from "../../lib/site-data";

export const metadata: Metadata = {
  title: "How REMARCABLE LIVING works | Bangkok rental assistance",
  description: "Less scrolling, more certainty: how a brief becomes a Bangkok shortlist, and what is checked before you travel to a viewing.",
  alternates: { canonical: `${siteOrigin}/approach` },
};

export default function ApproachPage() {
  return (
    <main className="approach-page">
      <SiteNav current="approach" />
      <Manifesto />
      <JourneySteps />
      <RevealOnScroll />
      <SiteFooter />
    </main>
  );
}
