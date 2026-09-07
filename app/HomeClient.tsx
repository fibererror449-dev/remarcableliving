"use client";

import { useEffect, useState } from "react";
import CinematicHero from "./CinematicHero";
import ExploreStrip from "./components/ExploreStrip";
import ResidenceCollection from "./components/ResidenceCollection";
import SiteFooter from "./components/SiteFooter";
import { AREA_ALL, BUDGET_ANY, type PublicListing } from "../lib/listings-data";

// Layout coordinates ignore the cinematic transform on the live collection.
// Native anchor scrolling uses its temporary on-screen laptop position instead.
function scrollToContent(id: string) {
  let node = document.getElementById(id);
  if (!node) return;
  const story = node.closest<HTMLElement>(".cinema:not(.cinema-static)");
  const stage = story?.querySelector<HTMLElement>(".cinema-stage");
  let top = 0;
  while (node) {
    if (node === stage && story) {
      // Sticky offsetTop includes its current pinned displacement. Use the
      // story's document origin instead, even during a smooth anchor jump.
      top += window.scrollY + story.getBoundingClientRect().top + story.offsetHeight - stage.offsetHeight;
      break;
    }
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  window.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
}

function handleContentLink(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element).closest("a");
  const hash = link?.getAttribute("href");
  if (hash !== "#residences" && hash !== "#search") return;
  event.preventDefault();
  window.history.pushState(null, "", hash);
  scrollToContent(hash.slice(1));
}

export default function HomeClient({ listings }: { listings: PublicListing[] }) {
  useEffect(() => {
    // Delegated anchor handling also receives native keyboard link activation.
    document.addEventListener("click", handleContentLink);
    return () => document.removeEventListener("click", handleContentLink);
  }, []);
  const [location, setLocation] = useState(AREA_ALL);
  const [budget, setBudget] = useState(BUDGET_ANY);

  function exploreNeighbourhood(name: string) {
    setLocation(name);
    scrollToContent("residences");
  }

  return (
    <main>
      <CinematicHero listings={listings} onExploreArea={exploreNeighbourhood}>
        <ResidenceCollection
          listings={listings}
          area={location}
          budget={budget}
          onAreaChange={setLocation}
          onBudgetChange={setBudget}
          header={
            <header className="sec-head">
              <div>
                <p className="eyebrow dark"><span /> Selected for real Bangkok life</p>
                <h2 className="h2">Prices that<br /><em>make sense.</em></h2>
              </div>
              <div className="sec-head-aside">
                <p className="lede">Representative asking rents based on current neighbourhood ranges. Final availability and negotiated rent are always confirmed before viewing.</p>
                <a className="text-link inventory-link" href="/inventory">Browse the complete available inventory →</a>
              </div>
            </header>
          }
        />
      </CinematicHero>

      <ExploreStrip />

      <SiteFooter />
    </main>
  );
}
