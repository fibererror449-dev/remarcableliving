export default function Manifesto() {
  return (
    <section className="manifesto on-dark reveal delay-3" id="about" data-reveal>
      <div className="manifesto-image">
        <img src="/bangkok/night-city.jpg" alt="Bangkok skyline at night" loading="lazy" />
        <span className="manifesto-caption">Bangkok at night · Unsplash</span>
      </div>
      <div className="manifesto-copy">
        <p className="eyebrow"><span /> Who we are</p>
        <h2 className="h2">Less scrolling.<br />More <em>certainty.</em></h2>
        <p className="lede">Most people arriving in Bangkok for a semester or an internship have a few weeks, a fixed budget, and no way to tell a good building from a good photograph. We exist to close that gap.</p>
        <p className="lede">Tell us where you will study or work, how you like to live, and what you can really spend each month. We compare the building, the commute, the condition of the unit, and the asking rent before anything reaches your shortlist.</p>
        <div className="principles">
          <div><b>01</b><span><strong>Realistic monthly budgets</strong><small>You name the number. We search inside it, and we say so when a wish does not fit.</small></span></div>
          <div><b>02</b><span><strong>Neighbourhood-first matching</strong><small>The home is chosen for the life around it: the walk to the station, the ride to campus or the office, the street at night.</small></span></div>
          <div><b>03</b><span><strong>Assistance through move-in</strong><small>The search does not end at the viewing. We stay with you until the keys are in your hand.</small></span></div>
        </div>
        <a className="text-link" href="/contact">Start with your requirements →</a>
      </div>
    </section>
  );
}
