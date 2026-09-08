import { studentHousingHref } from "../../lib/site-data";

export default function AboutAudience() {
  return (
    <section className="about-audience section reveal delay-2" aria-labelledby="audience-title" data-reveal>
      <div className="container">
        <header className="sec-head">
          <div><p className="eyebrow dark"><span /> Who we work with</p><h2 className="h2" id="audience-title">Two kinds of arrival.<br />One <em>practical</em> search.</h2></div>
          <p className="lede">Students and interns move to Bangkok on different calendars and different budgets, so we plan each search around the place you will spend your days.</p>
        </header>
        <div className="about-audience-grid">
          <a className="about-audience-card" href={studentHousingHref}>
            <b>Exchange students</b>
            <strong>A home for the semester</strong>
            <span>Arriving at Chulalongkorn, Mahidol, Srinakharinwirot, Kasem Bundit, Bangkok University, UTCC or another Bangkok campus. We match the home to the campus commute and a student budget, and we keep the move-in date in view.</span>
            <em className="text-link">Find by university →</em>
          </a>
          <a className="about-audience-card" href="/contact?persona=intern">
            <b>Interns</b>
            <strong>A base near the office</strong>
            <span>Starting a placement in Silom, Sathorn, Sukhumvit, Rama 9, Thong Lo or another business district. We plan the search around the office and the hours you will actually keep, so the commute never eats the evening.</span>
            <em className="text-link">Send your intern brief →</em>
          </a>
        </div>
      </div>
    </section>
  );
}
