import { studentHousingHref, whatsappUrl } from "../../lib/site-data";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="cols">
          <div>
            <a className="brand" href="/" aria-label="REMARCABLE LIVING home"><span className="brand-mark">R</span><span>REMARCABLE LIVING</span></a>
            <p className="tagline">Mark your place. Find your space.</p>
          </div>
          <div>
            <h4>Site</h4>
            <a href={studentHousingHref}>Your University</a>
            <a href="/residences">Condo/Apartment</a>
            <a href="/neighbourhoods">Neighbourhoods</a>
            <a href="/neighbourhoods#guide">Bangkok guide</a>
            <a href="/about">About Us</a>
            <a href="/inventory">Complete inventory</a>
          </div>
          <div>
            <h4>Contact</h4>
            <a href="/contact">Send your brief to Mark</a>
            <a href={whatsappUrl} target="_blank" rel="noreferrer">Talk to Mark on WhatsApp</a>
            <p className="note">Hero interiors are AI-created inspiration, not photographs of listed homes.</p>
          </div>
        </div>
        <div className="bottom"><span>© 2026 REMARCABLE LIVING</span><span>Photography: owners and Unsplash contributors</span></div>
      </div>
    </footer>
  );
}
