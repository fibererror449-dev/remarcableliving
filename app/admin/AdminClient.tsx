"use client";
import { FormEvent, useEffect, useState } from "react";
import type { Listing, ListingStatus } from "../../lib/listings";

export default function AdminClient({ displayName }: { displayName: string }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [message, setMessage] = useState("");
  async function load() { const response = await fetch("/api/listings?admin=1"); const data = await response.json(); setListings(data.listings ?? []); }
  useEffect(() => {
    let active = true;
    fetch("/api/listings?admin=1")
      .then((response) => response.json())
      .then((data) => { if (active) setListings(data.listings ?? []); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  async function setStatus(id: number, status: ListingStatus) { await fetch(`/api/listings/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) }); setMessage("Listing status updated."); await load(); }
  async function addListing(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const payload = Object.fromEntries(form.entries()); const response = await fetch("/api/listings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); const data = await response.json(); if (!response.ok) { setMessage(data.error || "Could not add listing"); return; } event.currentTarget.reset(); setMessage("Listing added."); await load(); }
  return <main className="admin-page"><header><div><p>REMARCABLE LIVING back office</p><h1>Listings</h1></div><div><span>{displayName}</span><a href="/signout-with-chatgpt?return_to=/">Sign out</a></div></header>{message && <div className="admin-message">{message}</div>}<section className="admin-layout"><div className="admin-list"><h2>Inventory</h2>{listings.map((listing) => <article key={listing.id}><div><b>{listing.name}</b><span>{listing.district} · ฿{listing.rent.toLocaleString()} · {listing.status}</span></div><select aria-label={`Status for ${listing.name}`} value={listing.status} onChange={(event) => setStatus(listing.id, event.target.value as ListingStatus)}><option value="available">Available</option><option value="viewing">Viewing</option><option value="verify">Verify</option><option value="rented">Rented / close</option></select><a href={`/residences/${listing.slug}`}>View ↗</a></article>)}</div><form className="admin-form" onSubmit={addListing}><h2>Add listing</h2><input required name="name" placeholder="Condominium and unit name" /><div><input required name="district" placeholder="District" /><input required type="number" name="rent" placeholder="Rent THB" /></div><div><input name="bedrooms" type="number" min="0" placeholder="Beds" /><input name="bathrooms" type="number" min="1" placeholder="Baths" /><input required name="sizeSqm" type="number" step="0.1" placeholder="Size sq m" /></div><div><input name="floor" placeholder="Floor" /><select name="stationType"><option>BTS</option><option>MRT</option></select><input required name="stationName" placeholder="Station" /></div><div><input required name="walkMinutes" type="number" placeholder="Walk min" /><input required name="latitude" type="number" step="any" placeholder="Latitude" /><input required name="longitude" type="number" step="any" placeholder="Longitude" /></div><input name="image" placeholder="Image path or licensed image URL" /><input name="sourceUrl" type="url" placeholder="Original listing URL" /><input required name="lastVerified" type="date" /><textarea name="description" placeholder="Short factual description" /><select name="status"><option value="verify">Verify first</option><option value="available">Available</option><option value="viewing">Viewing</option></select><button>Add listing</button></form></section></main>;
}
