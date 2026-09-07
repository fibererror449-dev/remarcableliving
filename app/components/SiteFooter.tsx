const universityUrl = "https://www.remarcableliving.co/student-housing";
const whatsapp = "https://wa.me/66634962466";

export default function SiteFooter({ homeHref = "" }: { homeHref?: string }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="cols">
          <div>
            <a className="brand" href={homeHref || "#home"} aria-label="REMARCABLE LIVING home"><span className="brand-mark">R</span><span>REMARCABLE LIVING</span></a>
            <p className="tagline">Mark your place. Find your space.</p>
          </div>
          <div>
            <h4>Site</h4>
            <a href={`${homeHref}#residences`}>Residences</a>
            <a href={`${homeHref}#neighbourhoods`}>Neighbourhoods</a>
            <a href={`${homeHref}#approach`}>Our approach</a>
            <a href="/inventory">Complete inventory</a>
            <a href={universityUrl}>Find by university</a>
          </div>
          <div>
            <h4>Contact</h4>
            <a href={whatsapp} target="_blank" rel="noreferrer">Talk to Mark on WhatsApp</a>
            <p className="note">Hero interiors are AI-created inspiration, not photographs of listed homes.</p>
          </div>
        </div>
        <div className="bottom"><span>© 2026 REMARCABLE LIVING</span><span>Photography: owners and Unsplash contributors</span></div>
      </div>
    </footer>
  );
}
