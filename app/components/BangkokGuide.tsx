import { guideNotes } from "../../lib/site-data";

export default function BangkokGuide() {
  return (
    <section className="before-sign section reveal delay-2" id="guide" data-reveal>
      <div className="container before-sign-grid">
        <div className="before-sign-head">
          <p className="eyebrow"><span /> Know Bangkok before you sign</p>
          <h2 className="h2">Choose the area.<br />Then the <em>room.</em></h2>
        </div>
        <div className="before-sign-list">
          {guideNotes.map((item) => (
            <a key={item.href} href={item.href}>
              <span><strong>{item.title}</strong><span className="meta">{item.note}</span></span>
              <span className="text-link">{item.cta} →</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
