import { notFound } from "next/navigation";
import ListingImage from "../../ListingImage";
import SiteNav from "../../components/SiteNav";
import SiteFooter from "../../components/SiteFooter";
import type { Metadata } from "next";
import { getListingStory } from "../../../lib/listing-stories";
import { getListing, listListingMedia } from "../../../lib/listings";
import { hasMedia } from "../../../lib/media";
import { ashtonSlug, baanKlangSlug, centricAriSlug, curatedResidence } from "../../../lib/residence-galleries";
import { parseVideoLink } from "../../../lib/video";

export const dynamic = "force-dynamic";

const siteOrigin = "https://www.remarcableliving.co";
const suppliers = { owner: "Owner-supplied", agent: "Agent-supplied", admin: "REMARCABLE LIVING" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) return {};
  const image = new URL(curatedResidence(slug).hero ?? listing.image, siteOrigin).toString();
  const title = `${listing.name} · ฿${listing.rent.toLocaleString()}/month | REMARCABLE LIVING`;
  const description = `${listing.bedrooms} bedroom, ${listing.bathrooms} bathroom condominium in ${listing.district}, Bangkok. ${listing.sizeSqm} sq m near ${listing.stationType} ${listing.stationName}.`;
  const canonical = `${siteOrigin}/residences/${slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, images: [{ url: image, alt: listing.name }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ResidencePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();
  const story = getListingStory(slug);
  // Curated files render only when committed (see lib/residence-galleries.ts); every photo attached
  // through an approved import or the admin editor follows them, in the order it was arranged.
  const curated = curatedResidence(slug);
  const attached = await listListingMedia(listing.id);
  const attachedPhotos = attached.filter((item) => item.mime.startsWith("image/"));
  const attachedVideo = attached.find((item) => item.mime.startsWith("video/"));
  const importedCover = attached.find((item) => item.cover);
  const videoLink = listing.videoUrl ? parseVideoLink(listing.videoUrl) : null;
  // One video per page: a YouTube/Drive link, then an attached upload, then the curated walkthrough.
  const film = videoLink ? { kind: videoLink.kind, src: videoLink.embed, href: videoLink.href }
    : attachedVideo ? { kind: "attached" as const, src: `/listing-media/${attachedVideo.id}`, type: attachedVideo.mime }
    : curated.video ? { kind: "curated" as const, src: curated.video, type: "video/mp4" }
    : null;
  const captionsTrack = "/properties/baan-klang-krung-siam-walkthrough-v2.vtt";
  const gallery = [
    ...curated.gallery,
    ...attachedPhotos.map((item, index) => ({ src: `/listing-media/${item.id}`, alt: item.caption || `${listing.name}, photo ${curated.gallery.length + index + 1}`, caption: [item.caption, suppliers[item.attribution]].filter(Boolean).join(" · ") })),
  ];
  const missingGalleryCount = curated.planned - curated.gallery.length;
  const heroImage = curated.hero ?? listing.image;
  const usesDigitalStyling = slug === centricAriSlug;
  const delta = 0.006;
  const map = `https://www.openstreetmap.org/export/embed.html?bbox=${listing.longitude-delta}%2C${listing.latitude-delta}%2C${listing.longitude+delta}%2C${listing.latitude+delta}&layer=mapnik&marker=${listing.latitude}%2C${listing.longitude}`;
  const whatsapp = `https://wa.me/66634962466?text=${encodeURIComponent(`Hi Mark, I am interested in ${listing.name} at ฿${listing.rent.toLocaleString()}/month.`)}`;
  const statusLabel = listing.status === "available" ? "Available now" : listing.status === "viewing" ? "Viewing in progress" : listing.status === "rented" ? "Rented" : "Availability to confirm";
  const aiWalkthrough = usesDigitalStyling && film?.kind === "curated";
  const galleryLede = attachedPhotos.length
    ? `${gallery.length} ${gallery.length === 1 ? "view" : "views"} of this home, in the order they were supplied.`
    : missingGalleryCount > 0
    ? `${gallery.length} of ${curated.planned} owner-supplied views are currently available. Ask Mark for the full set.`
    : slug === ashtonSlug
      ? "Nine owner-supplied views across the panoramic living areas, bedrooms, bathroom suite, and private hallway."
      : usesDigitalStyling
        ? <>Eleven views across the living area, kitchen, bedroom, and bathroom.<small>Decorative colours and selected styling details are digitally visualised. Confirm the unit’s current furnishings and condition during the viewing.</small></>
        : "Fifteen owner-supplied views, kept in the supplied sequence across the kitchen, living areas, bedrooms, and bathrooms.";
  return <main className="detail-page">
    <SiteNav current="residences" />
    <header className="detail-hero">
      <div className="detail-hero-image">
        <ListingImage src={heroImage} alt={`Interior of ${listing.name} near ${listing.stationName}`} />
        <span>{usesDigitalStyling ? "Digitally styled owner photography" : importedCover ? `${suppliers[importedCover.attribution]} photography` : "Owner-supplied photography"}</span>
      </div>
      <div className="detail-hero-copy">
        <span className={`chip ${listing.status}`}>{statusLabel}</span>
        <p className="label">{listing.district}, Bangkok</p>
        <h1>{listing.name}</h1>
        <strong>฿{listing.rent.toLocaleString()} <small>/ month</small></strong>
        <div className="hero-facts" aria-label="Key property facts"><span><b>{listing.sizeSqm}</b> sq m</span><span><b>{listing.bedrooms}</b> {listing.bedrooms === 1 ? "bedroom" : "bedrooms"}</span><span><b>{listing.floor}</b> floor</span></div>
        <a className="btn gold hero-contact" href={whatsapp} target="_blank" rel="noreferrer">Check availability <span>↗</span></a>
      </div>
      <div className="detail-hero-cta-mobile"><a className="btn gold hero-contact" href={whatsapp} target="_blank" rel="noreferrer">Check availability <span>↗</span></a></div>
    </header>

    {film && <section className="residence-film section">
      <div className="container residence-film-grid">
        <div className="residence-film-copy">
          <p className="eyebrow dark"><span /> {aiWalkthrough ? "AI-assisted walkthrough concept" : "Walk through the home"}</p>
          <h2>{aiWalkthrough ? "Move through the compact plan." : "See how the rooms connect."}</h2>
          <p>{aiWalkthrough ? "This cinematic walkthrough was created from the supplied room photographs to illustrate the flow between spaces. Confirm scale, finishes, and furnishings during the viewing." : film.kind === "attached" && attachedVideo ? `${attachedVideo.caption ? `${attachedVideo.caption}. ` : ""}${attachedVideo.attribution === "admin" ? "Filmed by REMARCABLE LIVING" : `Supplied by the ${attachedVideo.attribution}`} so you can judge the scale, daylight, and layout before arranging a viewing.` : film.kind === "curated" ? "The complete REMARCABLE LIVING tour is included so you can judge the scale, daylight, layout, and condition before arranging a viewing." : "Watch the video tour to judge the scale, daylight, layout, and condition before arranging a viewing."}</p>
          {"href" in film && <a className="text-link" href={film.href} target="_blank" rel="noreferrer">{`Open on ${film.kind === "youtube" ? "YouTube" : "Google Drive"} ↗`}</a>}
        </div>
        {"href" in film
          ? <iframe className="residence-film-embed" src={film.src} title={`${listing.name} video tour`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
          : <video controls playsInline preload="metadata" poster={heroImage} aria-label={`${listing.name} walkthrough`}>
            <source src={film.src} type={film.type} />
            {film.kind === "curated" && slug === baanKlangSlug && hasMedia(captionsTrack) && <track kind="captions" src={captionsTrack} srcLang="en" label="English" default />}
            Your browser does not support this property video.
          </video>}
      </div>
    </section>}

    {gallery.length === 0 && curated.planned > 0 && <section className="section residence-gallery-note" aria-label="Gallery status">
      <div className="container"><p className="notice" role="status">The room-by-room photographs for this home are being updated. Ask Mark for the current set before your viewing.</p></div>
    </section>}
    {gallery.length > 0 && <section className={`residence-gallery section ${usesDigitalStyling ? "portrait-gallery" : ""}`} aria-labelledby="gallery-title">
      <div className="container">
        <header className="sec-head">
          <div><p className="eyebrow dark"><span /> Room by room</p><h2 className="h2" id="gallery-title">The complete residence.</h2></div>
          <p className="lede">{galleryLede}</p>
        </header>
        <div className="gallery-grid">
          {gallery.map((photo, index) => <figure key={photo.src} className="gallery-item">
            <div><ListingImage src={photo.src} alt={photo.alt} /></div>
            <figcaption><span>{String(index + 1).padStart(2, "0")}</span>{photo.caption}</figcaption>
          </figure>)}
        </div>
      </div>
    </section>}

    <section className="detail-grid section">
      <div className="container detail-grid-inner">
        <div className="detail-copy">
          <p className="eyebrow dark"><span /> Residence details</p>
          <p className="lede">{listing.description}</p>
          <div className="facts">
            <div><b>{listing.bedrooms}</b><span>Bedroom{listing.bedrooms === 1 ? "" : "s"}</span></div>
            <div><b>{listing.bathrooms}</b><span>Bathroom{listing.bathrooms === 1 ? "" : "s"}</span></div>
            <div><b>{listing.sizeSqm}</b><span>Sq m</span></div>
            <div><b>{listing.floor}</b><span>Floor</span></div>
          </div>
          <div className="station">
            <h2 className="h3">{listing.stationType} {listing.stationName}</h2>
            <p>{slug === ashtonSlug ? "Approximately 20 metres from MRT Sukhumvit and 230 metres from BTS Asok. Distances are owner supplied and should be confirmed during the viewing." : `Approximately ${listing.walkMinutes} minutes on foot. Walking time is an estimate and should be checked during the viewing.`}</p>
          </div>
          <p className="verified">Last listing check: {listing.lastVerified}{listing.sourceUrl ? <> · <a href={listing.sourceUrl} target="_blank" rel="noreferrer">View original source ↗</a></> : " · Owner-supplied media"}</p>
          <a className="btn wa whatsapp" href={whatsapp} target="_blank" rel="noreferrer">Ask about this residence →</a>
        </div>
        <div className="map-card">
          <header><h3>Near {listing.stationType} {listing.stationName}</h3><span className="meta">OpenStreetMap</span></header>
          <iframe title={`Map near ${listing.stationName}`} src={map} loading="lazy" />
          <a className="text-link" href={`https://www.openstreetmap.org/?mlat=${listing.latitude}&mlon=${listing.longitude}#map=16/${listing.latitude}/${listing.longitude}`} target="_blank" rel="noreferrer">Open full map ↗</a>
        </div>
      </div>
    </section>

    {story && <section className="residence-story section on-dark">
      <div className="container">
        <header><div><p className="eyebrow"><span /> The life inside</p><h2>{story.title}</h2></div><p>{story.opening}</p></header>
        <div className="story-highlights">{story.highlights.map((highlight, index) => <article key={highlight}><b>{String(index + 1).padStart(2, "0")}</b><p>{highlight}</p></article>)}</div>
        <div className="story-editorial">
          <article><p className="story-label">Who should live here</p><h3>A home for the way you actually live.</h3><p>{story.idealFor}</p></article>
          <article><p className="story-label">Life nearby</p><h3>What the neighbourhood adds.</h3><p>{story.neighbourhood}</p></article>
        </div>
        <div className="nearby-places"><p className="story-label">Places in the neighbourhood</p>{story.nearby.map((place) => <article key={place.name}><h4>{place.name}</h4><p>{place.note}</p></article>)}</div>
        <a className="story-cta" href={whatsapp} target="_blank" rel="noreferrer">Ask Mark if this home fits your life <span>→</span></a>
      </div>
    </section>}

    <SiteFooter />
  </main>;
}
