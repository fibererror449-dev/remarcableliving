"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Persona = "exchange" | "intern";
type PublicListing = { id:number; slug:string; name:string; district:string; rent:number; image:string; bedrooms:number; bathrooms:number; sizeSqm:number; status:string; stationType:string; stationName:string; walkMinutes:number };

const previewListings: PublicListing[] = [
  { id:8, slug:"baan-klang-krung-siam-2br", name:"Baan Klang Krung Siam · 2 Bedrooms", district:"Ratchathewi", rent:30000, image:"/properties/baan-klang-krung-siam.jpg", bedrooms:2, bathrooms:2, sizeSqm:74, status:"available", stationType:"BTS", stationName:"Ratchathewi", walkMinutes:3 },
  { id:7, slug:"centurion-park-ari-soi-5-1br", name:"Centurion Park · 1 Bedroom", district:"Ari", rent:25000, image:"/properties/centurion-park-ari.jpg", bedrooms:1, bathrooms:1, sizeSqm:62, status:"available", stationType:"BTS", stationName:"Ari", walkMinutes:8 },
  { id:1, slug:"centric-ari-station-1br", name:"Centric Ari Station · 1 Bedroom", district:"Ari", rent:17000, image:"/bangkok/green-condo.jpg", bedrooms:1, bathrooms:1, sizeSqm:28, status:"available", stationType:"BTS", stationName:"Ari", walkMinutes:3 },
  { id:2, slug:"noble-around-ari-1br", name:"Noble Around Ari · 1 Bedroom", district:"Ari", rent:20000, image:"/bangkok/skyline.jpg", bedrooms:1, bathrooms:1, sizeSqm:26.58, status:"verify", stationType:"BTS", stationName:"Ari", walkMinutes:2 },
  { id:3, slug:"thru-thonglor-1br", name:"Thru Thonglor · 1 Bedroom", district:"Thonglor", rent:23000, image:"/bangkok/night-city.jpg", bedrooms:1, bathrooms:1, sizeSqm:37, status:"verify", stationType:"BTS", stationName:"Thong Lo", walkMinutes:18 },
  { id:5, slug:"supalai-veranda-rama9-1br", name:"Supalai Veranda Rama 9 · 1 Bedroom", district:"Rama 9", rent:17000, image:"/bangkok/bang-wa.jpg", bedrooms:1, bathrooms:1, sizeSqm:42, status:"available", stationType:"MRT", stationName:"Phra Ram 9", walkMinutes:14 },
  { id:6, slug:"belle-grand-rama9-1br", name:"Belle Grand Rama 9 · 1 Bedroom", district:"Rama 9", rent:20000, image:"/bangkok/night-city.jpg", bedrooms:1, bathrooms:1, sizeSqm:42, status:"verify", stationType:"MRT", stationName:"Phra Ram 9", walkMinutes:8 },
];
const neighbourhoods = [
  { name:"Ari", transit:"BTS Ari", image:"/bangkok/green-condo.jpg", note:"Start with the commute, then compare space and monthly rent." },
  { name:"Ratchathewi", transit:"BTS Ratchathewi", image:"/properties/baan-klang-krung-siam.jpg", note:"A central search anchored around verified unit details." },
  { name:"Thonglor", transit:"BTS Thong Lo", image:"/bangkok/night-city.jpg", note:"Compare the full door-to-door journey, not the district name alone." },
  { name:"Rama 9", transit:"MRT Phra Ram 9", image:"/bangkok/skyline.jpg", note:"Review rent, usable space, and station access side by side." },
];
const universityOptions = [
  "Chulalongkorn University",
  "Mahidol University",
  "Srinakharinwirot University",
  "Kasem Bundit University",
  "Bangkok University",
  "UTCC",
  "Another Bangkok university",
];
const workplaceOptions = [
  "Silom / Sathorn",
  "Sukhumvit business district",
  "Rama 9 / Asok",
  "Thong Lo / Ekkamai",
  "Ari / Phahonyothin",
  "Phrom Phong / Ekkamai",
  "On Nut",
  "Other area",
];

