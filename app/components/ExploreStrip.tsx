import Link from "next/link";
import { exploreTiles } from "../../lib/site-data";

export default function ExploreStrip() {
  return (
    <section className="explore section" aria-labelledby="explore-title">
      <div className="container">
        <header className="sec-head">
          <div><p className="eyebrow dark"><span /> Keep exploring</p><h2 className="h2" id="explore-title">Choose the area.<br />Then the <em>room.</em></h2></div>
          <p className="lede">Each part of the search has its own page, so you can compare neighbourhoods, read how we work, and send your brief without scrolling past everything else.</p>
        </header>
        <div className="explore-grid">
          {exploreTiles.map((tile, index) => (
            <Link key={tile.href} href={tile.href} className="explore-tile">
              <b>{String(index + 1).padStart(2, "0")}</b>
              <strong>{tile.title}</strong>
              <span>{tile.note}</span>
              <span className="text-link">Open →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
