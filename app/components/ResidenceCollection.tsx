"use client";

import { useMemo } from "react";
import ListingCard from "./ListingCard";
import ListingFacetFilters from "./ListingFacetFilters";
import { areaOptions, budgetOptions, filterListings, type PublicListing } from "../../lib/listings-data";

type Props = {
  listings: PublicListing[];
  area: string;
  budget: string;
  onAreaChange: (area: string) => void;
  onBudgetChange: (budget: string) => void;
  facets?: Omit<React.ComponentProps<typeof ListingFacetFilters>, "listings">;
  pagination?: { name: string; page: number; pageSize: number; onNameChange: (name: string) => void; onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void };
  /** Rendered above the search strip. Omit for a plain header-less collection. */
  header?: React.ReactNode;
};

// On the homepage this section is the cinematic hero's destination: it must stay
// a single root element with the .collection and .search-strip class names.
export default function ResidenceCollection({ listings, area, budget, onAreaChange, onBudgetChange, facets, header, pagination }: Props) {
  const areas = [...new Set([...areaOptions, ...listings.map((listing) => listing.district), area])];
  const visible = useMemo(() => filterListings(listings, { area, budget, university: facets?.university, developmentProject: facets?.developmentProject }), [listings, area, budget, facets?.university, facets?.developmentProject]);
  const searched = pagination?.name.trim().toLocaleLowerCase();
  const matches = searched ? visible.filter(listing => listing.name.toLocaleLowerCase().includes(searched)) : visible;
  const pageSize = pagination?.pageSize ?? Math.max(matches.length, 1);
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const page = Math.min(pagination?.page ?? 1, pages);
  const offset = (page - 1) * pageSize;
  const shown = matches.slice(offset, offset + pageSize);
  return (
    <section className="collection" id="residences">
      <div className="container">
        {header}
        <section className={`search-strip on-dark ${pagination ? "collection-search" : ""}`} id="search" aria-label="Bangkok condominium search">
          <label className="field"><span>Bangkok area</span><select value={area} onChange={(event) => onAreaChange(event.target.value)}>{areas.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="field"><span>Monthly budget</span><select value={budget} onChange={(event) => onBudgetChange(event.target.value)}>{budgetOptions.map((option) => <option key={option.label}>{option.label}</option>)}</select></label>
          {facets && <ListingFacetFilters listings={listings} {...facets} />}
          {pagination && <>
            <label className="field"><span>Residence name</span><input type="search" placeholder="Search by name" value={pagination.name} onChange={event => pagination.onNameChange(event.target.value)} /></label>
            <label className="field"><span>Show per page</span><select value={pageSize} onChange={event => pagination.onPageSizeChange(Number(event.target.value))}>{[10,25,50].map(size => <option key={size} value={size}>{size} residences</option>)}</select></label>
          </>}
          {!pagination && <a className="btn gold" href="#residences">Show {matches.length} {matches.length === 1 ? "match" : "matches"} →</a>}
        </section>
        {pagination && <p className="collection-results" role="status">Showing {matches.length ? offset + 1 : 0}–{Math.min(offset + pageSize, matches.length)} of {matches.length} residences</p>}
        {matches.length
          ? <div className="property-grid">{shown.map((listing, index) => <ListingCard key={listing.slug} listing={listing} index={offset + index} />)}</div>
          : <div className="empty-state"><h3 className="h3">No exact match yet.</h3><p>Try another budget or ask Mark to search beyond the sample collection.</p><a className="btn" href="/contact">Start a custom search</a></div>}
        {pagination && matches.length > 0 && <nav className="collection-pagination" aria-label="Residence pagination">
          <label className="pagination-page-size"><span>Show per page</span><select value={pageSize} onChange={event => pagination.onPageSizeChange(Number(event.target.value))}>{[10,25,50].map(size => <option key={size} value={size}>{size} residences</option>)}</select></label>
          <button type="button" className="btn" disabled={page === 1} onClick={() => pagination.onPageChange(page - 1)}>← Previous</button>
          <span>Page {page} of {pages}</span>
          <button type="button" className="btn" disabled={page === pages} onClick={() => pagination.onPageChange(page + 1)}>Next →</button>
        </nav>}
      </div>
    </section>
  );
}