export default function Home() {
  const [location, setLocation] = useState("All Bangkok areas");
  const [budget, setBudget] = useState("Any budget");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [properties, setProperties] = useState<PublicListing[]>(previewListings);
  const [persona, setPersona] = useState<Persona>("exchange");
  useEffect(() => { fetch("/api/listings").then((response) => response.json()).then((data) => { if (data.listings?.length) setProperties(data.listings); }).catch(() => undefined); }, []);

  const visibleProperties = useMemo(() => {
    return properties.filter((property) => {
      const areaMatch = location === "All Bangkok areas" || property.district === location;
      const value = property.rent;
      const budgetMatch = budget === "Any budget" || (budget === "Under ฿20,000" && value < 20000) || (budget === "฿20,000–฿25,000" && value >= 20000 && value <= 25000) || (budget === "฿25,000+" && value > 25000);
      return areaMatch && budgetMatch;
    });
  }, [location, budget, properties]);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (elements.length === 0) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((element) => element.classList.add("reveal-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add("reveal-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.2 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  function requestViewing(name = "a Bangkok condominium") {
    setNotice(`Viewing request started for ${name}.`);
    document.querySelector("#assist")?.scrollIntoView({ behavior: "smooth" });
  }

  function exploreNeighbourhood(name: string) {
    setLocation(name);
    document.querySelector("#residences")?.scrollIntoView({ behavior: "smooth" });
  }

  function sendWhatsappMessage(payload: string) {
    window.open(`https://wa.me/66634962466?text=${encodeURIComponent(payload)}`, "_blank");
  }

  function handleIntakeSubmit(event: FormEvent<HTMLFormElement>, activePersona: Persona) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const contact = String(form.get("contact") ?? "").trim();
    const budgetValue = String(form.get("budget") ?? "").trim() || "not specified";
    const note = String(form.get("note") ?? "").trim() || "not specified";

    if (!name || !contact) {
      setNotice("Please include your name and contact details before continuing.");
      return;
    }

    let message: string;
    if (activePersona === "exchange") {
      const university = String(form.get("university") ?? "not specified");
      const program = String(form.get("exchangeProgram") ?? "not specified");
      const startDate = String(form.get("startDate") ?? "not specified");
      const roomType = String(form.get("roomType") ?? "not specified");
      message = [
        `Hi Mark, I’m ${name} (${contact}).`,
        "I’m applying as an exchange student.",
        `University/school: ${university}.`,
        `Program: ${program}.`,
        `Preferred start date: ${startDate}.`,
        `Room setup: ${roomType}.`,
        `Target budget: ${budgetValue}.`,
        `Must-haves/notes: ${note}.`,
      ].join(" ");
    } else {
      const workplace = String(form.get("workplace") ?? "not specified");
      const internRole = String(form.get("internRole") ?? "not specified");
      const duration = String(form.get("duration") ?? "not specified");
      const startDate = String(form.get("startDate") ?? "not specified");
      message = [
        `Hi Mark, I’m ${name} (${contact}).`,
        "I’m reaching out through the intern intake path.",
        `Workplace: ${workplace}.`,
        `Role: ${internRole}.`,
        `Expected start date: ${startDate}.`,
        `Placement duration: ${duration}.`,
        `Target budget: ${budgetValue}.`,
        `Must-haves/notes: ${note}.`,
      ].join(" ");
    }

    sendWhatsappMessage(message);
    setNotice("Opening WhatsApp to send your tailored intake details.");
  }

  return (
    <main>
      <section className="hero" id="home" data-reveal>
        <div className="hero-image" aria-hidden="true" /><div className="hero-shade" aria-hidden="true" />
        <nav className="nav" aria-label="Primary navigation">
          <a className="brand" href="#home" aria-label="REMARCABLE LIVING home"><span className="brand-mark">R</span><span>REMARCABLE LIVING</span></a>
          <button className="menu-button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><span /><span /></button>
          <div className={`nav-links ${menuOpen ? "open" : ""}`}>
            <a href="#residences" onClick={() => setMenuOpen(false)}>Residences</a>
            <a href="#neighbourhoods" onClick={() => setMenuOpen(false)}>Neighbourhoods</a>
            <a href="#approach" onClick={() => setMenuOpen(false)}>Our approach</a>
            <a href="#journal" onClick={() => setMenuOpen(false)}>Bangkok guide</a>
            <a className="nav-whatsapp" href="https://wa.me/66634962466" target="_blank" rel="noreferrer">WhatsApp Mark</a>
          </div>
        </nav>
        <div className="hero-copy reveal delay-1" data-reveal>
          <p className="eyebrow"><span /> Bangkok condominium assistance</p>
          <h1>Mark your place.<br /><em>Find your space.</em></h1>
          <p className="hero-intro">Bangkok condos at prices that make sense—with useful neighbourhood context and one person helping you from shortlist to keys.</p>
          <div className="hero-actions"><a className="primary-button" href="#search">Search Bangkok areas <span>↓</span></a><button className="text-button" onClick={() => requestViewing()}>Ask Mark for help</button></div>
        </div>
        <div className="hero-index reveal delay-2" data-reveal><b>BKK</b><span>—</span><small>Curated Bangkok-wide</small></div>
        <a className="scroll-cue" href="#search"><span>Find your area</span><i>↓</i></a>
      </section>

      <section className="search-strip reveal delay-3" id="search" aria-label="Bangkok condominium search" data-reveal>
        <label><span>Bangkok area</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option>All Bangkok areas</option><option>Ratchathewi</option><option>Thonglor</option><option>Phrom Phong</option><option>Sathorn</option><option>Ari</option><option>Rama 9</option><option>On Nut</option></select></label>
        <label><span>Monthly budget</span><select value={budget} onChange={(event) => setBudget(event.target.value)}><option>Any budget</option><option>Under ฿20,000</option><option>฿20,000–฿25,000</option><option>฿25,000+</option></select></label>
        <div><span>What we check</span><strong>Price · commute · condition</strong></div>
        <a href="#residences">Show {visibleProperties.length} matches <span>→</span></a>
      </section>

      <section className="collection reveal delay-4" id="residences" data-reveal>
        <header className="section-heading"><div><p className="eyebrow dark"><span /> Selected for real Bangkok life</p><h2>Prices that<br /><em>make sense.</em></h2></div><p>Representative asking rents based on current neighbourhood ranges. Final availability and negotiated rent are always confirmed before viewing.<a className="inventory-link" href="/inventory">Browse the complete available inventory →</a></p></header>
        {visibleProperties.length ? <div className="property-grid">{visibleProperties.map((property, index) => (
          <article className="property-card" key={property.name}>
            <div className="property-visual"><img src={property.image} alt={`Bangkok condominium option in ${property.district}`} /><span className="property-number">0{index + 1}</span><span className={`property-tag status-${property.status}`}>{property.status === "available" ? "Available" : property.status === "viewing" ? "Viewing" : "Confirm status"}</span><a className="card-link" aria-label={`View ${property.name}`} href={`/residences/${property.slug}`}>↗</a></div>
            <div className="property-info"><div><p>{property.district} · {property.stationType} {property.stationName} · {property.walkMinutes} min walk</p><h3>{property.name}</h3></div><div className="property-meta"><b>฿{property.rent.toLocaleString()} / month</b><span>{property.bedrooms} bed · {property.bathrooms} bath · {property.sizeSqm} sq m</span></div></div>
          </article>
        ))}</div> : <div className="empty-state"><h3>No exact match yet.</h3><p>Try another budget or ask Mark to search beyond the sample collection.</p><button onClick={() => requestViewing()}>Start a custom search</button></div>}
      </section>

      <section className="neighbourhoods reveal delay-2" id="neighbourhoods" data-reveal>
        <header className="neighbourhood-heading">
          <div><p className="eyebrow dark"><span /> Begin with the life around the room</p><h2>Explore by<br /><em>neighbourhood.</em></h2></div>
          <p>A boutique search should narrow the city before it adds more listings. Choose an area to filter the current collection, then compare the commute, unit, and monthly rent.</p>
        </header>
        <div className="neighbourhood-grid">
          {neighbourhoods.map((area, index) => {
            const count = properties.filter((property) => property.district === area.name).length;
            return (
              <button className={`neighbourhood-card ${location === area.name ? "selected" : ""}`} key={area.name} type="button" onClick={() => exploreNeighbourhood(area.name)} aria-pressed={location === area.name}>
                <span className="neighbourhood-image" style={{ backgroundImage: `url('${area.image}')` }} aria-hidden="true" />
                <span className="neighbourhood-shade" aria-hidden="true" />
                <span className="neighbourhood-index">0{index + 1}</span>
                <span className="neighbourhood-copy"><small>{area.transit}</small><strong>{area.name}</strong><span>{area.note}</span><b>{count ? `View ${count} ${count === 1 ? "residence" : "residences"}` : "Search this area"} →</b></span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="manifesto reveal delay-3" id="approach" data-reveal>
        <div className="manifesto-image" role="img" aria-label="Bangkok skyline at night" />
        <div className="manifesto-copy"><p className="eyebrow"><span /> The REMARCABLE LIVING approach</p><h2>Less scrolling.<br />More <em>certainty.</em></h2><p>Tell us where you work, how you live, and what you actually want to spend. We compare the building, commute, unit condition, and asking price before putting anything on your shortlist.</p><div className="principles"><div><b>01</b><span>Realistic monthly budgets</span></div><div><b>02</b><span>Neighbourhood-first matching</span></div><div><b>03</b><span>Assistance through move-in</span></div></div><a href="#assist">Start with your requirements <span>→</span></a></div>
      </section>

      <section className="service-journey reveal delay-1" aria-labelledby="journey-title" data-reveal>
        <header><p className="eyebrow dark"><span /> A clear route to the viewing</p><h2 id="journey-title">From your brief<br />to the <em>front door.</em></h2><p>One practical sequence keeps the search personal without making it vague. Each step reduces the list before you spend time travelling across Bangkok.</p></header>
        <div className="journey-steps">
          <article><b>01</b><h3>Brief</h3><p>Share your workplace, budget, move-in date, and non-negotiables.</p></article>
          <article><b>02</b><h3>Compare</h3><p>Review area, commute, unit condition, space, and asking rent together.</p></article>
          <article><b>03</b><h3>Confirm</h3><p>Reconfirm current availability and asking rent before arranging a visit.</p></article>
          <article><b>04</b><h3>View</h3><p>Visit the strongest options and continue with the home that fits.</p></article>
        </div>
        <a className="journey-cta" href="#assist">Tell Mark what you need <span>→</span></a>
      </section>

      <section className="journal reveal delay-2" id="journal" data-reveal><p className="eyebrow dark"><span /> Know Bangkok before you sign</p><div className="journal-row"><h2>Choose the area.<br />Then the <em>room.</em></h2><div className="journal-card"><span>Bangkok renter note · 5 min</span><h3>Thonglor energy, Ari calm, or On Nut value?</h3><p>Your best district is usually the one that protects your daily time—not the one with the fanciest brochure.</p><a href="#search">Compare areas →</a></div></div></section>

      <section className="concierge reveal delay-3" id="assist" data-reveal>
        <p className="eyebrow"><span /> Personal rental assistance</p><h2>Tell Mark what<br />home must <em>do.</em></h2><p>Share your workplace, move-in date, budget, and must-haves. We will return with a practical Bangkok shortlist.</p>
        {notice && <div className="notice" role="status">{notice}</div>}
        <div className="intake-switcher reveal delay-2" data-reveal role="tablist" aria-label="Choose intake path">
          <button type="button" role="tab" aria-selected={persona === "exchange"} aria-controls="exchange-intake" onClick={() => setPersona("exchange")}>Exchange student</button>
          <button type="button" role="tab" aria-selected={persona === "intern"} aria-controls="intern-intake" onClick={() => setPersona("intern")}>Intern</button>
        </div>
        <div className={`intake-slider ${persona} reveal delay-2`} data-reveal>
          <div className="intake-panels">
            <form id="exchange-intake" onSubmit={(event) => handleIntakeSubmit(event, "exchange")} className="concierge-form">
              <label><span>Your name</span><input required name="name" placeholder="Full name" /></label>
              <label><span>Contact</span><input required name="contact" placeholder="LINE, WhatsApp or email" /></label>
              <label><span>Target budget</span><input required name="budget" placeholder="฿24,000 / month" /></label>
              <label><span>University or school</span><select required name="university"><option value="">Select your university</option>{universityOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label><span>Program format</span><input name="exchangeProgram" placeholder="Exchange semester / summer programme" /></label>
              <label><span>Expected start date</span><input name="startDate" type="month" /></label>
              <label><span>Room setup</span><input name="roomType" placeholder="single studio / shared room" /></label>
              <label><span>Must-haves</span><input name="note" placeholder="Quiet floor, fast internet, parking for scooter" /></label>
              <button type="submit">Exchange intake to Mark <span>↗</span></button>
            </form>
            <form id="intern-intake" onSubmit={(event) => handleIntakeSubmit(event, "intern")} className="concierge-form">
              <label><span>Your name</span><input required name="name" placeholder="Full name" /></label>
              <label><span>Contact</span><input required name="contact" placeholder="LINE, WhatsApp or email" /></label>
              <label><span>Target budget</span><input required name="budget" placeholder="฿18,000 / month" /></label>
              <label><span>Workplace</span><select required name="workplace"><option value="">Select workplace area</option>{workplaceOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label><span>Intern role / focus</span><input name="internRole" placeholder="Design / product / operations" /></label>
              <label><span>Expected start date</span><input name="startDate" type="month" /></label>
              <label><span>Placement duration</span><input name="duration" placeholder="3 to 6 months" /></label>
              <label><span>Must-haves</span><input name="note" placeholder="Early commute windows, quiet study area" /></label>
              <button type="submit">Intern intake to Mark <span>↗</span></button>
            </form>
          </div>
        </div>
      </section>

      <footer><a className="brand" href="#home" aria-label="REMARCABLE LIVING home"><span className="brand-mark">R</span><span>REMARCABLE LIVING</span></a><p>Mark your place. Find your space.</p><div><a href="#residences">Residences</a><a href="#neighbourhoods">Neighbourhoods</a><a href="#approach">Approach</a><a href="#assist">Contact</a></div><small>© 2026 REMARCABLE LIVING · Photography: Unsplash contributors</small></footer>
    </main>
  );
}
