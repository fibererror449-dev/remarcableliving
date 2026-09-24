"use client";
import { FormEvent, useEffect, useState } from "react";
import BrandLogo from "../components/BrandLogo";

type Attribution = "owner" | "agent" | "admin";
type Attachment = { id: string; caption?: string; attribution: Attribution };
type Payload = Record<string, unknown> & { reference: string; name: string; media?: Attachment[]; coverId?: string; provenance?: string };
type Draft = {
  id: string; revision: number; state: string; actor: string; created_at: number; namespace: string; reference: string;
  current: boolean; current_draft: string; payload: Payload; blockers: string[];
  attachments: { id: string; mime: string; name: string; size: number }[]; published: Record<string, unknown> | null;
};
type DraftSummary = { id: string; revision: number; state: string; created_at: number; namespace: string; reference: string; name: string };
type Credential = { id: string; owner: string; name: string; expires_at: number; revoked_at: number | null; expired?: boolean };
type CredentialList = { credentials: Credential[]; importsEnabled: boolean };
type Connection = { id: string; name: string; redirectUris: string[]; created_at: number; revoked_at: number | null };
type ConnectionList = { mcpUrl: string; clients: Connection[] };

const fields: { key: string; label: string; type?: "number" | "date" | "url"; step?: string; options?: [string, string][] }[] = [
  { key: "name", label: "Name" },
  { key: "district", label: "District" },
  { key: "rent", label: "Monthly rent (THB)", type: "number", step: "1" },
  { key: "bedrooms", label: "Bedrooms", type: "number", step: "1" },
  { key: "bathrooms", label: "Bathrooms", type: "number", step: "1" },
  { key: "sizeSqm", label: "Size (sq m)", type: "number", step: "0.1" },
  { key: "floor", label: "Floor" },
  { key: "stationType", label: "Station type", options: [["BTS", "BTS"], ["MRT", "MRT"]] },
  { key: "stationName", label: "Station name" },
  { key: "walkMinutes", label: "Walk to station (minutes)", type: "number", step: "1" },
  { key: "latitude", label: "Latitude", type: "number", step: "any" },
  { key: "longitude", label: "Longitude", type: "number", step: "any" },
  { key: "lastVerified", label: "Last verified", type: "date" },
  { key: "status", label: "Availability", options: [["available", "Available"], ["viewing", "Viewing"], ["verify", "Verify first"], ["rented", "Rented / close"]] },
  { key: "sourceUrl", label: "Original listing URL", type: "url" },
  { key: "videoUrl", label: "Video link (YouTube or Google Drive)", type: "url" },
  { key: "description", label: "Description" },
];
const labels: Record<string, string> = { ...Object.fromEntries(fields.map((field) => [field.key, field.label])), coverId: "Cover photo" };
const stateLabels: Record<string, string> = { pending: "Awaiting review", published: "Published", rejected: "Rejected", superseded: "Replaced by a newer revision" };
const suppliers: [Attribution, string][] = [["owner", "Owner"], ["agent", "Agent"], ["admin", "REMARCABLE LIVING"]];

class RequestError extends Error {
  constructor(public status: number, message: string, public details?: unknown) { super(message); }
}
async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, init.body ? { ...init, headers: { "content-type": "application/json" } } : init);
  const data = await response.json().catch(() => ({})) as T & { error?: string; details?: unknown };
  if (!response.ok) throw new RequestError(response.status, data.error || "Request failed. Please retry.", data.details);
  return data;
}
function problem(error: unknown) {
  if (!(error instanceof RequestError)) return "Connection lost. Your changes are still on this page; please retry.";
  if (error.status === 409) return `${error.message}. Reload to review the newest revision.`;
  const details = Array.isArray(error.details) ? error.details.map((detail) => labels[detail] ?? detail).join(", ") : "";
  return details ? `${error.message}: ${details}.` : error.message;
}
const withExpiry = (credentials: Credential[]) => credentials.map((credential) => ({ ...credential, expired: credential.expires_at <= Date.now() }));
const day = (time: number) => new Date(time).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function ImportHeader({ displayName, title, crumb }: { displayName: string; title: string; crumb?: boolean }) {
  return <header className="admin-header"><div><a className="brand" href="/" aria-label="REMARCABLE LIVING home"><BrandLogo /></a>{crumb && <a className="admin-crumb" href="/admin/imports">← All listing imports</a>}<h1>{title}</h1></div><div className="admin-account"><span>{displayName}</span><nav aria-label="Admin account"><a href="/admin">Site admin</a><a href="/">View website</a><a href="/signout-with-chatgpt?return_to=/">Sign out</a></nav></div></header>;
}

