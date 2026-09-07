"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import CinematicHero from "./CinematicHero";
import ListingImage from "./ListingImage";
import SiteFooter from "./components/SiteFooter";
import Manifesto from "./components/home/Manifesto";
import BeforeYouSign from "./components/home/BeforeYouSign";

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

function statusLabel(status: string) {
  return status === "available" ? "Available" : status === "viewing" ? "Viewing" : "Confirm status";
}

// Layout coordinates ignore the cinematic transform on the live collection.
// Native anchor scrolling uses its temporary on-screen laptop position instead.
function scrollToContent(id: string) {
  let node = document.getElementById(id);
  if (!node) return;
  const story = node.closest<HTMLElement>(".cinema:not(.cinema-static)");
  const stage = story?.querySelector<HTMLElement>(".cinema-stage");
  let top = 0;
  while (node) {
    if (node === stage && story) {
      // Sticky offsetTop includes its current pinned displacement. Use the
      // story's document origin instead, even during a smooth anchor jump.
      top += window.scrollY + story.getBoundingClientRect().top + story.offsetHeight - stage.offsetHeight;
      break;
    }
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  window.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
}

function handleContentLink(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element).closest("a");
  const hash = link?.getAttribute("href");
  if (hash !== "#residences" && hash !== "#search") return;
  event.preventDefault();
  window.history.pushState(null, "", hash);
  scrollToContent(hash.slice(1));
}

