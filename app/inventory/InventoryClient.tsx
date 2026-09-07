"use client";

import { useMemo, useState } from "react";
import type { ImportedInventoryUnit } from "../../lib/imported-inventory.generated";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

const PAGE_SIZE = 24;

function money(value: number | null) {
  return value == null ? "Price on request" : `฿${value.toLocaleString()} / month`;
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return <div><dt>{label}</dt>{value == null ? <dd className="on-request">On request</dd> : <dd>{value}</dd>}</div>;
}

export default function InventoryClient({ units }: { units: ImportedInventoryUnit[] }) {
  const [query, setQuery] = useState("");
  const [project, setProject] = useState("All projects");
  const [budget, setBudget] = useState("Any budget");
  const [photosOnly, setPhotosOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const projects = useMemo(() => [...new Set(units.map((unit) => unit.project))].sort((a, b) => a.localeCompare(b)), [units]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return units.filter((unit) => {
      if (project !== "All projects" && unit.project !== project) return false;
      if (photosOnly && !unit.photoUrl) return false;
      if (needle && !`${unit.project} ${unit.ref} ${unit.unitType ?? ""} ${unit.floor ?? ""}`.toLowerCase().includes(needle)) return false;
      if (budget === "Under ฿20,000" && (unit.priceMonthly == null || unit.priceMonthly >= 20000)) return false;
      if (budget === "฿20,000–฿40,000" && (unit.priceMonthly == null || unit.priceMonthly < 20000 || unit.priceMonthly > 40000)) return false;
      if (budget === "฿40,000+" && (unit.priceMonthly == null || unit.priceMonthly < 40000)) return false;
      return true;
    });
  }, [budget, photosOnly, project, query, units]);
  const visible = filtered.slice(0, visibleCount);
  const isFiltered = query !== "" || project !== "All projects" || budget !== "Any budget" || photosOnly;

  function resetPage() {
    setVisibleCount(PAGE_SIZE);
  }

  function resetFilters() {
    setQuery("");
    setProject("All projects");
    setBudget("Any budget");
    setPhotosOnly(false);
    resetPage();
  }

  return (
    <main className="inventory-page">
      <SiteNav current="inventory" />

      <header className="inventory-hero section on-dark">
        <div className="container inventory-hero-grid">
          <div>
            <p className="eyebrow"><span /> Current rental inventory</p>
            <h1>More homes.<br /><em>Same careful shortlist.</em></h1>
          </div>
          <div>
            <div className="inventory-summary"><strong>{units.length.toLocaleString()}</strong><span>publishable available listings imported from the supplied inventory</span></div>
            <p>Availability and final rent must be reconfirmed before viewing.</p>
            <details>
              <summary>How this list is built</summary>
              <p>These cards use the supplied reliable project or source label, floor, unit type, area, asking rent, direction, availability, and first valid photo link where present. Worksheet headings, exact duplicates, and rows without reliable public listing facts are omitted. Internal addresses, access instructions, unit codes, negotiability notes, and remarks are not published.</p>
            </details>
          </div>
        </div>
      </header>

      <section className="inventory-controls" aria-label="Filter available inventory">
        <label className="field"><span>Search</span><input value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder="Project, type, floor or reference" /></label>
        <label className="field"><span>Project</span><select value={project} onChange={(event) => { setProject(event.target.value); resetPage(); }}><option>All projects</option>{projects.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label className="field"><span>Monthly budget</span><select value={budget} onChange={(event) => { setBudget(event.target.value); resetPage(); }}><option>Any budget</option><option>Under ฿20,000</option><option>฿20,000–฿40,000</option><option>฿40,000+</option></select></label>
        <label className="photo-toggle"><input type="checkbox" checked={photosOnly} onChange={(event) => { setPhotosOnly(event.target.checked); resetPage(); }} /><span>Photo link available</span></label>
      </section>

      <section className="inventory-results section" aria-live="polite">
        <div className="container">
          <header>
            <div><p className="eyebrow dark"><span /> Search results</p><h2>{filtered.length.toLocaleString()} available {filtered.length === 1 ? "unit" : "units"}</h2></div>
            <div className="inventory-results-aside">
              <p className="meta">“On request” means the corresponding field was blank, so no value was inferred.</p>
              {isFiltered && <button className="text-link inventory-reset" type="button" onClick={resetFilters}>Reset filters</button>}
            </div>
          </header>
          {filtered.length > 0 && <div className="inventory-grid">
            {visible.map((unit) => {
              const whatsapp = `https://wa.me/66634962466?text=${encodeURIComponent(`Hi Mark, I would like to confirm REMARCABLE LIVING listing ${unit.ref} at ${unit.project}.`)}`;
              return <article className="inventory-card" key={unit.ref}>
                <div className="inventory-card-top"><span className="meta">{unit.ref}</span><span className="chip">Available</span></div>
                <h3>{unit.project}</h3>
                <dl>
                  <Fact label="Type" value={unit.unitType} />
                  <Fact label="Area" value={unit.areaSqm == null ? null : `${unit.areaSqm} sq m`} />
                  <Fact label="Floor" value={unit.floor} />
                  <Fact label="Direction" value={unit.direction} />
                </dl>
                <strong className="inventory-price">{money(unit.priceMonthly)}</strong>
                <div className="inventory-actions">
                  <a className="btn" href={whatsapp} target="_blank" rel="noreferrer">Confirm availability</a>
                  {unit.photoUrl ? <a className="btn line" href={unit.photoUrl} target="_blank" rel="noreferrer">Open supplied photos ↗</a> : <a className="btn line" href={whatsapp} target="_blank" rel="noreferrer">Ask for current photos</a>}
                </div>
              </article>;
            })}
          </div>}
          {visible.length < filtered.length && <button className="btn line inventory-more" type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Show {Math.min(PAGE_SIZE, filtered.length - visible.length)} more</button>}
          {!filtered.length && <div className="empty-state"><h3 className="h3">No matching unit.</h3><p>Clear a filter or ask Mark to search the full source inventory.</p><button className="btn" type="button" onClick={resetFilters}>Reset filters</button></div>}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
