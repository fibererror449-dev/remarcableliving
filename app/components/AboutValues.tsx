import { aboutValues } from "../../lib/site-data";

export default function AboutValues() {
  return (
    <section className="about-values section reveal delay-1" aria-labelledby="values-title" data-reveal>
      <div className="container">
        <header className="sec-head">
          <div><p className="eyebrow dark"><span /> What we stand for</p><h2 className="h2" id="values-title">Honest about the home.<br />Clear about the <em>cost.</em></h2></div>
          <p className="lede">A few commitments shape every shortlist we send. They are the reason the search stays short and the viewings are worth the trip.</p>
        </header>
        <div className="about-values-grid">
          {aboutValues.map((value, index) => (
            <article key={value.title}><b>{String(index + 1).padStart(2, "0")}</b><h3 className="h3">{value.title}</h3><p>{value.note}</p></article>
          ))}
        </div>
      </div>
    </section>
  );
}
