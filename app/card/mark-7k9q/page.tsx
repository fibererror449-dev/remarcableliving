import { businessCard as card } from "../../../lib/business-card";

export default function BusinessCardPage() {
  return <main className="business-card-page">
    <header className="card-heading">
      <p>REMARCABLE LIVING · FOUNDER</p>
      <h1>{card.name}</h1>
    </header>

    <figure className="card-face">
      <img src="/business-card/mark-front.svg" width="1800" height="1030" alt="REMARCABLE LIVING. Mark your place. Find your space." />
      <figcaption>Front</figcaption>
    </figure>
    <figure className="card-face">
      <a href={card.whatsappUrl} target="_blank" rel="noreferrer" aria-label="Talk to Mark on WhatsApp">
        <img src="/business-card/mark-back.svg" width="1800" height="1030" alt={`${card.name}, founder. Phone ${card.phone}. Email ${card.email}. Scan the QR to talk to Mark on WhatsApp.`} />
      </a>
      <figcaption>Back</figcaption>
    </figure>

    <dl className="card-contact">
      <div><dt>Phone</dt><dd><a href={card.phoneHref}>{card.phone}</a></dd></div>
      <div><dt>Email</dt><dd><a href={`mailto:${card.email}`}>{card.email}</a></dd></div>
      <div><dt>Website</dt><dd><a href={card.siteOrigin}>{card.website}</a></dd></div>
    </dl>
    <div className="card-actions">
      <a className="card-button card-button-gold" href={card.whatsappUrl} target="_blank" rel="noreferrer">Talk to Mark on WhatsApp <span aria-hidden="true">↗</span></a>
      <a className="card-button" href={`${card.path}/qr`}>Show my QR card <span aria-hidden="true">↗</span></a>
    </div>
    <div className="card-downloads">
      <span>High-resolution cards</span>
      <a href="/business-card/mark-front.png" download>Front ↓</a>
      <a href="/business-card/mark-back.png" download>Back ↓</a>
    </div>
  </main>;
}
