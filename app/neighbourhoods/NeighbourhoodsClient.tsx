"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ListingCard from "../components/ListingCard";
import ListingFacetFilters from "../components/ListingFacetFilters";
import { AREA_ALL, filterListings, toNeighbourhoodsHref, toResidencesHref, type ListingFilters, type PublicListing } from "../../lib/listings-data";
import { neighbourhoods } from "../../lib/site-data";

type Props = { listings: PublicListing[]; initialArea: string; initialUniversity: string; initialProject: string };

export default function NeighbourhoodsClient({ listings, initialArea, initialUniversity, initialProject }: Props) {
  const [location, setLocation] = useState(initialArea);
  const [university, setUniversity] = useState(initialUniversity);
  const [developmentProject, setDevelopmentProject] = useState(initialProject);
  const narrowed = useMemo(() => filterListings(listings, { university, developmentProject }), [listings, university, developmentProject]);
  const selected = useMemo(() => filterListings(narrowed, { area: location }), [narrowed, location]);
  const chosen = neighbourhoods.find((area) => area.name === location);
  const listHead = useRef<HTMLDivElement>(null);
  const revealPending = useRef(false);

  function sync(filters: ListingFilters) {
    window.history.replaceState(null, "", toNeighbourhoodsHref(filters) + window.location.hash);
  }

  function selectFacet(key: "university" | "developmentProject", value: string) {
    if (key === "university") setUniversity(value); else setDevelopmentProject(value);
    sync({ area: location, university, developmentProject, [key]: value });
  }

  function clearFilters() {
    setLocation(AREA_ALL); setUniversity(""); setDevelopmentProject("");
    sync({});
  }

  function exploreNeighbourhood(name: string) {
    revealPending.current = true;
    setLocation(name === location ? AREA_ALL : name);
    sync({ area: name === location ? AREA_ALL : name, university, developmentProject });
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
          <div><p className="eyebrow dark"><span /> Find the right Bangkok residence</p><h1 className="h2">University &amp;<br /><em>project search.</em></h1></div>
          <p className="lede">Choose your university or a development project, then narrow the homes by neighbourhood. Compare space, station access and monthly rent.</p>
        </header>
        <div className="neighbourhood-search">
          <ListingFacetFilters listings={listings} university={university} developmentProject={developmentProject} onUniversityChange={(value) => selectFacet("university", value)} onProjectChange={(value) => selectFacet("developmentProject", value)} />
          {(university || developmentProject || location !== AREA_ALL) && <button type="button" className="text-link" onClick={clearFilters}>Clear filters</button>}
        </div>
        <div className="neighbourhood-layout">
          <div className="neighbourhood-rail" role="group" aria-label="Neighbourhoods">
            {neighbourhoods.map((area, index) => {
              const count = narrowed.filter((listing) => listing.district === area.name).length;
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
              <a className="text-link" href={toResidencesHref({ area: location, university, developmentProject })}>Open with filters →</a>
            </div>
            {selected.length
              ? <div className="property-grid">{selected.map((listing, index) => <ListingCard key={listing.slug} listing={listing} index={index} />)}</div>
              : <div className="empty-state"><h3 className="h3">No residences match these filters yet.</h3><p>Try another university, project or neighbourhood, or ask Mark to find a home for your requirements.</p><button type="button" className="btn" onClick={clearFilters}>Clear filters</button><a className="text-link" href="/contact">Send your brief →</a></div>}
            {chosen && <p className="area-listings-all">Showing {chosen.name} only. <button type="button" className="text-link" onClick={() => exploreNeighbourhood(chosen.name)}>Show all {narrowed.length} →</button></p>}
          </div>
        </div>
      </div>
    </section>
  );
}
