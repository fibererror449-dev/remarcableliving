"use client";
import { useState } from "react";
import { placeDescription, placeDirectories, placeHref, type DiscoveryPlace } from "../../../lib/discovery-data";
import type { PublicListing } from "../../../lib/listings-data";

export default function PlaceEditor({ places, listings }: { places: DiscoveryPlace[]; listings: PublicListing[] }) {
  const [descriptions, setDescriptions] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const place = places.find(place => String(place.id) === selected);
  return <form className="place-editor" onSubmit={async event => {
    event.preventDefault(); if (!place) return;
    setSaving(true); setMessage("");
    try {
      const response = await fetch(`/api/discovery/${place.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ description }) });
      if (response.ok) setDescriptions(current => ({ ...current, [place.id]: description }));
      setMessage(response.ok ? "Description saved." : "Could not save. Please retry.");
    } catch { setMessage("Connection lost. Please retry."); }
    finally { setSaving(false); }
  }}>
    <label>Place<select required value={selected} onChange={event => { const next = places.find(place => String(place.id) === event.target.value); setSelected(event.target.value); setDescription(next ? descriptions[next.id] ?? placeDescription(next, listings) : ""); setMessage(""); }}><option value="">Choose a place</option>{places.map(place => <option key={place.id} value={place.id}>{placeDirectories[place.kind].singular}: {place.name}</option>)}</select></label>
    {place && <><label>Description<textarea required maxLength={5000} rows={7} value={description} onChange={event => setDescription(event.target.value)} /></label><button type="submit" className="btn gold" disabled={saving}>{saving ? "Saving…" : "Save description"}</button><a className="text-link" href={placeHref(place)}>View collection →</a></>}
    {message && <p role="status">{message}</p>}
  </form>;
}
