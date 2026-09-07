import type { Metadata } from "next";
import IntakeForm from "../components/IntakeForm";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";
import { siteOrigin, universityOptions } from "../../lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student housing in Bangkok by university | REMARCABLE LIVING",
  description: "Exchange students: choose your university, send your brief, and get a Bangkok shortlist with realistic monthly rents. Availability is confirmed before any viewing.",
  alternates: { canonical: `${siteOrigin}/student-housing` },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function StudentHousingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requested = Array.isArray(params.university) ? params.university[0] : params.university;
  const university = requested && universityOptions.includes(requested) ? requested : undefined;
  return (
    <main className="student-page">
      <SiteNav current="student-housing" />
      <header className="page-hero section on-dark">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow"><span /> Find by university</p>
            <h1>A Bangkok home<br />for your <em>semester.</em></h1>
          </div>
          <div>
            <p className="lede">Tell us where you will study, when you arrive, and what you can spend each month. Commute, unit condition, and asking rent are compared before anything reaches your shortlist.</p>
            <div className="page-hero-links">
              <a className="text-link" href="/residences">See the current collection →</a>
              <a className="text-link" href="/neighbourhoods">Compare neighbourhoods →</a>
            </div>
          </div>
        </div>
      </header>

      <section className="section" aria-labelledby="universities-title">
        <div className="container">
          <header className="sec-head">
            <div><p className="eyebrow dark"><span /> Step one</p><h2 className="h2" id="universities-title">Choose your<br /><em>university.</em></h2></div>
            <p className="lede">Your choice is added to the brief below. Walking and transit times are checked for each shortlist, not assumed from the campus name.</p>
          </header>
          <div className="student-universities">
            {universityOptions.map((option) => (
              <a key={option} href={`/student-housing?university=${encodeURIComponent(option)}#student-intake`} aria-current={university === option ? "true" : undefined}>{option}<span aria-hidden="true">→</span></a>
            ))}
          </div>
        </div>
      </section>

      <section className="concierge section on-dark" id="student-intake">
        <img className="concierge-bg" src="/bangkok/skyline.jpg" alt="" loading="lazy" />
        <div className="container concierge-grid">
          <div className="concierge-intro">
            <p className="eyebrow"><span /> Step two</p>
            <h2 className="h2">Send your<br />exchange <em>brief.</em></h2>
            <p className="lede">{university ? `Your brief is set for ${university}. ` : ""}Your details open in WhatsApp, ready to send. Mark replies with a shortlist that fits the budget and the commute.</p>
            <div className="concierge-steps">
              <div><b>1</b><span>Your details open in WhatsApp, ready to send.</span></div>
              <div><b>2</b><span>Mark replies with a shortlist that fits the brief.</span></div>
              <div><b>3</b><span>Availability and asking rent are confirmed before a viewing.</span></div>
            </div>
          </div>
          <IntakeForm key={university ?? "none"} personas={["exchange"]} university={university} />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
