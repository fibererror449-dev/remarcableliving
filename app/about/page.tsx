import type { Metadata } from "next";
import AboutAudience from "../components/AboutAudience";
import AboutMark from "../components/AboutMark";
import AboutValues from "../components/AboutValues";
import JourneySteps from "../components/JourneySteps";
import Manifesto from "../components/Manifesto";
import RevealOnScroll from "../components/RevealOnScroll";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";
import { siteOrigin } from "../../lib/site-data";

export const metadata: Metadata = {
  title: "About us | REMARCABLE LIVING",
  description: "REMARCABLE LIVING is a personal Bangkok rental service for exchange students and interns, run by Mark. Who we are, what we stand for, and how a brief becomes a home.",
  alternates: { canonical: `${siteOrigin}/about` },
};

export default function AboutPage() {
  return (
    <main className="about-page">
      <SiteNav current="about" />
      <header className="page-hero section on-dark">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow"><span /> About us</p>
            <h1>A Bangkok rental service<br />built around <em>you.</em></h1>
          </div>
          <div>
            <p className="lede">REMARCABLE LIVING helps exchange students and interns find a home in Bangkok. Mark runs each search personally, from your first brief to the day you move in, so you never have to choose a flat from a listing site in a city you have not seen yet.</p>
            <div className="page-hero-links">
              <a className="text-link" href="/residences">See the current collection →</a>
              <a className="text-link" href="/contact">Talk to Mark →</a>
            </div>
          </div>
        </div>
      </header>
      <Manifesto />
      <AboutValues />
      <AboutAudience />
      <JourneySteps />
      <AboutMark />
      <RevealOnScroll />
      <SiteFooter />
    </main>
  );
}
