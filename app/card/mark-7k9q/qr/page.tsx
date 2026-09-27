import { businessCard as card } from "../../../../lib/business-card";

export default function QuickSharePage() {
  return <main className="quick-card-page">
    <article className="quick-card">
      <div className="quick-card-brand"><img src="/brand/monogram.png" width="42" height="49" alt="" /><span>REMARCABLE LIVING</span></div>
      <p className="quick-card-role">FOUNDER</p>
      <h1>MARK<br />KUNTHWAKHUMLUE</h1>
      <a className="quick-card-qr" href={card.qrPath} aria-label="Open Mark's business card"><img src="/business-card/mark-qr.svg" width="400" height="400" alt="Scan to open Mark's business card" /></a>
      <p className="quick-card-scan">Scan to connect</p>
      <p className="quick-card-tagline">Mark your place. <em>Find your space.</em></p>
    </article>
    <a className="card-button card-button-gold" href="/business-card/mark-iphone.png" download="Mark-business-card.png">Save QR image ↓</a>
    <details className="quick-card-help"><summary>Keep this card on your iPhone</summary><p>Save the image to Photos and mark it as a favourite. If it opens in a new tab, touch and hold the image, then choose Save to Photos.</p><p>For a Home Screen shortcut, open this page in Safari, tap Share, then Add to Home Screen.</p></details>
    <a className="quick-card-back" href={card.path}>View business card</a>
  </main>;
}
