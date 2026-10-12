import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BangkokGuide from "../components/BangkokGuide";
import SiteFooter from "../components/SiteFooter";
import SiteNav from "../components/SiteNav";
import { PlaceCards } from "../components/DiscoveryDirectory";
import { loadDiscovery } from "../../lib/discovery";
import { placeDirectories, placeHref, placeKinds, relatedListings } from "../../lib/discovery-data";
import { parseListingFacet } from "../../lib/listings-data";
import { siteOrigin } from "../../lib/site-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Explore Bangkok: neighbourhoods, projects & universities | REMARCABLE LIVING",
  description: "Discover Bangkok by neighbourhood, development project or university. Explore each collection and its related residences.",
  alternates: { canonical: `${siteOrigin}/neighbourhoods` },
};
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const { places, listings } = await loadDiscovery();
  // Preserve bookmarks and older listing links to the former filtered page.
  for (const [key, kind] of [["area", "area"], ["project", "project"], ["university", "university"]] as const) {
    const value = parseListingFacet(params[key]);
    if (value) {
      const place = places.find(place => place.kind === kind && place.name.toLowerCase() === value.toLowerCase());
      if (place) redirect(placeHref(place));
      redirect(placeDirectories[kind].path);
    }
  }
  return <main className="neighbourhoods-page"><SiteNav current="neighbourhoods" />
    <header className="page-hero section on-dark"><div className="container page-hero-grid"><div><p className="eyebrow"><span /> Find your place</p><h1>Explore<br /><em>Bangkok.</em></h1></div><p className="lede">Start with a neighbourhood, a building or your university. Get to know the place, then explore the homes connected to it.</p></div></header>
    <section className="section"><div className="container discovery-index">
      <nav className="discovery-jumps" aria-label="Discovery directories">{placeKinds.map(kind => <a key={kind} href={placeDirectories[kind].path}>{placeDirectories[kind].title} →</a>)}</nav>
      {placeKinds.map(kind => {
        const all = places.filter(place => place.kind === kind);
        const top = all.filter(place => relatedListings(place, listings).length).sort((a,b) => relatedListings(b,listings).length - relatedListings(a,listings).length || a.name.localeCompare(b.name)).slice(0,3);
        return <section className="directory-preview" id={kind === "area" ? "neighbourhoods" : kind === "project" ? "projects" : "universities"} key={kind}>
          <header className="sec-head"><div><p className="eyebrow dark"><span /> Top choices</p><h2 className="h2">{placeDirectories[kind].title}</h2></div><a className="text-link" href={placeDirectories[kind].path}>Explore all {all.length} →</a></header>
          <PlaceCards places={top} listings={listings} />
        </section>;
      })}
    </div></section><BangkokGuide /><SiteFooter /></main>;
}
