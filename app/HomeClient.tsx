"use client";

import { useEffect, useState } from "react";
import CinematicHero from "./CinematicHero";
import ExploreStrip from "./components/ExploreStrip";
import ResidenceCollection from "./components/ResidenceCollection";
import SiteFooter from "./components/SiteFooter";
import { AREA_ALL, BUDGET_ANY, type PublicListing } from "../lib/listings-data";

// Layout coordinates ignore the cinematic transform on the live collection.
// Native anchor scrolling uses its temporary on-screen laptop position instead.
function contentTop(id: string) {
  let node = document.getElementById(id);
  if (!node) return null;
  const story = node.closest<HTMLElement>(".cinema:not(.cinema-static)");
  const stage = story?.querySelector<HTMLElement>(".cinema-stage");
  let top = 0;
  while (node) {
    if (node === stage && story) {
      // Sticky offsetTop includes its current pinned displacement. Use the
      // story's document origin instead.
      top += window.scrollY + story.getBoundingClientRect().top + story.offsetHeight - stage.offsetHeight;
      break;
    }
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}

// Jump directly: a smooth scroll would fast-forward every scroll-driven hero scene on the way.
function scrollToContent(id: string) {
  const top = contentTop(id);
  if (top !== null) window.scrollTo({ top, behavior: "instant" });
}

// Records the true position on the history entry so Back and Forward restore it; without it the
// router scrolls the hash target into view, which lands inside the hero's transformed stage.
function jumpToContent(hash: string, history: "push" | "replace") {
  const top = contentTop(hash.slice(1));
  if (top === null) return;
  const position = { __vinext_scrollX: 0, __vinext_scrollY: top };
  if (history === "push") window.history.pushState(position, "", hash);
  else window.history.replaceState({ ...window.history.state, ...position }, "");
  window.scrollTo({ top, behavior: "instant" });
}

// A hash typed into the address bar gets the router's scroll-into-view first; correct it a frame later.
function correctTypedHash() {
  const hash = window.location.hash;
  const recorded = typeof window.history.state?.__vinext_scrollY === "number";
  if (!recorded && (hash === "#residences" || hash === "#search")) requestAnimationFrame(() => requestAnimationFrame(() => jumpToContent(hash, "replace")));
}

function handleContentLink(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element).closest("a");
  const hash = link?.getAttribute("href");
  if (hash !== "#residences" && hash !== "#search" && hash !== "#home") return;
  event.preventDefault();
  jumpToContent(hash, "push");
}

export default function HomeClient({ listings }: { listings: PublicListing[] }) {
  useEffect(() => {
    // The site-wide smooth scrolling would replay every hero scene when history restores a position.
    const root = document.documentElement;
    const scrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    // A shared /#residences link would otherwise open at the top of the hero.
    if (window.location.hash === "#residences" || window.location.hash === "#search") jumpToContent(window.location.hash, "replace");
    // Delegated anchor handling also receives native keyboard link activation.
    document.addEventListener("click", handleContentLink);
    window.addEventListener("hashchange", correctTypedHash);
    return () => {
      root.style.scrollBehavior = scrollBehavior;
      document.removeEventListener("click", handleContentLink);
      window.removeEventListener("hashchange", correctTypedHash);
    };
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
