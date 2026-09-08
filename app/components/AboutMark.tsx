import { whatsappUrl } from "../../lib/site-data";

export default function AboutMark() {
  return (
    <section className="about-mark on-dark section reveal delay-1" aria-labelledby="mark-title" data-reveal>
      <div className="container about-mark-grid">
        <div>
          <p className="eyebrow"><span /> Behind the name</p>
          <h2 className="h2" id="mark-title">Mark your place.<br />Find your <em>space.</em></h2>
        </div>
        <div>
          <p className="lede">The name is a small pun on Mark, the person behind the service. There is no hand-off: the person who reads your brief is the person who compares the buildings, confirms the rent, and arranges the viewing.</p>
          <p className="lede">Send a message with where you are headed and when you arrive. You will get a straight answer about what your budget buys in Bangkok, and a shortlist you can trust before you travel.</p>
          <div className="page-hero-links">
            <a className="text-link" href={whatsappUrl} target="_blank" rel="noreferrer">Talk to Mark on WhatsApp →</a>
            <a className="text-link" href="/contact">Send your brief →</a>
          </div>
        </div>
      </div>
    </section>
  );
}
