"use client";
import { FormEvent, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import type { AdminListingDetail, AttachedMedia, MediaAttribution } from "../../lib/listings-data";
import { MAX_UPLOAD_BYTES, MEDIA_TYPES, type UploadedMedia } from "../../lib/uploads";
import { parseVideoLink, VIDEO_LINK_HELP, videoKindLabel } from "../../lib/video";

export type EditorHandle = { attachLibraryItem: (item: UploadedMedia) => void };
export type SavedListing = { id: number; slug: string; url: string };
type Video = { kind: "link"; url: string } | { kind: "file"; item: AttachedMedia } | null;
type VideoTab = "youtube" | "drive" | "upload";
type Upload = { key: string; name: string; progress: number };

const fields: { key: string; label: string; type?: "number" | "date" | "url"; step?: string; min?: string; required?: boolean; wide?: boolean; options?: [string, string][] }[] = [
  { key: "name", label: "Condominium and unit name", required: true, wide: true },
  { key: "district", label: "District", required: true },
  { key: "rent", label: "Rent (THB / month)", type: "number", step: "1", min: "1", required: true },
  { key: "status", label: "Availability", options: [["verify", "Verify first"], ["available", "Available"], ["viewing", "Viewing"], ["rented", "Rented / close"]] },
  { key: "bedrooms", label: "Bedrooms", type: "number", step: "1", min: "0" },
  { key: "bathrooms", label: "Bathrooms", type: "number", step: "1", min: "1" },
  { key: "sizeSqm", label: "Size (sq m)", type: "number", step: "0.1", min: "0.1", required: true },
  { key: "floor", label: "Floor" },
  { key: "stationType", label: "Station type", options: [["BTS", "BTS"], ["MRT", "MRT"]] },
  { key: "stationName", label: "Station", required: true },
  { key: "walkMinutes", label: "Walk to station (min)", type: "number", step: "1", min: "0", required: true },
  { key: "latitude", label: "Latitude", type: "number", step: "any", required: true },
  { key: "longitude", label: "Longitude", type: "number", step: "any", required: true },
  { key: "lastVerified", label: "Last verified", type: "date", required: true },
  { key: "sourceUrl", label: "Original listing URL", type: "url", wide: true },
  { key: "description", label: "Short factual description", wide: true },
];
const suppliers: [MediaAttribution, string][] = [["owner", "Owner"], ["agent", "Agent"], ["admin", "REMARCABLE LIVING"]];
const photoTypes = Object.keys(MEDIA_TYPES).filter((type) => type.startsWith("image/"));
const videoTypes = Object.keys(MEDIA_TYPES).filter((type) => type.startsWith("video/"));
const blank = () => ({ status: "verify", bedrooms: "1", bathrooms: "1", stationType: "BTS", lastVerified: new Date().toLocaleDateString("en-CA") });
const preview = (item: AttachedMedia) => `/api/admin/imports/media/${item.id}`;
const coverPath = (item: AttachedMedia) => `/listing-media/${item.id}`;

function sendFile(file: File, onProgress: (percent: number) => void, requests: Set<XMLHttpRequest>): Promise<AttachedMedia> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest(); requests.add(xhr);
    xhr.open("POST", "/api/listing-media");
    xhr.setRequestHeader("content-type", file.type);
    xhr.setRequestHeader("x-file-name", encodeURIComponent(file.name));
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => {
      requests.delete(xhr);
      let data: { item?: Omit<AttachedMedia, "caption" | "attribution">; error?: string } = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* reported below */ }
      if (xhr.status !== 201 || !data.item) reject(new Error(`${file.name}: ${data.error || "upload failed. Please retry."}`));
      else resolve({ ...data.item, caption: "", attribution: "owner" });
    };
    xhr.onerror = () => { requests.delete(xhr); reject(new Error(`${file.name}: connection lost. Please retry.`)); };
    xhr.onabort = () => { requests.delete(xhr); reject(new Error(`${file.name}: upload cancelled.`)); };
    xhr.send(file);
  });
}

