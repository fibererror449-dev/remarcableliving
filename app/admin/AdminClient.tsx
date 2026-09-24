"use client";
import { useEffect, useRef, useState } from "react";
import BrandLogo from "../components/BrandLogo";
import ListingEditor, { type EditorHandle, type SavedListing } from "./ListingEditor";
import MediaLibrary from "./MediaLibrary";
import type { AdminListing, ListingStatus, MediaSummary } from "../../lib/listings-data";
import { videoKindLabel } from "../../lib/video";

function photoLabel(media: MediaSummary) {
  if (media.photos) return `${media.photos} ${media.photos === 1 ? "photo" : "photos"}`;
  return media.cover ? "Cover photo only" : "No photos";
}

export default function AdminClient({ displayName }: { displayName: string }) {
  const [listings, setListings] = useState<AdminListing[] | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [message, setMessage] = useState<{ text: string; url?: string } | null>(null);
  const editor = useRef<EditorHandle>(null);
  async function load() { const response = await fetch("/api/listings?admin=1"); const data = await response.json() as { listings?: AdminListing[] }; if (response.ok) setListings(data.listings ?? []); }
  useEffect(() => {
    let active = true;
    fetch("/api/listings?admin=1")
      .then((response) => response.json() as Promise<{ listings?: AdminListing[] }>)
      .then((data) => { if (active) setListings(data.listings ?? []); })
      .catch(() => { if (active) setListings([]); });
    return () => { active = false; };
  }, []);
  function showEditor(id: number | null) {
    setEditing(id); setFormKey((key) => key + 1); setMessage(null);
    requestAnimationFrame(() => document.getElementById("listing-editor")?.scrollIntoView({ behavior: "instant", block: "start" }));
  }
  async function saved(result: SavedListing, created: boolean) {
    setMessage({ text: created ? "Listing added." : "Listing saved.", url: result.url });
    setEditing(null); setFormKey((key) => key + 1);
    await load().catch(() => undefined);
  }
  async function setStatus(id: number, status: ListingStatus) { try { const response = await fetch(`/api/listings/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) }); if (!response.ok) { setMessage({ text: "Could not update listing status. Please retry." }); return; } setMessage({ text: "Listing status updated." }); await load(); } catch { setMessage({ text: "Connection lost. Please retry the status change." }); } }
  const withoutPhotos = listings?.filter((listing) => !listing.media.photos).length ?? 0;
  const withoutVideo = listings?.filter((listing) => !listing.media.video).length ?? 0;
  return <main className="admin-page"><header className="admin-header"><div><a className="brand" href="/" aria-label="REMARCABLE LIVING home"><BrandLogo /></a><h1>Site admin</h1></div><div className="admin-account"><span>{displayName}</span><nav aria-label="Admin account"><a href="/admin/imports">Review imports</a><a href="/">View website</a><a href="/signout-with-chatgpt?return_to=/">Sign out</a></nav></div></header>
    <MediaLibrary onUse={(item) => editor.current?.attachLibraryItem(item)} />
    {message && <div className="admin-message" role="status">{message.text}{message.url && <> <a href={message.url}>View listing ↗</a></>}</div>}
    <section className="admin-layout">
      <div className="admin-list">
        <header className="admin-list-head"><h2>Inventory</h2><button type="button" onClick={() => showEditor(null)}>+ New listing</button></header>
        {listings && listings.length > 0 && <p className="admin-list-summary">{listings.length} listings · {withoutPhotos} without gallery photos · {withoutVideo} without a video</p>}
        {!listings && <p role="status">Loading listings…</p>}
        {listings?.map((listing) => <article key={listing.id} aria-current={editing === listing.id || undefined}>
          <div><b>{listing.name}</b><span>{listing.district} · ฿{listing.rent.toLocaleString()} · {listing.status}</span>
            <span className="admin-media-counts" aria-label={`Media for ${listing.name}`}>
              <span className={listing.media.photos ? "has" : "missing"}>{photoLabel(listing.media)}</span>
              <span className={listing.media.video ? "has" : "missing"}>{listing.media.video ? videoKindLabel[listing.media.video] : "No video"}</span>
            </span>
          </div>
          <select aria-label={`Status for ${listing.name}`} value={listing.status} onChange={(event) => setStatus(listing.id, event.target.value as ListingStatus)}><option value="available">Available</option><option value="viewing">Viewing</option><option value="verify">Verify</option><option value="rented">Rented / close</option></select>
          <button type="button" className="admin-edit" onClick={() => showEditor(listing.id)} aria-label={`Edit ${listing.name}`}>Edit</button>
          <a href={`/residences/${listing.slug}`} aria-label={`View ${listing.name}`}>View ↗</a>
        </article>)}
      </div>
      <ListingEditor key={formKey} ref={editor} listingId={editing} onSaved={saved} onCancel={() => showEditor(null)} />
    </section>
  </main>;
}