export function ImportQueue({ displayName }: { displayName: string }) {
  const [drafts, setDrafts] = useState<DraftSummary[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api<{ drafts: DraftSummary[] }>("/api/admin/imports/drafts")
      .then((data) => { if (active) setDrafts(data.drafts); })
      .catch((failure) => { if (active) setError(problem(failure)); });
    return () => { active = false; };
  }, []);
  return <main className="admin-page">
    <ImportHeader displayName={displayName} title="Listing imports" />
    <section className="import-layout">
      <div className="import-panel import-drafts" aria-labelledby="drafts-heading">
        <h2 id="drafts-heading">Drafts to review</h2>
        <p>Agents submit what they can confirm from the source files. Nothing here is public until you publish it.</p>
        {error && <p role="alert" className="import-error">{error}</p>}
        {!drafts && !error && <p role="status">Loading drafts…</p>}
        {drafts?.length === 0 && <p>No imported drafts yet. Issue an agent credential, then run the import helper or connect a chat client.</p>}
        {drafts?.map((draft) => <article key={draft.id}>
          <div><b>{draft.name}</b><span>{draft.namespace} · {draft.reference} · revision {draft.revision} · {day(draft.created_at)}</span></div>
          <span className={`import-state ${draft.state}`}>{stateLabels[draft.state] ?? draft.state}</span>
          <a href={`/admin/imports/${draft.id}`} aria-label={`Review ${draft.name}`}>Review →</a>
        </article>)}
      </div>
      <div className="import-side"><AgentAccess /><ChatConnections /></div>
    </section>
  </main>;
}

function AgentAccess() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [issued, setIssued] = useState<{ name: string; token: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function show(data: CredentialList) { setCredentials(withExpiry(data.credentials)); setEnabled(data.importsEnabled); }
  async function load() { show(await api<CredentialList>("/api/admin/imports/credentials")); }
  useEffect(() => {
    let active = true;
    api<CredentialList>("/api/admin/imports/credentials")
      .then((data) => { if (active) show(data); })
      .catch((failure) => { if (active) setError(problem(failure)); });
    return () => { active = false; };
  }, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    setBusy(true); setError("");
    try {
      const credential = await api<{ name: string; token: string }>("/api/admin/imports/credentials", { method: "POST", body: JSON.stringify({ name: String(data.get("name")), expiresInDays: Number(data.get("expiresInDays")) }) });
      setIssued(credential); form.reset(); await load();
    } catch (failure) { setError(problem(failure)); } finally { setBusy(false); }
  }
  async function revoke(credential: Credential) {
    setBusy(true); setError("");
    try { await api(`/api/admin/imports/credentials/${credential.id}`, { method: "DELETE" }); await load(); }
    catch (failure) { setError(problem(failure)); } finally { setBusy(false); }
  }
  return <div className="import-panel" aria-labelledby="access-heading">
    <h2 id="access-heading">Agent access</h2>
    {enabled !== null && <p className={`import-switch ${enabled ? "on" : ""}`}>{enabled ? "Agent imports are switched on." : "Agent imports are switched off. Credentials can be prepared now; agents are refused until IMPORTS_ENABLED is set to 1."}</p>}
    <form className="import-inline-form" onSubmit={create}>
      <label>Credential name<input required name="name" maxLength={120} placeholder="e.g. Codex Drive import" /></label>
      <label>Expires after<select name="expiresInDays" defaultValue="7"><option value="1">1 day</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select></label>
      <button disabled={busy}>Create credential</button>
    </form>
    {issued && <div className="import-token" role="status"><p>Copy the token for <b>{issued.name}</b> now. It is shown only once.</p><input aria-label="New credential token" readOnly value={issued.token} onFocus={(event) => event.target.select()} /></div>}
    {error && <p role="alert" className="import-error">{error}</p>}
    <ul className="import-credentials">{credentials.map((credential) => {
      const status = credential.revoked_at ? "Revoked" : credential.expired ? "Expired" : `Expires ${day(credential.expires_at)}`;
      return <li key={credential.id}><div><b>{credential.name}</b><span>{credential.owner} · {status}</span></div>{!credential.revoked_at && !credential.expired && <button type="button" disabled={busy} onClick={() => revoke(credential)} aria-label={`Revoke ${credential.name}`}>Revoke</button>}</li>;
    })}</ul>
  </div>;
}

