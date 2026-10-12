"use client";

import { useState } from "react";
import ResidenceCollection from "../components/ResidenceCollection";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";
import { AREA_ALL, toResidencesHref, type ListingFilters, type PublicListing } from "../../lib/listings-data";

type Props = { listings: PublicListing[]; initialArea: string; initialBudget: string; initialUniversity: string; initialProject: string; initialName?: string; initialPage?: number; initialPageSize?: number; introduction?: React.ReactNode; syncUrl?: boolean };

export default function ResidencesClient({ listings, initialArea, initialBudget, initialUniversity, initialProject, initialName = "", initialPage = 1, initialPageSize = 10, introduction, syncUrl = true }: Props) {
  const [area, setArea] = useState(initialArea);
  const [budget, setBudget] = useState(initialBudget);
  const [university, setUniversity] = useState(initialUniversity);
  const [developmentProject, setDevelopmentProject] = useState(initialProject);

  const [name, setName] = useState(initialName);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  function updateAddress(filters: ListingFilters, nextName: string, nextPage: number, nextSize: number) {
    if (!syncUrl) return;
    const url = new URL(toResidencesHref(filters), window.location.origin);
    if (nextName.trim()) url.searchParams.set("q", nextName.trim());
    if (nextPage > 1) url.searchParams.set("page", String(nextPage));
    if (nextSize !== 10) url.searchParams.set("pageSize", String(nextSize));
    window.history.replaceState(null, "", url.pathname + url.search);
  }
  function changePagination(change: { name?: string; page?: number; size?: number }) {
    const nextName = change.name ?? name;
    const nextPage = change.page ?? 1;
    const nextSize = change.size ?? pageSize;
    setName(nextName); setPage(nextPage); setPageSize(nextSize);
    updateAddress({ area, budget, university, developmentProject }, nextName, nextPage, nextSize);
    if (change.page !== undefined) requestAnimationFrame(() => document.querySelector(".collection-results")?.scrollIntoView({ block: "start", behavior: "instant" }));
  }
  // Keep the address shareable without a server round-trip per select change.
  function sync(change: ListingFilters) {
    const filters = { area, budget, university, developmentProject, ...change };
    setArea(filters.area); setBudget(filters.budget);
    setUniversity(filters.university); setDevelopmentProject(filters.developmentProject);
    setPage(1);
    updateAddress(filters, name, 1, pageSize);
  }

  return (
    <main className="residences-page">
      <SiteNav current="residences" />
      {introduction ?? <header className="page-hero section on-dark">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow"><span /> The current collection</p>
            <h1>{area === AREA_ALL ? <>Prices that<br /><em>make sense.</em></> : <>Homes in<br /><em>{area}.</em></>}</h1>
          </div>
          <div>
            <p className="lede">Representative asking rents based on current neighbourhood ranges. Final availability and negotiated rent are always confirmed before viewing.</p>
            <div className="page-hero-links">
              <a className="text-link" href="/inventory">Browse the complete available inventory →</a>
              <a className="text-link" href="/neighbourhoods">Explore neighbourhoods, projects &amp; universities →</a>
            </div>
          </div>
        </div>
      </header>}
      <ResidenceCollection listings={listings} area={area} budget={budget} onAreaChange={(next) => sync({ area: next })} onBudgetChange={(next) => sync({ budget: next })}
        pagination={{ name, page, pageSize, onNameChange: (name) => changePagination({ name }), onPageChange: (page) => changePagination({ page }), onPageSizeChange: (size) => changePagination({ size }) }}
        facets={{ university, developmentProject, onUniversityChange: (next) => sync({ university: next }), onProjectChange: (next) => sync({ developmentProject: next }) }} />
      <SiteFooter />
    </main>
  );
}
