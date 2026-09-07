import SiteFooter from "./components/SiteFooter";
import SiteNav from "./components/SiteNav";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <SiteNav />
      <section className="section">
        <div className="container not-found">
          <p className="eyebrow dark"><span /> Page not found</p>
          <h1>That address<br />has <em>moved on.</em></h1>
          <p className="lede">The page you asked for is not here. The residences, neighbourhoods, and Mark are.</p>
          <div className="page-hero-links">
            <a className="btn gold" href="/residences">See the current collection</a>
            <a className="btn line" href="/neighbourhoods">Compare neighbourhoods</a>
            <a className="btn line" href="/contact">Talk to Mark</a>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