function ChatConnections() {
  const [list, setList] = useState<ConnectionList | null>(null);
  const [created, setCreated] = useState<{ id: string; name: string; clientSecret: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() { setList(await api<ConnectionList>("/api/admin/imports/oauth-clients")); }
  useEffect(() => {
    let active = true;
    api<ConnectionList>("/api/admin/imports/oauth-clients")
      .then((data) => { if (active) setList(data); })
      .catch((failure) => { if (active) setError(problem(failure)); });
    return () => { active = false; };
  }, []);
  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const redirectUris = String(data.get("redirectUris")).split(/\s+/).filter(Boolean);
    setBusy(true); setError("");
    try { setCreated(await api("/api/admin/imports/oauth-clients", { method: "POST", body: JSON.stringify({ name: String(data.get("name")), redirectUris }) })); form.reset(); await load(); }
    catch (failure) { setError(problem(failure)); } finally { setBusy(false); }
  }
  async function revoke(connection: Connection) {
    setBusy(true); setError("");
    try { await api(`/api/admin/imports/oauth-clients/${connection.id}`, { method: "DELETE" }); await load(); }
    catch (failure) { setError(problem(failure)); } finally { setBusy(false); }
  }
  return <div className="import-panel" aria-labelledby="connections-heading">
    <h2 id="connections-heading">Chat connections</h2>
    <p>Connect Claude or ChatGPT as a custom connector. Register the exact callback URL the chat client shows, then give it the server URL, client ID and, if it asks, the client secret.</p>
    {list && <p className="import-server">Server URL <code>{list.mcpUrl}</code></p>}
    <form className="import-inline-form" onSubmit={register}>
      <label className="wide">Connection name<input required name="name" maxLength={120} placeholder="e.g. Claude" /></label>
      <label className="wide">Callback URLs<textarea required name="redirectUris" rows={2} placeholder="One per line, e.g. https://claude.ai/api/mcp/auth_callback" /></label>
      <button disabled={busy}>Register connection</button>
    </form>
    {created && <div className="import-token" role="status"><p>Copy the details for <b>{created.name}</b> now. The secret is shown only once.</p>
      <label>Client ID<input readOnly value={created.id} onFocus={(event) => event.target.select()} /></label>
      <label>Client secret<input readOnly value={created.clientSecret} onFocus={(event) => event.target.select()} /></label></div>}
    {error && <p role="alert" className="import-error">{error}</p>}
    <ul className="import-credentials">{list?.clients.map((connection) => <li key={connection.id}>
      <div><b>{connection.name}</b><span>{connection.redirectUris.join(" · ")}</span><span>{connection.revoked_at ? "Revoked" : `Added ${day(connection.created_at)}`}</span></div>
      {!connection.revoked_at && <button type="button" disabled={busy} onClick={() => revoke(connection)} aria-label={`Revoke ${connection.name}`}>Revoke</button>}
    </li>)}</ul>
  </div>;
}

function formValues(payload: Payload) {
  return Object.fromEntries(fields.map((field) => [field.key, payload[field.key] === undefined ? "" : String(payload[field.key])]));
}

