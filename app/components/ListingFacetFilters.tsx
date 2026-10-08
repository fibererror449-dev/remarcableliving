"use client";

import { listingFacetOptions, type PublicListing } from "../../lib/listings-data";
import { universityOptions } from "../../lib/site-data";

type Props = {
  listings: PublicListing[];
  university: string;
  developmentProject: string;
  onUniversityChange: (value: string) => void;
  onProjectChange: (value: string) => void;
};

export default function ListingFacetFilters({ listings, university, developmentProject, onUniversityChange, onProjectChange }: Props) {
  const universities = [...new Set([
    ...universityOptions.filter((name) => name !== "Another Bangkok university"),
    ...listingFacetOptions(listings, "university"),
    ...(university ? [university] : []),
  ])].sort((a, b) => a.localeCompare(b));
  const projects = listingFacetOptions(listings, "developmentProject");
  if (developmentProject && !projects.includes(developmentProject)) projects.push(developmentProject);

  return <div className="listing-facet-filters" role="group" aria-label="University and development project filters">
    <label><span>University</span><select aria-label="University" value={university} onChange={(event) => onUniversityChange(event.target.value)}>
      <option value="">All universities</option>
      {universities.map((name) => <option key={name} value={name}>{name}</option>)}
    </select></label>
    <label><span>Development project</span><select aria-label="Development project" value={developmentProject} onChange={(event) => onProjectChange(event.target.value)}>
      <option value="">All development projects</option>
      {projects.map((name) => <option key={name} value={name}>{name}</option>)}
    </select></label>
  </div>;
}
