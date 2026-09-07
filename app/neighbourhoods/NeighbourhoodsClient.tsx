"use client";

import { useMemo, useState } from "react";
import ListingCard from "../components/ListingCard";
import { AREA_ALL, toResidencesHref, type PublicListing } from "../../lib/listings-data";
import { neighbourhoods } from "../../lib/site-data";

export default function NeighbourhoodsClient({ listings }: { listings: PublicListing[] }) {
  const [location, setLocation] = useState(AREA_ALL);
  const selected = useMemo(() => location === AREA_ALL ? listings : listings.filter((listing) => listing.district === location), [listings, location]);

  function exploreNeighbourhood(name: string) {
    setLocation(name === location ? AREA_ALL : name);
  }

  return (
    <section className="neighbourhoods section" id="neighbourhoods">
      <div className="container">
        <header className="sec-head">
          <div><p className="eyebrow dark"><span /> Begin with the life around the room</p><h1 className="h2">Explore by<br /><em>neighbourhood.</em></h1></div>
          <p className="lede">A boutique search should narrow the city before it adds more listings. Choose an area to see the current residences there, then compare the commute, unit, and monthly rent.</p>
        </header>
        <div className="neighbourhood-grid">
          {neighbourhoods.map((area, index) => {
            const count = listings.filter((listing) => listing.district === area.name).length;
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
        <div className="area-listings" aria-live="polite">
          <div className="area-listings-head">
            <div>
              <p className="eyebrow dark"><span /> {location === AREA_ALL ? "Every area" : location}</p>
              <h2 className="h3">{selected.length} {selected.length === 1 ? "residence" : "residences"} {location === AREA_ALL ? "in the collection" : `in ${location}`}</h2>
            </div>
            <a className="text-link" href={toResidencesHref({ area: location })}>Open with filters →</a>
          </div>
          {selected.length
            ? <div className="property-grid">{selected.map((listing, index) => <ListingCard key={listing.slug} listing={listing} index={index} />)}</div>
            : <div className="empty-state"><h3 className="h3">No residence listed here yet.</h3><p>Ask Mark to search {location} beyond the sample collection.</p><a className="btn" href="/contact">Send your brief</a></div>}
        </div>
      </div>
    </section>
  );
}
