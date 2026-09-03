import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getListingStory } from "../../../lib/listing-stories";
import { getListing } from "../../../lib/listings";

export const dynamic = "force-dynamic";

const siteOrigin = "https://www.remarcableliving.co";
const baanKlangSlug = "baan-klang-krung-siam-2br";
const ashtonSlug = "ashton-asoke-3br-42f";
const centricAriSlug = "centric-ari-station-1br";
const baanKlangHero = "/properties/baan-klang-krung-siam/gallery/ad-09-living-wide.jpg";
const ashtonHero = "/properties/ashton-asoke/786342964_2664258444007827_8397648305202113964_n.jpg";
const centricAriHero = "/properties/centric-ari-station/06-living-room-rug-edited.png";

const baanKlangGallery = [
  { src: "/properties/baan-klang-krung-siam/gallery/ad-01-kitchen-close.jpg", alt: "Fitted kitchen with wood cabinetry, oven, refrigerator, and washing machine", caption: "Kitchen · fitted appliances" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-02-kidsroom-door.jpg", alt: "Second bedroom viewed from the doorway with a bed, desk, shelving, and green wardrobe", caption: "Second bedroom · doorway view" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-03-living-tv.jpg", alt: "Living room with television, sofa, balcony windows, and the main bedroom doorway", caption: "Living room · balcony light" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-07-living-dining.jpg", alt: "Open living and dining room with four-seat table and wide balcony windows", caption: "Living & dining · open plan" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-12-bath-tub.jpg", alt: "Bathroom with bathtub, vessel basin, large mirror, and window", caption: "Bathroom · full bathtub" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-13-dining-kitchen-2.jpg", alt: "Dining area looking toward the fitted kitchen and condominium entrance", caption: "Dining · kitchen connection" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-09-living-wide.jpg", alt: "Wide living room view with sofa, dining table, and balcony glazing", caption: "Living room · wide view" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-04-kitchen-living-long.jpg", alt: "Long view from the fitted kitchen through the dining area to the living room", caption: "Kitchen · living beyond" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-14-kidsroom.jpg", alt: "Second bedroom with bed, green wardrobe, desk, and built-in shelving", caption: "Second bedroom · desk & shelving" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-08-bath-master.jpg", alt: "Bathroom with glass shower, toilet, vessel basin, and large mirror", caption: "Bathroom · glass shower" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-11-master-window.jpg", alt: "Main bedroom with a large corner window, bed, wardrobes, and vanity", caption: "Main bedroom · corner windows" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-06-master-vanity.jpg", alt: "Main bedroom showing the bed, vanity, wardrobe, and bathroom doorway", caption: "Main bedroom · storage & vanity" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-05-dining-kitchen.jpg", alt: "Dining table and fitted kitchen viewed toward the condominium entrance", caption: "Dining · kitchen & entry" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-10-master-ensuite.jpg", alt: "Main bedroom with bed, wardrobe, window curtains, and bathroom doorway", caption: "Main bedroom · ensuite connection" },
  { src: "/properties/baan-klang-krung-siam/gallery/ad-15-bath-kids.jpg", alt: "Second bathroom with glass shower, toilet, basin, and bedroom reflected in the mirror", caption: "Second bathroom · walk-in shower" },
];

const ashtonGallery = [
  { src: "/properties/ashton-asoke/785600009_2664258387341166_2773769161220953558_n.jpg", alt: "Living and dining room with curved glass windows and a high-floor Bangkok view", caption: "Living & dining · panoramic glass" },
  { src: "/properties/ashton-asoke/787651634_2664258280674510_1837080743964192759_n.jpg", alt: "Wide living room with leather sofa, television, dining table, and city panorama", caption: "Living room · city panorama" },
  { src: "/properties/ashton-asoke/787541111_2664258497341155_5814287453646011722_n.jpg", alt: "Curved corner windows beside the furnished living room", caption: "Signature curve · skyline view" },
  { src: "/properties/ashton-asoke/787341599_2664259000674438_9220233050709240374_n.jpg", alt: "Unblocked panoramic view across the Bangkok skyline from the 42nd floor", caption: "42nd floor · unblocked outlook" },
  { src: "/properties/ashton-asoke/785688657_2664258814007790_5252665104865592283_n.jpg", alt: "Decorated bedroom with upholstered bed, wardrobes, and window seat", caption: "Bedroom · fitted storage" },
  { src: "/properties/ashton-asoke/787409620_2664258900674448_9182342866815816242_n.jpg", alt: "Front view of decorated bedroom with mirrored wardrobes and built-in seating", caption: "Bedroom · tailored details" },
  { src: "/properties/ashton-asoke/789085141_2664258617341143_717262392746460507_n.jpg", alt: "Bedroom beside a glass-walled bathroom and bathtub", caption: "Bedroom · glass bathroom suite" },
  { src: "/properties/ashton-asoke/788151357_2664258684007803_2233080501050944012_n.jpg", alt: "Leather sofa beneath framed artwork in a fully decorated sitting area", caption: "Sitting room · curated décor" },
  { src: "/properties/ashton-asoke/789325550_2664258740674464_3287056049430656030_n.jpg", alt: "Warmly lit internal hallway with mirrored wall panels", caption: "Hallway · private bedroom wing" },
];

const centricAriGallery = [
  { src: "/properties/centric-ari-station/06-living-room-rug-edited.png", alt: "Open living and dining area with a grey sofa and textured rug", caption: "Living & dining · softly layered" },
  { src: "/properties/centric-ari-station/12-kitchen-fridge-small-wall-art-edited.png", alt: "Compact kitchen with dark cabinetry, refrigerator, sink, and microwave", caption: "Kitchen · streamlined storage" },
  { src: "/properties/centric-ari-station/10-tv-shelving-option-b-edited.png", alt: "Television console beneath a slim oak shelf beside tall windows", caption: "Media wall · pared-back detail" },
  { src: "/properties/centric-ari-station/01-bedroom-door-entrance-edited.png", alt: "Bright bedroom with an upholstered bed, sage accents, and tall windows", caption: "Bedroom · restful city outlook" },
  { src: "/properties/centric-ari-station/02-bedroom-curtain-edited.png", alt: "Upholstered bed beside layered curtains and a softly lit bedside table", caption: "Bedroom · softened daylight" },
  { src: "/properties/centric-ari-station/03-bedroom-lamp-edited.png", alt: "Bedroom with a warm bedside lamp, timber door, and neutral finishes", caption: "Bedroom · evening mood" },
  { src: "/properties/centric-ari-station/07-bedroom-view-bed-throw-edited.png", alt: "Bedroom with a mirrored wardrobe, vanity, and direct bathroom access", caption: "Bedroom · storage & bathroom" },
  { src: "/properties/centric-ari-station/04-bathroom-unchanged.jpeg", alt: "Compact tiled bathroom with a vanity, mirror, and toilet through the doorway", caption: "Bathroom · integrated vanity" },
  { src: "/properties/centric-ari-station/05-bathroom-unchanged.jpeg", alt: "Grey-tiled bathroom with a glass walk-in shower, toilet, and open shelving", caption: "Bathroom · walk-in shower" },
  { src: "/properties/centric-ari-station/08-entry-view-curtains-rug-edited.png", alt: "Apartment entry opening toward the living room and balcony doors", caption: "Arrival · living room beyond" },
  { src: "/properties/centric-ari-station/11-water-heater-edited.png", alt: "Glass-enclosed shower with a wall-mounted water heater and chrome fixtures", caption: "Shower · dedicated hot water" },
];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) return {};
  const detailHero = slug === baanKlangSlug ? baanKlangHero : slug === ashtonSlug ? ashtonHero : slug === centricAriSlug ? centricAriHero : listing.image;
  const image = new URL(detailHero, siteOrigin).toString();
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
  const listingVideo = slug === baanKlangSlug
    ? "/properties/baan-klang-krung-siam-walkthrough-v2.mp4"
    : slug === centricAriSlug
      ? "/properties/centric-ari-station/cinematic-walkthrough.mp4"
      : null;
  const gallery = slug === baanKlangSlug ? baanKlangGallery : slug === ashtonSlug ? ashtonGallery : slug === centricAriSlug ? centricAriGallery : [];
  const heroImage = slug === baanKlangSlug ? baanKlangHero : slug === ashtonSlug ? ashtonHero : slug === centricAriSlug ? centricAriHero : listing.image;
  const usesDigitalStyling = slug === centricAriSlug;
  const delta = 0.006;
  const map = `https://www.openstreetmap.org/export/embed.html?bbox=${listing.longitude-delta}%2C${listing.latitude-delta}%2C${listing.longitude+delta}%2C${listing.latitude+delta}&layer=mapnik&marker=${listing.latitude}%2C${listing.longitude}`;
  const whatsapp = `https://wa.me/66634962466?text=${encodeURIComponent(`Hi Mark, I am interested in ${listing.name} at ฿${listing.rent.toLocaleString()}/month.`)}`;
  return <main className="detail-page">
    <nav className="detail-nav"><Link className="brand" href="/" aria-label="REMARCABLE LIVING home"><span className="brand-mark">R</span><span>REMARCABLE LIVING</span></Link><Link href="/#residences">← All residences</Link></nav>
    <header className="detail-hero"><div className="detail-hero-image"><img className={usesDigitalStyling ? "portrait-source" : undefined} src={heroImage} alt={`Interior of ${listing.name} near ${listing.stationName}`} /><span>{usesDigitalStyling ? "Digitally styled owner photography" : "Owner-supplied photography"}</span></div><div><span className={`status ${listing.status}`}>{listing.status === "available" ? "Available now" : listing.status === "viewing" ? "Viewing in progress" : listing.status === "rented" ? "Rented" : "Availability to confirm"}</span><p>{listing.district}, Bangkok</p><h1>{listing.name}</h1><strong>฿{listing.rent.toLocaleString()} <small>/ month</small></strong><div className="hero-facts" aria-label="Key property facts"><span><b>{listing.sizeSqm}</b> sq m</span><span><b>{listing.bedrooms}</b> bedrooms</span><span><b>{listing.floor}</b> floor</span></div><a className="hero-contact" href={whatsapp} target="_blank" rel="noreferrer">Check availability <span>↗</span></a></div></header>
    {listingVideo && <section className="residence-film"><div><p className="eyebrow dark"><span /> {usesDigitalStyling ? "AI-assisted walkthrough concept" : "Walk through the home"}</p><h2>{usesDigitalStyling ? "Move through the compact plan." : "See how the rooms connect."}</h2><p>{usesDigitalStyling ? "This cinematic walkthrough was created from the supplied room photographs to illustrate the flow between spaces. Confirm scale, finishes, and furnishings during the viewing." : "The complete REMARCABLE LIVING tour is included so you can judge the scale, daylight, layout, and condition before arranging a viewing."}</p></div><video controls playsInline preload="metadata" poster={heroImage} aria-label={`${listing.name} walkthrough`}><source src={listingVideo} type="video/mp4" />{slug === baanKlangSlug && <track kind="captions" src="/properties/baan-klang-krung-siam-walkthrough-v2.vtt" srcLang="en" label="English" default />}Your browser does not support this property video.</video></section>}
    {gallery.length > 0 && <section className={`residence-gallery ${usesDigitalStyling ? "portrait-gallery" : ""}`} aria-labelledby="gallery-title"><header><div><p className="eyebrow dark"><span /> Room by room</p><h2 id="gallery-title">The complete residence.</h2></div><p>{slug === ashtonSlug ? "Nine owner-supplied views across the panoramic living areas, bedrooms, bathroom suite, and private hallway." : usesDigitalStyling ? <>Eleven views across the living area, kitchen, bedroom, and bathroom.<small>Decorative colours and selected styling details are digitally visualised. Confirm the unit’s current furnishings and condition during the viewing.</small></> : "Fifteen owner-supplied views, kept in the supplied sequence across the kitchen, living areas, bedrooms, and bathrooms."}</p></header><div className="gallery-grid">{gallery.map((photo, index) => <figure key={photo.src} className={`gallery-item gallery-item-${index + 1}`}><img src={photo.src} alt={photo.alt} loading={index < 2 ? "eager" : "lazy"} /><figcaption><span>{String(index + 1).padStart(2, "0")}</span>{photo.caption}</figcaption></figure>)}</div></section>}
    <section className="detail-grid"><div className="detail-copy"><p className="eyebrow dark"><span /> Residence details</p><p className="lede">{listing.description}</p><div className="facts"><div><b>{listing.bedrooms}</b><span>Bedroom{listing.bedrooms === 1 ? "" : "s"}</span></div><div><b>{listing.bathrooms}</b><span>Bathroom{listing.bathrooms === 1 ? "" : "s"}</span></div><div><b>{listing.sizeSqm}</b><span>Sq m</span></div><div><b>{listing.floor}</b><span>Floor</span></div></div><h2>{listing.stationType} {listing.stationName}</h2><p>{slug === ashtonSlug ? "Approximately 20 metres from MRT Sukhumvit and 230 metres from BTS Asok. Distances are owner supplied and should be confirmed during the viewing." : `Approximately ${listing.walkMinutes} minutes on foot. Walking time is an estimate and should be checked during the viewing.`}</p><p className="verified">Last listing check: {listing.lastVerified}{listing.sourceUrl ? <> · <a href={listing.sourceUrl} target="_blank" rel="noreferrer">View original source ↗</a></> : " · Owner-supplied media"}</p><a className="whatsapp" href={whatsapp} target="_blank" rel="noreferrer">Ask about this residence →</a></div><div className="map-card"><iframe title={`Map near ${listing.stationName}`} src={map} loading="lazy" /><a href={`https://www.openstreetmap.org/?mlat=${listing.latitude}&mlon=${listing.longitude}#map=16/${listing.latitude}/${listing.longitude}`} target="_blank" rel="noreferrer">Open full map ↗</a></div></section>
    {story && <section className="residence-story">
      <header><p className="eyebrow"><span /> The life inside</p><h2>{story.title}</h2><p>{story.opening}</p></header>
      <div className="story-highlights">{story.highlights.map((highlight, index) => <article key={highlight}><b>0{index + 1}</b><p>{highlight}</p></article>)}</div>
      <div className="story-editorial">
        <article><p className="story-label">Who should live here</p><h3>A home for the way you actually live.</h3><p>{story.idealFor}</p></article>
        <article><p className="story-label">Life nearby</p><h3>What the neighbourhood adds.</h3><p>{story.neighbourhood}</p></article>
      </div>
      <div className="nearby-places"><p className="story-label">Places in the neighbourhood</p>{story.nearby.map((place) => <article key={place.name}><h4>{place.name}</h4><p>{place.note}</p></article>)}</div>
      <a className="story-cta" href={whatsapp} target="_blank" rel="noreferrer">Ask Mark if this home fits your life <span>→</span></a>
    </section>}
  </main>;
}
