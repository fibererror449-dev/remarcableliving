"use client";

import { useState } from "react";
import ListingImage from "../ListingImage";
import { placeDescription, placeDirectories, placeHref, relatedListings, type DiscoveryPlace, type PlaceKind } from "../../lib/discovery-data";
import type { PublicListing } from "../../lib/listings-data";

export function PlaceCards({ places, listings }: { places: DiscoveryPlace[]; listings: PublicListing[] }) {
  return <div className="place-grid">{places.map(place => {
    const matches = relatedListings(place, listings);
    return <article className="place-card" key={place.id}>
      <a className="place-card-image" href={placeHref(place)} aria-label={`Explore ${place.name}`}><ListingImage src={matches[0]?.image ?? "/bangkok/skyline.jpg"} alt={matches[0] ? `Residence in the ${place.name} collection` : "Bangkok skyline"} /><span>{matches.length} {matches.length === 1 ? "residence" : "residences"}</span></a>
      <div><p className="eyebrow dark">{placeDirectories[place.kind].singular}</p><h3><a href={placeHref(place)}>{place.name}</a></h3><p>{placeDescription(place, listings)}</p><a className="text-link" href={placeHref(place)}>Explore collection →</a></div>
    </article>;
  })}</div>;
}

export default function DiscoveryDirectory({ kind, places, listings }: { kind: PlaceKind; places: DiscoveryPlace[]; listings: PublicListing[] }) {
  const [search, setSearch] = useState("");
  const matches = places.filter(place => place.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <section className="section"><div className="container directory-content">
    <div className="directory-toolbar"><label className="field"><span>Search {placeDirectories[kind].title.toLowerCase()}</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Enter a name" /></label><p role="status">{matches.length} {placeDirectories[kind].title.toLowerCase()}</p></div>
    <PlaceCards places={matches} listings={listings} />
    {!matches.length && <div className="empty-state"><h2 className="h3">No matching names.</h2><p>Try another name or ask Mark for a shortlist.</p><a className="text-link" href="/contact">Send your brief →</a></div>}
  </div></section>;
}
