import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";
import DiscoveryDirectory from "./DiscoveryDirectory";
import ResidencesClient from "../residences/ResidencesClient";
import { loadDiscovery } from "../../lib/discovery";
import { placeDescription, placeDirectories, placeHref, placeSlug, relatedListings, type PlaceKind } from "../../lib/discovery-data";
import { AREA_ALL, BUDGET_ANY } from "../../lib/listings-data";
import { siteOrigin } from "../../lib/site-data";

export function directoryMetadata(kind: PlaceKind): Metadata {
  const directory = placeDirectories[kind];
  return { title: `${directory.title} | REMARCABLE LIVING`, description: directory.intro, alternates: { canonical: `${siteOrigin}${directory.path}` } };
}
export async function PlaceDirectoryPage({ kind }: { kind: PlaceKind }) {
  const { places, listings } = await loadDiscovery();
  const directory = placeDirectories[kind];
  return <main className="neighbourhoods-page"><SiteNav current="neighbourhoods" />
    <header className="page-hero section on-dark"><div className="container page-hero-grid"><div><a className="text-link" href="/neighbourhoods">Explore Bangkok</a><h1>{directory.title}</h1></div><p className="lede">{directory.intro}</p></div></header>
    <DiscoveryDirectory kind={kind} places={places.filter(place => place.kind === kind)} listings={listings} /><SiteFooter />
  </main>;
}
export async function placeMetadata(kind: PlaceKind, slug: string): Promise<Metadata> {
  const { places, listings } = await loadDiscovery();
  const place = places.find(place => place.kind === kind && placeSlug(place) === slug);
  return place ? { title: `${place.name} residences | REMARCABLE LIVING`, description: placeDescription(place, listings), alternates: { canonical: `${siteOrigin}${placeHref(place)}` } } : {};
}
export async function PlaceDetailPage({ kind, slug }: { kind: PlaceKind; slug: string }) {
  const { places, listings } = await loadDiscovery();
  const place = places.find(place => place.kind === kind && placeSlug(place) === slug);
  if (!place) notFound();
  const matches = relatedListings(place, listings);
  const connectedIds = new Set(matches.map(listing => listing.id));
  const connections = places.filter(other => other.kind !== kind && other.listingIds.some(id => connectedIds.has(id)));
  const intro = <header className="page-hero section on-dark"><div className="container">
    <nav className="place-breadcrumbs" aria-label="Breadcrumb"><a href="/neighbourhoods">Explore Bangkok</a><span>/</span><a href={placeDirectories[kind].path}>{placeDirectories[kind].title}</a><span>/</span><span aria-current="page">{place.name}</span></nav>
    <div className="page-hero-grid"><div><p className="eyebrow"><span />{placeDirectories[kind].singular}</p><h1>{place.name}</h1></div><div><p className="lede">{placeDescription(place, listings)}</p><p className="place-count">{matches.length} {matches.length === 1 ? "residence" : "residences"} in this collection</p></div></div>
    {connections.length > 0 && <nav className="place-connections" aria-label="Related places">{connections.slice(0,6).map(other => <a key={other.id} href={placeHref(other)}><small>{placeDirectories[other.kind].singular}</small>{other.name} ↗</a>)}</nav>}
  </div></header>;
  return <ResidencesClient listings={matches} initialArea={AREA_ALL} initialBudget={BUDGET_ANY} initialUniversity="" initialProject="" introduction={intro} syncUrl={false} />;
}