export default function ListingEditor({ listingId, onSaved, onCancel, ref }: { listingId: number | null; onSaved: (saved: SavedListing, created: boolean) => void; onCancel: () => void; ref?: Ref<EditorHandle> }) {
  const [values, setValues] = useState<Record<string, string>>(blank);
  const [image, setImage] = useState("");
  const [photos, setPhotos] = useState<AttachedMedia[]>([]);
  const [video, setVideo] = useState<Video>(null);
  const [videoTab, setVideoTab] = useState<VideoTab>("youtube");
  const [linkDraft, setLinkDraft] = useState("");
  const [curated, setCurated] = useState({ photos: 0, video: false });
  const [loaded, setLoaded] = useState(listingId === null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const requests = useRef(new Set<XMLHttpRequest>());

  useEffect(() => {
    const pending = requests.current;
    if (listingId === null) return () => pending.forEach((xhr) => xhr.abort());
    let active = true;
    fetch(`/api/listings/${listingId}`).then(async (response) => {
      const data = await response.json() as AdminListingDetail & { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not load the listing.");
      if (!active) return;
      const { listing } = data;
      setValues(Object.fromEntries(fields.map((field) => [field.key, String(listing[field.key as keyof typeof listing] ?? "")])));
      setImage(listing.image);
      setPhotos(data.media.filter((item) => item.mime.startsWith("image/")));
      const file = data.media.find((item) => item.mime.startsWith("video/"));
      const link = listing.videoUrl ? parseVideoLink(listing.videoUrl) : null;
      setVideo(link ? { kind: "link", url: link.href } : file ? { kind: "file", item: file } : null);
      setLinkDraft(link?.href ?? "");
      setVideoTab(link ? link.kind : file ? "upload" : "youtube");
      setCurated(data.curated);
      setLoaded(true);
    }).catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : "Could not load the listing."); });
    return () => { active = false; pending.forEach((xhr) => xhr.abort()); };
  }, [listingId]);

  function attach(item: AttachedMedia) {
    if (item.mime.startsWith("video/")) { setVideo({ kind: "file", item }); setLinkDraft(""); setVideoTab("upload"); return; }
    setPhotos((previous) => previous.some((photo) => photo.id === item.id) ? previous : [...previous, item]);
  }

  useImperativeHandle(ref, () => ({
    attachLibraryItem: async (item) => {
      setError(""); setDetails([]); setNotice("");
      try {
        const response = await fetch("/api/listing-media", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ libraryKey: item.key }) });
        const data = await response.json() as { item?: Omit<AttachedMedia, "caption" | "attribution">; error?: string };
        if (!response.ok || !data.item) throw new Error(data.error || "Could not add that file. Please retry.");
        attach({ ...data.item, caption: "", attribution: "owner" });
        setNotice(`${item.name} added to this listing. Save the listing to publish it.`);
      } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not add that file. Please retry."); }
    },
  }));

  async function upload(files: File[], expect: "photo" | "video" | "any") {
    setError(""); setDetails([]); setNotice("");
    const problems: string[] = [];
    const accepted = files.filter((file) => {
      const isVideo = videoTypes.includes(file.type);
      if (!photoTypes.includes(file.type) && !isVideo) { problems.push(`${file.name}: ${file.type.startsWith("audio/") ? "audio files cannot be attached; use a video file" : "use JPG, PNG, WebP or GIF photos, or MP4, MOV or WebM video"}.`); return false; }
      if (expect === "photo" && isVideo) { problems.push(`${file.name}: add videos in the Video section below.`); return false; }
      if (expect === "video" && !isVideo) { problems.push(`${file.name}: choose an MP4, MOV or WebM video.`); return false; }
      if (!file.size || file.size > MAX_UPLOAD_BYTES) { problems.push(`${file.name}: files must be under 50 MB.${isVideo ? " For a longer video, upload it to YouTube or Google Drive and paste the link." : ""}`); return false; }
      return true;
    });
    const videos = accepted.filter((file) => videoTypes.includes(file.type));
    if (videos.length > 1) problems.push("A listing plays one video; only the first one was uploaded.");
    const queue = accepted.filter((file) => !videoTypes.includes(file.type) || file === videos[0]);
    const entries = queue.map((file, index) => ({ file, key: `${Date.now()}-${index}` }));
    setUploads((previous) => [...previous, ...entries.map(({ file, key }) => ({ key, name: file.name, progress: 0 }))]);
    let added = 0;
    for (const { file, key } of entries) {
      try { attach(await sendFile(file, (progress) => setUploads((previous) => previous.map((entry) => entry.key === key ? { ...entry, progress } : entry)), requests.current)); added++; }
      catch (failure) { problems.push(failure instanceof Error ? failure.message : `${file.name}: upload failed.`); }
      finally { setUploads((previous) => previous.filter((entry) => entry.key !== key)); }
    }
    if (added) setNotice(`${added} ${added === 1 ? "file" : "files"} uploaded. Save the listing to publish ${added === 1 ? "it" : "them"}.`);
    if (problems.length) { setError("Some files were not added."); setDetails(problems); }
  }

  function changeLink(value: string) {
    setLinkDraft(value);
    const link = parseVideoLink(value);
    if (link) { setVideo({ kind: "link", url: link.href }); setVideoTab(link.kind); }
    else if (!value.trim() && video?.kind === "link") setVideo(null);
  }
  function removePhoto(item: AttachedMedia) { setPhotos(photos.filter((photo) => photo !== item)); if (image === coverPath(item)) setImage(""); }
  function movePhoto(index: number, offset: number) { const next = [...photos]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; setPhotos(next); }
  function editPhoto(index: number, change: Partial<AttachedMedia>) { setPhotos(photos.map((photo, position) => position === index ? { ...photo, ...change } : photo)); }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(""); setDetails([]); setNotice("");
    if (uploads.length) { setError("Wait for the uploads to finish, then save."); return; }
    if (linkDraft.trim() && !parseVideoLink(linkDraft)) { setError(`The video link is not recognised. ${VIDEO_LINK_HELP} Or clear it.`); return; }
    const media = [...photos, ...(video?.kind === "file" ? [video.item] : [])].map(({ id, caption, attribution }) => ({ id, caption, attribution }));
    setBusy(true);
    try {
      const response = await fetch(listingId === null ? "/api/listings" : `/api/listings/${listingId}`, { method: listingId === null ? "POST" : "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...values, image, videoUrl: video?.kind === "link" ? video.url : "", media }) });
      const data = await response.json().catch(() => ({})) as Partial<SavedListing> & { error?: string; details?: unknown };
      if (!response.ok || !data.slug) { setError(data.error || "Could not save the listing. Your changes are still in the form; please retry."); if (Array.isArray(data.details)) setDetails(data.details.map(String)); return; }
      onSaved(data as SavedListing, listingId === null);
    } catch { setError("Connection lost. Your changes are still in the form; please retry."); }
    finally { setBusy(false); }
  }

  const coverIndex = photos.findIndex((photo) => image === coverPath(photo));
  const linkInvalid = Boolean(linkDraft.trim()) && !parseVideoLink(linkDraft);
  const activeLink = video?.kind === "link" ? parseVideoLink(video.url) : null;
  const heading = listingId === null ? "Add listing" : `Edit ${values.name || "listing"}`;

  return <form id="listing-editor" className="admin-form listing-editor" onSubmit={save} aria-labelledby="listing-editor-heading" aria-busy={!loaded || busy}>
    <header className="editor-head">
      <h2 id="listing-editor-heading">{heading}</h2>
      {listingId !== null && <button type="button" className="quiet" onClick={onCancel}>Cancel editing</button>}
    </header>
    {!loaded && !error && <p role="status">Loading listing…</p>}
    <fieldset className="editor-fields" disabled={!loaded || busy}>
      <legend className="editor-legend">Listing facts</legend>
      {fields.map((field) => {
        const value = values[field.key] ?? "";
        const change = (next: string) => setValues((previous) => ({ ...previous, [field.key]: next }));
        const control = field.options
          ? <select value={value} onChange={(event) => change(event.target.value)}>{field.options.map(([option, label]) => <option key={option} value={option}>{label}</option>)}</select>
          : field.key === "description"
            ? <textarea value={value} onChange={(event) => change(event.target.value)} />
            : <input type={field.type ?? "text"} step={field.step} min={field.min} required={field.required} value={value} onChange={(event) => change(event.target.value)} />;
        return <label key={field.key} className={field.wide ? "wide" : undefined}>{field.label}{control}</label>;
      })}
    </fieldset>

    <fieldset className="editor-media" disabled={!loaded || busy}>
      <legend className="editor-legend">Photos <span>{photos.length + curated.photos}</span></legend>
      {curated.photos > 0 && <p className="editor-hint">{curated.photos} hand-curated photos are built into this residence’s page. Photos added here appear after them.</p>}
      <label className={`editor-drop${dragging ? " dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); upload([...event.dataTransfer.files], "any"); }}>
        <b>Add photos</b>
        <span>Drag photos here or choose files · JPG, PNG, WebP or GIF · up to 50 MB each. You can also use “Add to listing” in the media library.</span>
        <input type="file" multiple accept={photoTypes.join(",")} onChange={(event) => { const files = [...(event.target.files ?? [])]; event.target.value = ""; upload(files, "photo"); }} />
      </label>
      {photos.length === 0 && <p className="editor-hint">No photos attached yet. The first photo becomes the cover unless you choose another.</p>}
      <ol className="editor-photos">{photos.map((photo, index) => {
        const label = photo.caption || photo.name || `photo ${index + 1}`;
        return <li key={photo.id}>
          <img src={preview(photo)} alt={photo.caption || photo.name} loading="lazy" />
          <div>
            <span className="editor-photo-number">{String(index + 1 + curated.photos).padStart(2, "0")}{index === coverIndex && <b>Cover</b>}</span>
            <label className="editor-caption">Caption<input value={photo.caption} maxLength={500} placeholder="e.g. Living room · balcony light" onChange={(event) => editPhoto(index, { caption: event.target.value })} /></label>
            <label>Supplied by<select value={photo.attribution} onChange={(event) => editPhoto(index, { attribution: event.target.value as MediaAttribution })}>{suppliers.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>
            <label className="editor-cover"><input type="radio" name="cover" checked={index === coverIndex} onChange={() => setImage(coverPath(photo))} />Use as cover photo</label>
            <div className="editor-photo-actions">
              <button type="button" className="quiet" disabled={index === 0} onClick={() => movePhoto(index, -1)} aria-label={`Move ${label} earlier`}>↑</button>
              <button type="button" className="quiet" disabled={index === photos.length - 1} onClick={() => movePhoto(index, 1)} aria-label={`Move ${label} later`}>↓</button>
              <button type="button" className="quiet" onClick={() => removePhoto(photo)} aria-label={`Remove ${label}`}>Remove</button>
            </div>
          </div>
        </li>;
      })}</ol>
      {coverIndex < 0 && <div className="editor-cover-url">
        {image && <img src={image} alt="Current cover" />}
        <label>Cover image URL<input value={image} onChange={(event) => setImage(event.target.value)} placeholder={photos.length ? "Blank uses the first photo" : "/media/… or https://…"} /><span className="editor-hint">{photos.length ? "Or tick “Use as cover photo” on one of the photos above." : "Upload photos above to choose one as the cover."}</span></label>
      </div>}
    </fieldset>

    <fieldset className="editor-media" disabled={!loaded || busy}>
      <legend className="editor-legend">Video</legend>
      <div className="editor-tabs" role="group" aria-label="Video source">
        {([["youtube", "YouTube link"], ["drive", "Google Drive link"], ["upload", "Upload a file"]] as [VideoTab, string][]).map(([tab, label]) => <button key={tab} type="button" aria-pressed={videoTab === tab} onClick={() => setVideoTab(tab)}>{label}</button>)}
      </div>
      {videoTab === "upload"
        ? <label className="editor-drop">
          <b>Choose a video file</b>
          <span>MP4, MOV or WebM · up to 50 MB. For a longer tour, upload it to YouTube or Google Drive and paste the link.</span>
          <input type="file" accept={videoTypes.join(",")} onChange={(event) => { const files = [...(event.target.files ?? [])]; event.target.value = ""; upload(files, "video"); }} />
        </label>
        : <label>{videoTab === "youtube" ? "YouTube link" : "Google Drive share link"}
          <input type="url" value={linkDraft} onChange={(event) => changeLink(event.target.value)} aria-invalid={linkInvalid || undefined} placeholder={videoTab === "youtube" ? "https://www.youtube.com/watch?v=… or https://youtu.be/…" : "https://drive.google.com/file/d/…/view"} />
          {linkInvalid ? <span className="editor-error">Not a YouTube or Google Drive video link yet.</span> : videoTab === "drive" && <span className="editor-hint">In Drive, set sharing to “Anyone with the link” so visitors can play it.</span>}
        </label>}
      {video
        ? <div className="editor-video">
          {activeLink ? <iframe src={activeLink.embed} title="Video preview" loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen /> : video.kind === "file" && <video src={preview(video.item)} controls muted preload="metadata" aria-label={`Preview of ${video.item.name}`} />}
          <p><b>{videoKindLabel[activeLink ? activeLink.kind : "upload"]}</b> plays on the listing page{video.kind === "file" ? ` · ${video.item.name}` : ""}.</p>
          <button type="button" className="quiet" onClick={() => { setVideo(null); setLinkDraft(""); }}>Remove video</button>
        </div>
        : <p className="editor-hint">{curated.video ? "No video attached here, so the page plays its built-in walkthrough. A link or upload here replaces it." : "No video attached."}</p>}
    </fieldset>

    <div className="editor-footer">
    {uploads.length > 0 && <ul className="editor-uploads" aria-live="polite">{uploads.map((entry) => <li key={entry.key}><span>{entry.progress === 100 ? `Saving ${entry.name}…` : `Uploading ${entry.name} · ${entry.progress}%`}</span><progress max={100} value={entry.progress} aria-label={`Upload progress for ${entry.name}`} /></li>)}</ul>}
    {notice && <p role="status" className="editor-notice">{notice}</p>}
    {error && <div role="alert" className="editor-error-box"><p>{error}</p>{details.length > 0 && <ul>{details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}</div>}
    <div className="editor-actions">
      <button disabled={!loaded || busy || uploads.length > 0}>{busy ? "Saving…" : listingId === null ? "Add listing" : "Save changes"}</button>
      {listingId !== null && <button type="button" className="quiet" onClick={onCancel}>Cancel</button>}
    </div>
    </div>
  </form>;
}
