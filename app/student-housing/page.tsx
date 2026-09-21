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
            <p className="lede student-hero-copy">Just tell us three things: your university, your move-in date, and your budget. We will do the hard work! We check the travel time, make sure the room is safe and clean, and get you a good price. You only see the best choices.</p>
            <div className="page-hero-links">
              <a className="text-link" href="/residences">See the current collection →</a>
            </div>
          </div>
        </div>
      </header>

      <section className="section" aria-labelledby="universities-title">
        <div className="container">
          <header className="sec-head">
            <div><p className="eyebrow dark"><span /> Step one</p><h2 className="h2" id="universities-title">Choose your<br /><em>university.</em></h2></div>
            <p className="lede">Select your campus to automatically update your form below. We map out the actual walking and transit times for every property on your shortlist—so you never have to guess your commute.</p>
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
            <p className="lede">Fill out your preferences below, and let’s find your perfect home for the semester.</p>
            <div className="concierge-steps">
              <div><b>1</b><span><strong>Start With a Tap.</strong> Review your details and tap send to open our chat in WhatsApp.</span></div>
              <div><b>2</b><span><strong>Get Your Custom Shortlist.</strong> Mark and his team will reply quickly with a custom shortlist that perfectly matches your budget and commute.</span></div>
              <div><b>3</b><span><strong>Tour From Anywhere.</strong> We will confirm real-time availability and final rent prices, and then schedule a virtual viewing for you.</span></div>
              <div><b>4</b><span><strong>Secure Your Home.</strong> To secure the unit, you’ll pay the booking deposit directly to the owner, which will simply become your first month’s rent. Don’t worry about the details—we’ll take care of all the paperwork, ownership checks, and everything else you need.</span></div>
              <div><b>5</b><span><strong>Arrive Stress-Free.</strong> Once your two-month deposit is completed before arrival, Mark’s team will be waiting for you at the airport to drive you straight to your new front door—for free! Don’t worry if your flight lands late at night. We will be there with your keys and everything you need to settle in.</span></div>
            </div>
          </div>
          <IntakeForm key={university ?? "none"} personas={["exchange"]} university={university} />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
