"use client";

import Link from "next/link";
import { useMemo } from "react";
import ListingCard from "./ListingCard";
import { areaOptions, budgetOptions, filterListings, type PublicListing } from "../../lib/listings-data";

type Props = {
  listings: PublicListing[];
  area: string;
  budget: string;
  onAreaChange: (area: string) => void;
  onBudgetChange: (budget: string) => void;
  /** Rendered above the search strip. Omit for a plain header-less collection. */
  header?: React.ReactNode;
};

// On the homepage this section is the cinematic hero's destination: it must stay
// a single root element with the .collection and .search-strip class names.
export default function ResidenceCollection({ listings, area, budget, onAreaChange, onBudgetChange, header }: Props) {
  const visible = useMemo(() => filterListings(listings, { area, budget }), [listings, area, budget]);
  return (
    <section className="collection" id="residences">
      <div className="container">
        {header}
        <section className="search-strip on-dark" id="search" aria-label="Bangkok condominium search">
          <label className="field"><span>Bangkok area</span><select value={area} onChange={(event) => onAreaChange(event.target.value)}>{areaOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="field"><span>Monthly budget</span><select value={budget} onChange={(event) => onBudgetChange(event.target.value)}>{budgetOptions.map((option) => <option key={option.label}>{option.label}</option>)}</select></label>
          <a className="btn gold" href="#residences">Show {visible.length} {visible.length === 1 ? "match" : "matches"} →</a>
        </section>
        {visible.length
          ? <div className="property-grid">{visible.map((listing, index) => <ListingCard key={listing.slug} listing={listing} index={index} />)}</div>
          : <div className="empty-state"><h3 className="h3">No exact match yet.</h3><p>Try another budget or ask Mark to search beyond the sample collection.</p><Link className="btn" href="/contact">Start a custom search</Link></div>}
      </div>
    </section>
  );
}
