import Link from "next/link";
import { journeySteps } from "../../lib/site-data";

export default function JourneySteps() {
  return (
    <section className="service-journey section reveal delay-1" aria-labelledby="journey-title" data-reveal>
      <div className="container">
        <header className="sec-head">
          <div><p className="eyebrow dark"><span /> A clear route to the viewing</p><h2 className="h2" id="journey-title">From your brief<br />to the <em>front door.</em></h2></div>
          <p className="lede">One practical sequence keeps the search personal without making it vague. Each step reduces the list before you spend time travelling across Bangkok.</p>
        </header>
        <div className="journey-steps">
          {journeySteps.map((step, index) => (
            <article key={step.title}><b>{String(index + 1).padStart(2, "0")}</b><h3 className="h3">{step.title}</h3><p>{step.note}</p></article>
          ))}
        </div>
        <Link className="journey-cta" href="/contact">Tell Mark what you need <span>→</span></Link>
      </div>
    </section>
  );
}
