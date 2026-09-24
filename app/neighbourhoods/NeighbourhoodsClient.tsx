"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ListingCard from "../components/ListingCard";
import { AREA_ALL, toResidencesHref, type PublicListing } from "../../lib/listings-data";
import { neighbourhoods } from "../../lib/site-data";

export default function NeighbourhoodsClient({ listings }: { listings: PublicListing[] }) {
  const [location, setLocation] = useState(AREA_ALL);
  const selected = useMemo(() => location === AREA_ALL ? listings : listings.filter((listing) => listing.district === location), [listings, location]);
  const chosen = neighbourhoods.find((area) => area.name === location);
  const listHead = useRef<HTMLDivElement>(null);
  const revealPending = useRef(false);

  function exploreNeighbourhood(name: string) {
    revealPending.current = true;
    setLocation(name === location ? AREA_ALL : name);
  }

  // After a choice, jump straight to the residences when their heading is off screen: on phones the
  // areas sit above the list, and on desktop the rail stays pinned while the list is scrolled.
  useEffect(() => {
    if (!revealPending.current || !listHead.current) return;
    revealPending.current = false;
    const top = listHead.current.getBoundingClientRect().top;
    const navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-height")) || 0;
    if (top < navHeight || top > window.innerHeight * .6) listHead.current.scrollIntoView({ block: "start", behavior: "instant" });
  }, [location]);

  return (
    <section className="neighbourhoods section" id="neighbourhoods">
      <div className="container">
        <header className="sec-head">
          <div><p className="eyebrow dark"><span /> Begin with the life around the room</p><h1 className="h2">Explore by<br /><em>neighbourhood.</em></h1></div>
          <p className="lede">A boutique search should narrow the city before it adds more listings. Choose an area to see the current residences there, then compare the commute, unit, and monthly rent.</p>
        </header>
        <div className="neighbourhood-layout">
          <div className="neighbourhood-rail" role="group" aria-label="Neighbourhoods">
            {neighbourhoods.map((area, index) => {
              const count = listings.filter((listing) => listing.district === area.name).length;
              return (
                <button className={`neighbourhood-card ${location === area.name ? "selected" : ""}`} key={area.name} type="button" onClick={() => exploreNeighbourhood(area.name)} aria-pressed={location === area.name}>
                  <span className="neighbourhood-image" style={{ backgroundImage: `url('${area.image}')` }} aria-hidden="true" />
                  <span className="neighbourhood-shade" aria-hidden="true" />
                  <span className="neighbourhood-index">{String(index + 1).padStart(2, "0")}</span>
                  {location === area.name && <span className="neighbourhood-selected">Selected</span>}
                  <span className="neighbourhood-copy"><small>{area.transit}</small><strong>{area.name}</strong><b>{count ? `${count} ${count === 1 ? "residence" : "residences"}` : "Search this area"}</b></span>
                </button>
              );
            })}
          </div>
          <div className="area-listings">
            <div className="area-listings-head" ref={listHead}>
              <div aria-live="polite">
                <p className="eyebrow dark"><span /> {chosen ? `${chosen.name} · ${chosen.transit}` : "Every area"}</p>
                <h2 className="h3">{selected.length} {selected.length === 1 ? "residence" : "residences"} {chosen ? `in ${chosen.name}` : "in the collection"}</h2>
                {chosen && <p className="area-note">{chosen.note}</p>}
              </div>
              <a className="text-link" href={toResidencesHref({ area: location })}>Open with filters →</a>
            </div>
            {selected.length
              ? <div className="property-grid">{selected.map((listing, index) => <ListingCard key={listing.slug} listing={listing} index={index} />)}</div>
              : <div className="empty-state"><h3 className="h3">No residence listed here yet.</h3><p>Ask Mark to search {location} beyond the sample collection.</p><a className="btn" href="/contact">Send your brief</a></div>}
            {chosen && <p className="area-listings-all">Showing {chosen.name} only. <button type="button" className="text-link" onClick={() => exploreNeighbourhood(chosen.name)}>Show all {listings.length} →</button></p>}
          </div>
        </div>
      </div>
    </section>
  );
}
