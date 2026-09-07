import Link from "next/link";
import { studentHousingHref, whatsappUrl } from "../../lib/site-data";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="cols">
          <div>
            <Link className="brand" href="/" aria-label="REMARCABLE LIVING home"><span className="brand-mark">R</span><span>REMARCABLE LIVING</span></Link>
            <p className="tagline">Mark your place. Find your space.</p>
          </div>
          <div>
            <h4>Site</h4>
            <Link href="/residences">Residences</Link>
            <Link href="/neighbourhoods">Neighbourhoods</Link>
            <Link href="/approach">Our approach</Link>
            <Link href="/neighbourhoods#guide">Bangkok guide</Link>
            <Link href="/inventory">Complete inventory</Link>
            <Link href={studentHousingHref}>Find by university</Link>
          </div>
          <div>
            <h4>Contact</h4>
            <Link href="/contact">Send your brief to Mark</Link>
            <a href={whatsappUrl} target="_blank" rel="noreferrer">Talk to Mark on WhatsApp</a>
            <p className="note">Hero interiors are AI-created inspiration, not photographs of listed homes.</p>
          </div>
        </div>
        <div className="bottom"><span>© 2026 REMARCABLE LIVING</span><span>Photography: owners and Unsplash contributors</span></div>
      </div>
    </footer>
  );
}
