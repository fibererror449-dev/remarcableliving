import type { PublicListing } from "./listings-data";

export type PlaceKind = "area" | "project" | "university";
export type DiscoveryPlace = { id: number; kind: PlaceKind; name: string; description: string; listingIds: number[] };
export const placeKinds: PlaceKind[] = ["area", "project", "university"];
export const placeDirectories = {
  area: { path: "/areas", title: "Neighbourhoods", singular: "Neighbourhood", intro: "Find the part of Bangkok that fits your everyday life. Compare homes, station access and monthly rent in each neighbourhood." },
  project: { path: "/projects", title: "Development projects", singular: "Development project", intro: "Explore buildings as a collection. Compare the available residences within each development project." },
  university: { path: "/universities", title: "Universities", singular: "University", intro: "Start with your university, then compare the residences linked to it. Confirm your campus and the door-to-door commute before choosing a home." },
};
export function placeSlug(place: DiscoveryPlace): string {
  const name = place.name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  return `${name}-${place.id}`;
}
export const placeHref = (place: DiscoveryPlace) => `${placeDirectories[place.kind].path}/${placeSlug(place)}`;
export function relatedListings(place: DiscoveryPlace, listings: PublicListing[]): PublicListing[] {
  const ids = new Set(place.listingIds);
  return listings.filter(listing => ids.has(listing.id));
}
export function placeDescription(place: DiscoveryPlace, listings: PublicListing[]): string {
  if (place.description.trim()) return place.description;
  const matches = relatedListings(place, listings);
  if (place.kind === "area") return `Explore the residence collection in ${place.name}. Compare usable space, monthly rent and station access to plan your next move.`;
  if (place.kind === "project") {
    const areas = [...new Set(matches.map(listing => listing.district))];
    return `Explore residences at ${place.name}${areas.length ? ` in ${areas.join(" and ")}` : ""}. Review individual layouts, asking rents and availability within the development.`;
  }
  return `Compare residences linked to ${place.name}. University links are a starting point for your search. Check the exact campus, route and travel time before arranging a viewing.`;
}
