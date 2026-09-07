import ListingImage from "../ListingImage";
import { statusLabel, type PublicListing } from "../../lib/listings-data";

export default function ListingCard({ listing, index }: { listing: PublicListing; index: number }) {
  return (
    <article className="property-card">
      <a className="property-visual" href={`/residences/${listing.slug}`} aria-label={`View ${listing.name}`}>
        <ListingImage src={listing.image} alt={`Bangkok condominium option in ${listing.district}`} />
        <span className={`chip property-tag ${listing.status}`}>{statusLabel(listing.status)}</span>
        <span className="property-number">{String(index + 1).padStart(2, "0")}</span>
      </a>
      <div className="property-info">
        <p className="meta">{listing.district} · {listing.stationType} {listing.stationName} · {listing.walkMinutes} min walk</p>
        <h3><a href={`/residences/${listing.slug}`}>{listing.name}</a></h3>
        <div className="property-meta"><b>฿{listing.rent.toLocaleString()} / month</b><span className="meta">{listing.bedrooms} bed · {listing.bathrooms} bath · {listing.sizeSqm} sq m</span></div>
      </div>
    </article>
  );
}
