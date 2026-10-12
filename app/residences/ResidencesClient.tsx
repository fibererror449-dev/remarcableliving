"use client";

import { useState } from "react";
import ResidenceCollection from "../components/ResidenceCollection";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";
import { AREA_ALL, toResidencesHref, type ListingFilters, type PublicListing } from "../../lib/listings-data";

type Props = { listings: PublicListing[]; initialArea: string; initialBudget: string; initialUniversity: string; initialProject: string };

export default function ResidencesClient({ listings, initialArea, initialBudget, initialUniversity, initialProject }: Props) {
  const [area, setArea] = useState(initialArea);
  const [budget, setBudget] = useState(initialBudget);
  const [university, setUniversity] = useState(initialUniversity);
  const [developmentProject, setDevelopmentProject] = useState(initialProject);

  // Keep the address shareable without a server round-trip per select change.
  function sync(change: ListingFilters) {
    const filters = { area, budget, university, developmentProject, ...change };
    setArea(filters.area); setBudget(filters.budget);
    setUniversity(filters.university); setDevelopmentProject(filters.developmentProject);
    window.history.replaceState(null, "", toResidencesHref(filters));
  }

  return (
    <main className="residences-page">
      <SiteNav current="residences" />
      <header className="page-hero section on-dark">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow"><span /> The current collection</p>
            <h1>{area === AREA_ALL ? <>Prices that<br /><em>make sense.</em></> : <>Homes in<br /><em>{area}.</em></>}</h1>
          </div>
          <div>
            <p className="lede">Representative asking rents based on current neighbourhood ranges. Final availability and negotiated rent are always confirmed before viewing.</p>
            <div className="page-hero-links">
              <a className="text-link" href="/inventory">Browse the complete available inventory →</a>
              <a className="text-link" href="/neighbourhoods">University &amp; project search →</a>
            </div>
          </div>
        </div>
      </header>
      <ResidenceCollection listings={listings} area={area} budget={budget} onAreaChange={(next) => sync({ area: next })} onBudgetChange={(next) => sync({ budget: next })}
        facets={{ university, developmentProject, onUniversityChange: (next) => sync({ university: next }), onProjectChange: (next) => sync({ developmentProject: next }) }} />
      <SiteFooter />
    </main>
  );
}
