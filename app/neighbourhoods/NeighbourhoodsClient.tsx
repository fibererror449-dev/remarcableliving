"use client";

import { useRef, useState } from "react";
import ListingCard from "../components/ListingCard";
import { AREA_ALL, areaOptions, filterListings, listingFacetOptions, toNeighbourhoodsHref, toResidencesHref, type ListingFilters, type PublicListing } from "../../lib/listings-data";
import { neighbourhoods, universityOptions } from "../../lib/site-data";

type Props = { listings: PublicListing[]; initialArea: string; initialUniversity: string; initialProject: string };
type Choice = { name: string; image: string; note: string; count: number };
type SearchSectionProps = {
  id: string; title: string; label: string; allLabel: string; value: string;
  options: string[]; choices: Choice[]; listings: PublicListing[];
  filters: ListingFilters; onChange: (value: string) => void; emptyMessage: string;
};

function SearchSection({ id, title, label, allLabel, value, options, choices, listings, filters, onChange, emptyMessage }: SearchSectionProps) {
  const previews = listings.slice(0, 3);
  const resultHead = useRef<HTMLDivElement>(null);
  function chooseCard(name: string) {
    onChange(value === name ? "" : name);
    requestAnimationFrame(() => {
      const heading = resultHead.current;
      if (!heading) return;
      const top = heading.getBoundingClientRect().top;
      const navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-height")) || 0;
      if (top < navHeight || top > window.innerHeight * .6) heading.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }
  return <section className="discovery-section" id={id} aria-labelledby={`${id}-title`}>
    <header className="discovery-head">
      <h2 className="h3" id={`${id}-title`}>{title}</h2>
      <div className="discovery-filter">
        <label><span>{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">{allLabel}</option>
          {options.map((name) => <option key={name} value={name}>{name}</option>)}
        </select></label>
        {value && <button type="button" className="text-link" onClick={() => onChange("")}>Clear {label.toLowerCase()}</button>}
      </div>
    </header>
    <div className="neighbourhood-layout">
      {choices.length > 0 && <div className="neighbourhood-rail" role="group" aria-label={`Top ${title.toLowerCase()}`}>
        {choices.map((choice, index) => <button className={`neighbourhood-card ${value === choice.name ? "selected" : ""}`} key={choice.name} type="button" onClick={() => chooseCard(choice.name)} aria-pressed={value === choice.name}>
          <span className="neighbourhood-image" style={{ backgroundImage: `url('${choice.image}')` }} aria-hidden="true" />
          <span className="neighbourhood-shade" aria-hidden="true" />
          <span className="neighbourhood-index">{String(index + 1).padStart(2, "0")}</span>
          {value === choice.name && <span className="neighbourhood-selected">Selected</span>}
          <span className="neighbourhood-copy"><small>{choice.note}</small><strong>{choice.name}</strong><b>{choice.count} {choice.count === 1 ? "residence" : "residences"}</b></span>
        </button>)}
      </div>}
      <div className="area-listings">
        <div className="area-listings-head" ref={resultHead}>
          <div aria-live="polite"><p className="eyebrow dark"><span /> {value || allLabel}</p><p className="area-note">{listings.length} {listings.length === 1 ? "residence" : "residences"}{listings.length > previews.length ? ` · Showing ${previews.length} top choices` : ""}</p></div>
          {listings.length > 0 && (id !== "universities" || value) && <a className="text-link" href={toResidencesHref(filters)}>View all {listings.length} residences</a>}
        </div>
        {previews.length > 0
          ? <div className="property-grid">{previews.map((listing, index) => <ListingCard key={listing.slug} listing={listing} index={index} />)}</div>
          : <div className="empty-state"><h3 className="h3">{value ? "No residences listed here yet." : emptyMessage}</h3><p>Send your requirements to Mark for a shortlist.</p>{value && <button type="button" className="btn" onClick={() => onChange("")}>Clear {label.toLowerCase()}</button>}<a className="text-link" href="/contact">Send your brief</a></div>}
      </div>
    </div>
  </section>;
}

function topFacetChoices(listings: PublicListing[], key: "university" | "developmentProject"): Choice[] {
  return listingFacetOptions(listings, key).map((name) => {
    const matches = filterListings(listings, { [key]: name });
    return { name, image: matches[0]?.image ?? "", note: key === "university" ? "University" : "Development project", count: matches.length };
  }).sort((a, b) => b.count - a.count).slice(0, 3);
}

export default function NeighbourhoodsClient({ listings, initialArea, initialUniversity, initialProject }: Props) {
  const [location, setLocation] = useState(initialArea === AREA_ALL ? "" : initialArea);
  const [university, setUniversity] = useState(initialUniversity);
  const [developmentProject, setDevelopmentProject] = useState(initialProject);
  const areaNames = [...new Set([...areaOptions.filter((name) => name !== AREA_ALL), ...listings.map((listing) => listing.district)])].sort((a, b) => a.localeCompare(b));
  const projects = [...new Set([...listingFacetOptions(listings, "developmentProject"), ...(developmentProject ? [developmentProject] : [])])];
  const universities = [...new Set([...universityOptions.filter((name) => name !== "Another Bangkok university"), ...listingFacetOptions(listings, "university"), ...(university ? [university] : [])])].sort((a, b) => a.localeCompare(b));
  const areaChoices = neighbourhoods.map((area) => ({ name: area.name, image: area.image, note: area.transit, count: filterListings(listings, { area: area.name }).length })).filter((area) => area.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);
  const universityListings = listings.filter((listing) => listing.university?.trim());

  function selectFilter(key: "area" | "university" | "developmentProject", value: string) {
    if (key === "area") setLocation(value);
    else if (key === "university") setUniversity(value);
    else setDevelopmentProject(value);
    window.history.replaceState(null, "", toNeighbourhoodsHref({ area: location, university, developmentProject, [key]: value }) + window.location.hash);
  }

  return <section className="neighbourhoods section">
    <div className="container">
      <header className="sec-head">
        <div><p className="eyebrow dark"><span /> Find the right Bangkok residence</p><h1 className="h2">Find your<br /><em>Bangkok home.</em></h1></div>
        <p className="lede">Explore by neighbourhood, development project or university.</p>
      </header>
      <nav className="discovery-jumps" aria-label="Search sections"><a href="#neighbourhoods">Neighbourhoods</a><a href="#projects">Development projects</a><a href="#universities">Universities</a></nav>
      <SearchSection id="neighbourhoods" title="Neighbourhoods" label="Neighbourhood" allLabel="All neighbourhoods" value={location} options={areaNames} choices={areaChoices} listings={filterListings(listings, { area: location })} filters={{ area: location }} onChange={(value) => selectFilter("area", value)} emptyMessage="No neighbourhood residences listed yet." />
      <SearchSection id="projects" title="Development projects" label="Development project" allLabel="All development projects" value={developmentProject} options={projects} choices={topFacetChoices(listings, "developmentProject")} listings={filterListings(listings, { developmentProject })} filters={{ developmentProject }} onChange={(value) => selectFilter("developmentProject", value)} emptyMessage="No project residences listed yet." />
      <SearchSection id="universities" title="Universities" label="University" allLabel="All universities" value={university} options={universities} choices={topFacetChoices(universityListings, "university")} listings={filterListings(universityListings, { university })} filters={{ university }} onChange={(value) => selectFilter("university", value)} emptyMessage="University shortlists are coming soon." />
    </div>
  </section>;
}
