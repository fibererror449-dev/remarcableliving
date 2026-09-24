import type { ReactNode } from "react";
import BrandLogo from "../../components/BrandLogo";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { getAdminUser } from "../../../lib/admin";
import { agentJobs, fullAgentGuide } from "../../../lib/agent-guides";
import { siteOrigin } from "../../../lib/site-data";
import CopyButton from "../CopyButton";
import OpenHashTarget from "./OpenHashTarget";

export const dynamic = "force-dynamic";

type Guide = { id: string; title: string; body: ReactNode };

// Plain-language guides for the admin. Button names match the admin screens exactly.
function guides(site: string): Guide[] {
  return [
    { id: "guide-around", title: "Find your way around", body: <>
      <ul className="help-list">
        <li><b>Site admin</b>: your listings (“Inventory”), the listing form beside them, and “Images &amp; videos”, the media library.</li>
        <li><b>Review imports</b>: listings an AI assistant has prepared for you, plus “Agent access” and “Chat connections” for giving an assistant access.</li>
        <li><b>How-to</b>: this page.</li>
        <li><b>View website</b>: the public site, as visitors see it.</li>
      </ul>
    </> },
    { id: "guide-add", title: "Add a new listing", body: <>
      <ol className="help-steps">
        <li>On <b>Site admin</b>, click <b>+ New listing</b>. The form is headed “Add listing”.</li>
        <li>Fill in the details. The form will not save until these are filled: the name, District, Rent, Size, Station, Walk to station, Latitude, Longitude and Last verified.</li>
        <li>Leave “Availability” on “Verify first” until you have confirmed the unit is free.</li>
        <li>Add photos and a video if you have them (see the next guides).</li>
        <li>Click <b>Add listing</b>. When you see “Listing added.”, it is live. Click <b>View listing ↗</b> to check it.</li>
      </ol>
      <p className="help-note">Latitude and longitude: in Google Maps, right-click the building and click the two numbers at the top of the menu to copy them. The first number is the latitude, the second the longitude.</p>
      <p>If another listing already has the same name, the new one gets its own web address ending in “-2”.</p>
    </> },
    { id: "guide-edit", title: "Change a listing", body: <>
      <ol className="help-steps">
        <li>In “Inventory”, find the listing and click <b>Edit</b>. The form heading changes to “Edit” and the listing’s name.</li>
        <li>Change what you need.</li>
        <li>Click <b>Save changes</b> and wait for “Listing saved.”. The listing keeps its web address.</li>
      </ol>
      <p>To stop without saving, click <b>Cancel</b>.</p>
    </> },
    { id: "guide-photos", title: "Add photos", body: <>
      <ol className="help-steps">
        <li>Open the listing with <b>Edit</b>, or start a new one.</li>
        <li>Drag photos onto <b>Add photos</b>, or click it to choose files. JPG, PNG, WebP or GIF, up to 50 MB each.</li>
        <li>For each photo, write a short “Caption” (for example “Living room”), choose who took it under “Supplied by”, and use <b>↑</b> and <b>↓</b> to change the order. Put the best living-room photo first.</li>
        <li>Tick “Use as cover photo” on the photo you want on the listing card. If you don’t choose one, the first photo is the cover.</li>
        <li>Click <b>Save changes</b> (or <b>Add listing</b>).</li>
      </ol>
      <p className="help-note">Photos only appear on the website after you save the listing.</p>
      <p>If a photo won’t upload, it may be in HEIC format, which is common on iPhones. Save it as JPG and try again.</p>
    </> },
    { id: "guide-video", title: "Add a video", body: <>
      <p>A listing plays one video. In the “Video” section, choose one of three ways:</p>
      <ul className="help-list">
        <li><b>YouTube link</b>: paste the link from the video’s Share button.</li>
        <li><b>Google Drive link</b>: in Drive, click Share, set General access to “Anyone with the link”, then copy the link and paste it here.</li>
        <li><b>Upload a file</b>: MP4, MOV or WebM, up to 50 MB. For a longer tour, put it on YouTube or Google Drive and paste the link instead.</li>
      </ul>
      <p>When the preview appears, click <b>Save changes</b>. To take a video off, click <b>Remove video</b>, then save.</p>
    </> },
    { id: "guide-status", title: "Show or hide a listing", body: <>
      <p>Each listing in “Inventory” has a status menu. It saves as soon as you pick an option.</p>
      <ul className="help-list">
        <li><b>Available</b>: free to rent now.</li>
        <li><b>Viewing</b>: a viewing or hold is in progress.</li>
        <li><b>Verify</b>: shown on the website as “Confirm status” until you check it.</li>
        <li><b>Rented / close</b>: hides the listing from the home page and search lists. Anyone with its direct link can still open it, marked “Rented”.</li>
      </ul>
      <p>There is no delete button. Use <b>Rented / close</b> to take a listing down.</p>
    </> },
    { id: "guide-library", title: "Use the media library", body: <>
      <p>“Images &amp; videos” at the top of <b>Site admin</b> holds files you can reuse.</p>
      <ol className="help-steps">
        <li>Choose a file and click <b>Upload file</b>.</li>
        <li><b>Add to listing</b> puts the file on the listing open in the form below. Save the listing afterwards.</li>
        <li><b>Copy URL</b> copies the file’s web address.</li>
      </ol>
      <p className="help-note">Files in the library are public as soon as they upload, even before you add them to a listing. Photos added straight to a listing stay private until you save it.</p>
    </> },
    { id: "guide-publish", title: "Publish what an AI prepared", body: <>
      <p>Listings an AI assistant prepares wait as drafts. Nothing is public until you publish it.</p>
      <ol className="help-steps">
        <li>Click <b>Review imports</b>. Under “Drafts to review”, click <b>Review →</b> next to a draft.</li>
        <li>“Before publishing” on the right lists anything missing. Fill it in, check the photos and choose a cover photo.</li>
        <li>Click <b>Save revision</b>, then <b>Publish listing</b>. You get a link to the live listing.</li>
        <li>If the draft is wrong, click <b>Reject draft</b>. The website does not change.</li>
      </ol>
      <p>If it says the listing changed since this review, the live listing was edited after the draft was made. Reload the page and check “Changes from the live listing” so you don’t undo that edit. Then change what you need, click <b>Save revision</b> to make a fresh revision, and publish.</p>
    </> },
    { id: "guide-access", title: "Give an AI assistant access", body: <>
      <p>Both ways are on the <b>Review imports</b> page. An assistant can only prepare drafts; you still publish.</p>
      <h3>In a chat app (Claude or ChatGPT)</h3>
      <ol className="help-steps">
        <li>In the chat app, start adding a custom connector and copy the callback (redirect) address it asks you to allow. For Claude it is <code>https://claude.ai/api/mcp/auth_callback</code>.</li>
        <li>Under “Chat connections”, type a “Connection name”, paste the address into “Callback URLs” and click <b>Register connection</b>.</li>
        <li>Copy the “Client ID” and “Client secret” straight away. The secret is shown only once.</li>
        <li>Back in the chat app, add the connector with the server address <code>{site}/mcp</code>, the Client ID and the Client secret.</li>
        <li>The app opens a REMARCABLE LIVING page asking for access. Allow it while signed in as the admin.</li>
      </ol>
      <h3>With a token (Claude Code, scripts and other agents)</h3>
      <ol className="help-steps">
        <li>Under “Agent access”, type a “Credential name”, choose how long it lasts and click <b>Create credential</b>.</li>
        <li>Copy the token (it starts with <code>rli_</code>) straight away; it is shown only once. Give it to your assistant privately, never in a shared chat or document.</li>
        <li>Click <b>Revoke</b> when the job is done, or at once if the token leaks.</li>
      </ol>
      <p>Then copy the matching brief from “For AI agents” below and paste it into your assistant.</p>
    </> },
    { id: "guide-problems", title: "When something goes wrong", body: <dl className="help-faq">
      <dt>Photos don’t show on the website</dt><dd>Save the listing after uploading. Photos stay private until you do.</dd>
      <dt>The video doesn’t play</dt><dd>For Google Drive, set sharing to “Anyone with the link”. Only YouTube and Google Drive links work.</dd>
      <dt>A file won’t upload</dt><dd>Photos must be JPG, PNG, WebP or GIF, and videos MP4, MOV or WebM, up to 50 MB. Audio files can’t be attached.</dd>
      <dt>An assistant says “Agent imports are disabled”</dt><dd>AI connections are switched off on the site. See the notice at the top of this page.</dd>
      <dt>I lost a token or client secret</dt><dd>They are shown only once. Create a new one, then <b>Revoke</b> the old one.</dd>
      <dt>“Publish listing” is greyed out</dt><dd>Fill everything listed under “Before publishing”, and click <b>Save revision</b> first if you changed anything.</dd>
    </dl> },
  ];
}