export default function Home() {
  useEffect(() => {
    // Delegated anchor handling also receives native keyboard link activation.
    document.addEventListener("click", handleContentLink);
    return () => document.removeEventListener("click", handleContentLink);
  }, []);
  const [location, setLocation] = useState("All Bangkok areas");
  const [budget, setBudget] = useState("Any budget");
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
    scrollToContent("residences");
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
      <CinematicHero listings={properties} onExploreArea={exploreNeighbourhood}>

      <section className="collection" id="residences">
        <div className="container">
          <header className="sec-head">
            <div>
              <p className="eyebrow dark"><span /> Selected for real Bangkok life</p>
              <h2 className="h2">Prices that<br /><em>make sense.</em></h2>
            </div>
            <div className="sec-head-aside">
              <p className="lede">Representative asking rents based on current neighbourhood ranges. Final availability and negotiated rent are always confirmed before viewing.</p>
              <a className="text-link inventory-link" href="/inventory">Browse the complete available inventory →</a>
            </div>
          </header>

          <section className="search-strip on-dark" id="search" aria-label="Bangkok condominium search">
            <label className="field"><span>Bangkok area</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option>All Bangkok areas</option><option>Ratchathewi</option><option>Thonglor</option><option>Phrom Phong</option><option>Sathorn</option><option>Ari</option><option>Rama 9</option><option>On Nut</option></select></label>
            <label className="field"><span>Monthly budget</span><select value={budget} onChange={(event) => setBudget(event.target.value)}><option>Any budget</option><option>Under ฿20,000</option><option>฿20,000–฿25,000</option><option>฿25,000+</option></select></label>
            <a className="btn gold" href="#residences">Show {visibleProperties.length} {visibleProperties.length === 1 ? "match" : "matches"} →</a>
          </section>

          {visibleProperties.length ? <div className="property-grid">{visibleProperties.map((property, index) => (
            <article className="property-card" key={property.slug}>
              <div className="property-visual">
                <ListingImage src={property.image} alt={`Bangkok condominium option in ${property.district}`} />
                <span className={`chip property-tag ${property.status}`}>{statusLabel(property.status)}</span>
                <span className="property-number">{String(index + 1).padStart(2, "0")}</span>
                <a className="card-link" aria-label={`View ${property.name}`} href={`/residences/${property.slug}`}>↗</a>
              </div>
              <div className="property-info">
                <p className="meta">{property.district} · {property.stationType} {property.stationName} · {property.walkMinutes} min walk</p>
                <h3>{property.name}</h3>
                <div className="property-meta"><b>฿{property.rent.toLocaleString()} / month</b><span className="meta">{property.bedrooms} bed · {property.bathrooms} bath · {property.sizeSqm} sq m</span></div>
              </div>
            </article>
          ))}</div> : <div className="empty-state"><h3 className="h3">No exact match yet.</h3><p>Try another budget or ask Mark to search beyond the sample collection.</p><button className="btn" type="button" onClick={() => requestViewing()}>Start a custom search</button></div>}
        </div>
      </section>
      </CinematicHero>

      <section className="neighbourhoods section reveal delay-2" id="neighbourhoods" data-reveal>
        <div className="container">
          <header className="sec-head">
            <div><p className="eyebrow dark"><span /> Begin with the life around the room</p><h2 className="h2">Explore by<br /><em>neighbourhood.</em></h2></div>
            <p className="lede">A boutique search should narrow the city before it adds more listings. Choose an area to filter the current collection, then compare the commute, unit, and monthly rent.</p>
          </header>
          <div className="neighbourhood-grid">
            {neighbourhoods.map((area, index) => {
              const count = properties.filter((property) => property.district === area.name).length;
              return (
                <button className={`neighbourhood-card ${location === area.name ? "selected" : ""}`} key={area.name} type="button" onClick={() => exploreNeighbourhood(area.name)} aria-pressed={location === area.name}>
                  <span className="neighbourhood-image" style={{ backgroundImage: `url('${area.image}')` }} aria-hidden="true" />
                  <span className="neighbourhood-shade" aria-hidden="true" />
                  <span className="neighbourhood-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="neighbourhood-copy"><small>{area.transit}</small><strong>{area.name}</strong><span>{area.note}</span><b><span>{count ? `View ${count} ${count === 1 ? "residence" : "residences"}` : "Search this area"} →</span></b></span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <Manifesto />

      <section className="service-journey section reveal delay-1" aria-labelledby="journey-title" data-reveal>
        <div className="container">
          <header className="sec-head">
            <div><p className="eyebrow dark"><span /> A clear route to the viewing</p><h2 className="h2" id="journey-title">From your brief<br />to the <em>front door.</em></h2></div>
            <p className="lede">One practical sequence keeps the search personal without making it vague. Each step reduces the list before you spend time travelling across Bangkok.</p>
          </header>
          <div className="journey-steps">
            <article><b>01</b><h3 className="h3">Brief</h3><p>Share your workplace, budget, move-in date, and non-negotiables.</p></article>
            <article><b>02</b><h3 className="h3">Compare</h3><p>Review area, commute, unit condition, space, and asking rent together.</p></article>
            <article><b>03</b><h3 className="h3">Confirm</h3><p>Reconfirm current availability and asking rent before arranging a visit.</p></article>
            <article><b>04</b><h3 className="h3">View</h3><p>Visit the strongest options and continue with the home that fits.</p></article>
          </div>
          <a className="journey-cta" href="#assist">Tell Mark what you need <span>→</span></a>
        </div>
      </section>

      <BeforeYouSign />

      <section className="concierge section on-dark reveal delay-3" id="assist" data-reveal>
        <img className="concierge-bg" src="/bangkok/skyline.jpg" alt="" loading="lazy" />
        <div className="container concierge-grid">
          <div className="concierge-intro">
            <p className="eyebrow"><span /> Personal rental assistance</p>
            <h2 className="h2">Tell Mark what<br />home must <em>do.</em></h2>
            <p className="lede">Share your workplace, move-in date, budget, and must-haves. We will return with a practical Bangkok shortlist.</p>
            <div className="concierge-steps">
              <div><b>1</b><span>Your details open in WhatsApp, ready to send.</span></div>
              <div><b>2</b><span>Mark replies with a shortlist that fits the brief.</span></div>
              <div><b>3</b><span>Availability and asking rent are confirmed before a viewing.</span></div>
            </div>
          </div>
          <div className="concierge-card">
            {notice && <div className="notice" role="status">{notice}</div>}
            <div className="intake-switcher" role="tablist" aria-label="Choose intake path">
              <button type="button" role="tab" aria-selected={persona === "exchange"} aria-controls="exchange-intake" onClick={() => setPersona("exchange")}>Exchange student</button>
              <button type="button" role="tab" aria-selected={persona === "intern"} aria-controls="intern-intake" onClick={() => setPersona("intern")}>Intern</button>
            </div>
            <form id="exchange-intake" role="tabpanel" hidden={persona !== "exchange"} onSubmit={(event) => handleIntakeSubmit(event, "exchange")} className="concierge-form">
              <label><span>Your name</span><input required name="name" placeholder="Full name" /></label>
              <label><span>Contact</span><input required name="contact" placeholder="LINE, WhatsApp or email" /></label>
              <label><span>Target budget</span><input required name="budget" placeholder="฿24,000 / month" /></label>
              <label><span>University or school</span><select required name="university" defaultValue=""><option value="">Select your university</option>{universityOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label><span>Program format</span><input name="exchangeProgram" placeholder="Exchange semester / summer programme" /></label>
              <label><span>Expected start date</span><input name="startDate" type="month" /></label>
              <label><span>Room setup</span><input name="roomType" placeholder="Single studio / shared room" /></label>
              <label><span>Must-haves</span><input name="note" placeholder="Quiet floor, fast internet" /></label>
              <button className="btn gold" type="submit">Exchange intake to Mark <span>↗</span></button>
            </form>
            <form id="intern-intake" role="tabpanel" hidden={persona !== "intern"} onSubmit={(event) => handleIntakeSubmit(event, "intern")} className="concierge-form">
              <label><span>Your name</span><input required name="name" placeholder="Full name" /></label>
              <label><span>Contact</span><input required name="contact" placeholder="LINE, WhatsApp or email" /></label>
              <label><span>Target budget</span><input required name="budget" placeholder="฿18,000 / month" /></label>
              <label><span>Workplace</span><select required name="workplace" defaultValue=""><option value="">Select workplace area</option>{workplaceOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label><span>Intern role / focus</span><input name="internRole" placeholder="Design / product / operations" /></label>
              <label><span>Expected start date</span><input name="startDate" type="month" /></label>
              <label><span>Placement duration</span><input name="duration" placeholder="3 to 6 months" /></label>
              <label><span>Must-haves</span><input name="note" placeholder="Early commute windows, quiet study area" /></label>
              <button className="btn gold" type="submit">Intern intake to Mark <span>↗</span></button>
            </form>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