export function DraftReview({ id, displayName }: { id: string; displayName: string }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [media, setMedia] = useState<Attachment[]>([]);
  const [coverId, setCoverId] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [error, setError] = useState("");
  function show(next: Draft) {
    setDraft(next); setValues(formValues(next.payload)); setMedia(next.payload.media ?? []); setCoverId(next.payload.coverId ?? ""); setDirty(false);
    if (next.id !== window.location.pathname.split("/").at(-1)) window.history.replaceState(null, "", `/admin/imports/${next.id}`);
  }
  useEffect(() => {
    let active = true;
    api<Draft>(`/api/admin/imports/drafts/${encodeURIComponent(id)}`)
      .then((data) => { if (active) { setDraft(data); setValues(formValues(data.payload)); setMedia(data.payload.media ?? []); setCoverId(data.payload.coverId ?? ""); } })
      .catch((failure) => { if (active) setError(failure instanceof RequestError && failure.status === 404 ? "This draft does not exist." : problem(failure)); });
    return () => { active = false; };
  }, [id]);
  function edit(key: string, value: string) { setValues((previous) => ({ ...previous, [key]: value })); setDirty(true); }
  function editMedia(next: Attachment[]) { setMedia(next); setDirty(true); if (!next.some((item) => item.id === coverId)) setCoverId(""); }
  function move(index: number, offset: number) { const next = [...media]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; editMedia(next); }
  function payload(current: Draft): Payload {
    const next: Payload = { reference: current.payload.reference, name: values.name.trim() };
    for (const field of fields) {
      const value = values[field.key]?.trim();
      if (field.key !== "name" && value) next[field.key] = field.type === "number" ? Number(value) : value;
    }
    if (current.payload.provenance !== undefined) next.provenance = current.payload.provenance;
    if (media.length) next.media = media.map(({ id: mediaId, caption, attribution }) => caption?.trim() ? { id: mediaId, caption: caption.trim(), attribution } : { id: mediaId, attribution });
    if (coverId) next.coverId = coverId;
    return next;
  }
  async function act(action: () => Promise<void>) {
    setBusy(true); setError(""); setNotice(""); setLiveUrl("");
    try { await action(); } catch (failure) { setError(problem(failure)); } finally { setBusy(false); }
  }
  const save = (event: FormEvent) => { event.preventDefault(); if (draft) act(async () => { show(await api<Draft>(`/api/admin/imports/drafts/${draft.id}`, { method: "PATCH", body: JSON.stringify(payload(draft)) })); setNotice("Revision saved."); }); };
  const publish = () => draft && act(async () => { const live = await api<{ url: string }>(`/api/admin/imports/drafts/${draft.id}/publish`, { method: "POST", body: "{}" }); show(await api<Draft>(`/api/admin/imports/drafts/${draft.id}`)); setLiveUrl(live.url); });
  const reject = () => draft && act(async () => { await api(`/api/admin/imports/drafts/${draft.id}/reject`, { method: "POST", body: "{}" }); show(await api<Draft>(`/api/admin/imports/drafts/${draft.id}`)); setNotice("Draft rejected."); });

  if (!draft) return <main className="admin-page"><ImportHeader displayName={displayName} title="Review import" crumb />{error ? <p role="alert" className="import-error">{error}</p> : <p role="status">Loading draft…</p>}</main>;
  const open = draft.current && draft.state === "pending";
  const changes = draft.published ? fields.filter((field) => String(draft.published?.[field.key] ?? "") !== String(draft.payload[field.key] ?? "")) : [];
  return <main className="admin-page">
    <ImportHeader displayName={displayName} title={draft.payload.name} crumb />
    {notice && <p role="status" className="admin-message">{notice}</p>}
    {liveUrl && <p role="status" className="admin-message">Published. <a href={liveUrl}>View the live listing ↗</a></p>}
    {error && <p role="alert" className="admin-message import-error">{error}</p>}
    {!draft.current && <p className="admin-message">A newer revision of this unit exists. <a href={`/admin/imports/${draft.current_draft}`}>Review the newest revision →</a></p>}
    <form className="import-layout" onSubmit={save}>
      <div>
        <fieldset className="import-panel draft-fields" disabled={!open || busy}>
          <legend>Listing facts</legend>
          <p className="wide">Leave a fact blank when the source does not confirm it. Blank facts stay blank; they are never guessed.</p>
          {fields.map((field) => {
            const missing = draft.blockers.includes(field.key);
            const control = field.options
              ? <select value={values[field.key] ?? ""} onChange={(event) => edit(field.key, event.target.value)} aria-invalid={missing || undefined}><option value="">Not confirmed</option>{field.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              : field.key === "description"
                ? <textarea value={values[field.key] ?? ""} onChange={(event) => edit(field.key, event.target.value)} />
                : <input type={field.type ?? "text"} step={field.step} required={field.key === "name"} value={values[field.key] ?? ""} onChange={(event) => edit(field.key, event.target.value)} aria-invalid={missing || undefined} />;
            return <label key={field.key} className={["description", "sourceUrl", "videoUrl"].includes(field.key) ? "wide" : undefined}>{field.label}{control}</label>;
          })}
        </fieldset>
        <fieldset className="import-panel draft-media" disabled={!open || busy}>
          <legend>Photos &amp; videos</legend>
          {media.length === 0 && <p>No media attached. A real photo of this unit is required as the cover before publishing.</p>}
          <ol>{media.map((item, index) => {
            const info = draft.attachments.find((attachment) => attachment.id === item.id);
            const name = info?.name ?? `item ${index + 1}`;
            const src = `/api/admin/imports/media/${item.id}`;
            return <li key={item.id}>
              <div className="draft-media-preview">{!info ? <p>File missing</p> : info.mime.startsWith("video/") ? <video src={src} controls muted preload="metadata" aria-label={name} /> : <img src={src} alt={item.caption || name} loading="lazy" />}</div>
              <div className="draft-media-fields">
                <label>Caption for {name}<input value={item.caption ?? ""} maxLength={500} onChange={(event) => editMedia(media.map((entry, position) => position === index ? { ...entry, caption: event.target.value } : entry))} /></label>
                <label>Supplied by<select value={item.attribution} onChange={(event) => editMedia(media.map((entry, position) => position === index ? { ...entry, attribution: event.target.value as Attribution } : entry))}>{suppliers.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                {info?.mime.startsWith("image/") && <label className="draft-cover"><input type="radio" name="cover" checked={coverId === item.id} onChange={() => { setCoverId(item.id); setDirty(true); }} />Use as cover photo</label>}
                <div className="draft-media-actions">
                  <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${name} earlier`}>↑ Earlier</button>
                  <button type="button" disabled={index === media.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${name} later`}>↓ Later</button>
                  <button type="button" onClick={() => editMedia(media.filter((_, position) => position !== index))} aria-label={`Remove ${name}`}>Remove</button>
                </div>
              </div>
            </li>;
          })}</ol>
        </fieldset>
      </div>
      <aside className="import-panel draft-summary" aria-label="Review summary">
        <p className={`import-state ${draft.state}`}>{stateLabels[draft.state] ?? draft.state}</p>
        <dl>
          <div><dt>Source</dt><dd>{draft.namespace} · {draft.reference}</dd></div>
          <div><dt>Revision</dt><dd>{draft.revision} · {day(draft.created_at)}</dd></div>
          <div><dt>Submitted by</dt><dd>{draft.actor.startsWith("admin:") ? draft.actor.slice(6) : "Agent credential"}</dd></div>
        </dl>
        <h2>Before publishing</h2>
        {draft.blockers.length ? <ul className="draft-blockers">{draft.blockers.map((blocker) => <li key={blocker}>{labels[blocker] ? `Add ${labels[blocker].charAt(0).toLowerCase()}${labels[blocker].slice(1)}` : blocker}</li>)}</ul> : <p>All publication requirements are met.</p>}
        {dirty && <p className="draft-unsaved">Save this revision before publishing.</p>}
        <div className="import-actions">
          <button disabled={!open || busy || !dirty}>Save revision</button>
          <button type="button" className="gold" disabled={!open || busy || dirty || draft.blockers.length > 0} onClick={publish}>Publish listing</button>
          <button type="button" className="quiet" disabled={!open || busy} onClick={reject}>Reject draft</button>
        </div>
        {draft.published && <>
          <h2>Changes from the live listing</h2>
          {changes.length ? <table className="draft-diff"><thead><tr><th scope="col">Fact</th><th scope="col">Live</th><th scope="col">This revision</th></tr></thead><tbody>{changes.map((field) => <tr key={field.key}><th scope="row">{field.label}</th><td>{String(draft.published?.[field.key] ?? "—")}</td><td>{String(draft.payload[field.key] ?? "—")}</td></tr>)}</tbody></table> : <p>The facts match the live listing.</p>}
          <p><a href={`/residences/${draft.published.slug}`}>View the live listing ↗</a></p>
        </>}
        {draft.payload.provenance && <><h2>Private source notes</h2><p className="draft-private">{draft.payload.provenance}</p><p className="draft-hint">Never shown on the public site.</p></>}
      </aside>
    </form>
  </main>;
}
