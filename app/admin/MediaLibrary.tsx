"use client";
import { useEffect, useRef, useState } from "react";
import { MAX_UPLOAD_BYTES, MEDIA_TYPES, type UploadedMedia } from "../../lib/uploads";

export default function MediaLibrary({ onChooseImage }: { onChooseImage: (url: string) => void }) {
  const [items, setItems] = useState<UploadedMedia[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const upload = useRef<XMLHttpRequest | null>(null);

  async function load(next?: string) {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/media${next ? `?cursor=${encodeURIComponent(next)}` : ""}`);
      const data = await response.json() as { items: UploadedMedia[]; cursor: string | null; error?: string };
      if (!response.ok) throw new Error(data.error || "Could not load media.");
      setItems((previous) => next ? [...previous, ...data.items] : data.items);
      setCursor(data.cursor);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not load media."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    fetch("/api/media").then(async (response) => {
      const data = await response.json() as { items: UploadedMedia[]; cursor: string | null; error?: string };
      if (!response.ok) throw new Error(data.error || "Could not load media.");
      if (active) { setItems(data.items); setCursor(data.cursor); }
    }).catch((error) => { if (active) setError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; upload.current?.abort(); };
  }, []);

  function uploadFile() {
    const file = input.current?.files?.[0];
    if (!file) { setError("Choose an image or video first."); return; }
    if (!MEDIA_TYPES[file.type]) { setError("Choose a JPG, PNG, WebP, GIF, MP4, WebM or MOV file."); return; }
    if (!file.size || file.size > MAX_UPLOAD_BYTES) { setError("Choose a non-empty file up to 50 MB."); return; }
    setError(""); setNotice(""); setProgress(0);
    const xhr = new XMLHttpRequest(); upload.current = xhr;
    xhr.open("POST", "/api/media");
    xhr.setRequestHeader("content-type", file.type);
    xhr.setRequestHeader("x-file-name", encodeURIComponent(file.name));
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => {
      setProgress(null);
      let data;
      try { data = JSON.parse(xhr.responseText); } catch { setError("Upload failed. Please retry."); return; }
      if (xhr.status !== 201) { setError(data.error || "Upload failed. Please retry."); return; }
      setItems((previous) => [data.item, ...previous]);
      setNotice(`${file.name} uploaded.`);
      if (input.current) input.current.value = "";
    };
    xhr.onerror = () => { setProgress(null); setError("Connection lost. Your selected file is ready to retry."); };
    xhr.onabort = () => { setProgress(null); };
    xhr.send(file);
  }
  async function copy(item: UploadedMedia) {
    try { await navigator.clipboard.writeText(new URL(item.url, window.location.origin).href); setNotice("Media URL copied."); }
    catch { setError("Could not copy. Select and copy the URL shown below the preview."); }
  }

  return <section className="media-library" aria-labelledby="media-heading">
    <h2 id="media-heading">Images &amp; videos</h2>
    <p>Upload property photos and tours. Use an image in a new listing, or copy a media URL for placement on the site.</p>
    <div className="media-upload"><label htmlFor="media-file">Choose a file <span>JPG, PNG, WebP, GIF, MP4, WebM or MOV · up to 50 MB</span></label>
      <input ref={input} id="media-file" type="file" accept={Object.keys(MEDIA_TYPES).join(",")} disabled={progress !== null} />
      <button type="button" onClick={uploadFile} disabled={progress !== null}>{progress === null ? "Upload file" : progress === 100 ? "Saving…" : `Uploading ${progress}%`}</button>
      {progress !== null && <progress aria-label="Upload progress" max={100} value={progress} />}
    </div>
    {error && <p role="alert" className="media-error">{error} <button type="button" onClick={() => load()}>Reload library</button></p>}
    {notice && <p role="status">{notice}</p>}
    {loading && <p role="status">Loading media…</p>}
    {!loading && !error && items.length === 0 && <p>No uploads yet. Add your first photo or video above.</p>}
    <div className="media-grid">{items.map((item) => <article key={item.key}>
      {item.type.startsWith("video/") ? <video src={item.url} controls muted preload="metadata" aria-label={item.name} /> : <img src={item.url} alt={item.name} loading="lazy" />}
      <h3>{item.name}</h3><p>{(item.size / 1024 / 1024).toFixed(1)} MB · {item.type.startsWith("video/") ? "Video" : "Image"}</p>
      <input aria-label={`URL for ${item.name}`} readOnly value={item.url} onFocus={(event) => event.target.select()} />
      <div><button type="button" onClick={() => copy(item)}>Copy URL</button>{item.type.startsWith("image/") && <button type="button" onClick={() => { onChooseImage(item.url); setNotice("Image selected in the new listing form."); }}>Use for new listing</button>}</div>
    </article>)}</div>
    {cursor && <button type="button" disabled={loading} onClick={() => load(cursor)}>Load more</button>}
  </section>;
}
