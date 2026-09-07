import Link from "next/link";
export default function Manifesto() {
  return (
    <section className="manifesto on-dark reveal delay-3" id="approach" data-reveal>
      <div className="manifesto-image">
        <img src="/bangkok/night-city.jpg" alt="Bangkok skyline at night" loading="lazy" />
        <span className="manifesto-caption">Bangkok at night · Unsplash</span>
      </div>
      <div className="manifesto-copy">
        <p className="eyebrow"><span /> The REMARCABLE LIVING approach</p>
        <h2 className="h2">Less scrolling.<br />More <em>certainty.</em></h2>
        <p className="lede">Tell us where you work, how you live, and what you actually want to spend. We compare the building, commute, unit condition, and asking price before putting anything on your shortlist.</p>
        <div className="principles">
          <div><b>01</b><span>Realistic monthly budgets</span></div>
          <div><b>02</b><span>Neighbourhood-first matching</span></div>
          <div><b>03</b><span>Assistance through move-in</span></div>
        </div>
        <Link className="text-link" href="/contact">Start with your requirements →</Link>
      </div>
    </section>
  );
}
