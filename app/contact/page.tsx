import Link from "next/link";
import type { Metadata } from "next";
import IntakeForm from "../components/IntakeForm";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";
import type { Persona } from "../../lib/intake";
import { siteOrigin } from "../../lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Talk to Mark | REMARCABLE LIVING",
  description: "Send your workplace or university, move-in date, budget and must-haves. Mark replies with a practical Bangkok shortlist.",
  alternates: { canonical: `${siteOrigin}/contact` },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ContactPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const persona: Persona = firstValue(params.persona) === "intern" ? "intern" : "exchange";
  const listing = firstValue(params.listing)?.trim().slice(0, 120) || undefined;
  return (
    <main className="contact-page">
      <SiteNav current="contact" />
      <section className="concierge section on-dark" id="assist">
        <img className="concierge-bg" src="/bangkok/skyline.jpg" alt="" loading="lazy" />
        <div className="container concierge-grid">
          <div className="concierge-intro">
            <p className="eyebrow"><span /> Personal rental assistance</p>
            <h1 className="h2">Tell Mark what<br />home must <em>do.</em></h1>
            <p className="lede">Share your workplace, move-in date, budget, and must-haves. We will return with a practical Bangkok shortlist.</p>
            <div className="concierge-steps">
              <div><b>1</b><span>Your details open in WhatsApp, ready to send.</span></div>
              <div><b>2</b><span>Mark replies with a shortlist that fits the brief.</span></div>
              <div><b>3</b><span>Availability and asking rent are confirmed before a viewing.</span></div>
            </div>
            <div className="concierge-links">
              <Link className="text-link" href="/residences">See the current collection →</Link>
              <Link className="text-link" href="/approach">How the search works →</Link>
            </div>
          </div>
          <IntakeForm initialPersona={persona} listingName={listing} />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