export default async function HelpPage() {
  const user = await requireChatGPTUser("/admin/help");
  if (!(await getAdminUser())) return <main className="admin-page"><h1>Admin access required</h1><p>This account does not have access to manage this site.</p><a href="/signout-with-chatgpt?return_to=/admin/help">Sign in with the admin account</a></main>;
  const { env } = await import("cloudflare:workers");
  const config = env as unknown as Record<string, unknown>;
  const site = String(config.SITE_ORIGIN || siteOrigin).replace(/\/$/, "");
  const enabled = config.IMPORTS_ENABLED === "1";
  const forYou = guides(site);
  const jobs = agentJobs(site);
  return <main className="admin-page help-page">
    <header className="admin-header"><div><a className="brand" href="/" aria-label="REMARCABLE LIVING home"><BrandLogo /></a><h1>How-to</h1></div><div className="admin-account"><span>{user.displayName}</span><nav aria-label="Admin account"><a href="/admin">Site admin</a><a href="/admin/imports">Review imports</a><a href="/">View website</a><a href="/signout-with-chatgpt?return_to=/">Sign out</a></nav></div></header>
    <p className={`help-status${enabled ? " on" : ""}`}>{enabled
      ? <><b>AI connections are on.</b> Assistants can prepare drafts for you to review. Nothing goes live until you publish it.</>
      : <><b>AI connections are off.</b> The admin screens and the guides under “For you” work as normal, but assistants following the briefs under “For AI agents” will get “Agent imports are disabled”. Ask your developer to switch agent imports on (IMPORTS_ENABLED=1).</>}</p>
    <div className="help-layout">
      <nav className="help-rail" aria-label="How-to contents">
        <a className="help-rail-head" href="#for-you">For you</a>
        <ol>{forYou.map((guide) => <li key={guide.id}><a href={`#${guide.id}`}>{guide.title}</a></li>)}</ol>
        <a className="help-rail-head" href="#for-agents">For AI agents</a>
        <ol>{jobs.map((job) => <li key={job.id}><a href={`#agent-${job.id}`}>{job.title}</a></li>)}</ol>
      </nav>
      <div className="help-content">
        <section className="help-section" aria-labelledby="for-you">
          <h2 id="for-you">For you</h2>
          <p className="help-lede">Step-by-step guides for running the site. Click a question to open it.</p>
          {forYou.map((guide) => <details key={guide.id} id={guide.id} className="help-guide"><summary>{guide.title}</summary><div className="help-guide-body">{guide.body}</div></details>)}
        </section>
        <section className="help-section" aria-labelledby="for-agents">
          <div className="help-section-head"><h2 id="for-agents">For AI agents</h2><CopyButton target="agent-full-text" label="Copy the complete guide">Copy the complete guide</CopyButton></div>
          <p className="help-lede">Each box is a ready-made brief for an AI assistant. Click <b>Copy</b>, paste it into Claude, ChatGPT or another assistant, then add your files and say what you want done. Send any token separately and privately. The complete guide covers a whole import from source files, start to finish.</p>
          <details className="help-full"><summary>Show the complete guide</summary><pre id="agent-full-text" className="help-prompt">{fullAgentGuide(site)}</pre></details>
          {jobs.map((job) => <article key={job.id} id={`agent-${job.id}`} className="help-job" aria-labelledby={`agent-${job.id}-title`}>
            <div className="help-job-head"><div><h3 id={`agent-${job.id}-title`}>{job.title}</h3><p>Use this when: {job.when}</p></div><CopyButton target={`agent-${job.id}-text`} label={`Copy instructions: ${job.title}`} /></div>
            <pre id={`agent-${job.id}-text`} className="help-prompt">{job.text}</pre>
          </article>)}
        </section>
      </div>
    </div>
    <OpenHashTarget />
  </main>;
}
