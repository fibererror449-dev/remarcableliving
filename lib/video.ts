// Client-safe: the admin form, API validation and residence page share one reading of a video link.
export type VideoLink = { kind: "youtube" | "drive"; id: string; embed: string; href: string };

export const VIDEO_LINK_HELP = "Paste a YouTube link or a Google Drive share link.";

const youtubeHosts = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);
const youtubeId = /^[A-Za-z0-9_-]{11}$/;
const driveId = /^[A-Za-z0-9_-]{10,200}$/;

/** Recognises YouTube and Google Drive video links; anything else is null. */
export function parseVideoLink(value: string): VideoLink | null {
  let url: URL;
  try { url = new URL(value.trim()); } catch { return null; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);
  let id: string | null | undefined;
  if (host === "youtu.be") id = parts[0];
  else if (youtubeHosts.has(host)) id = parts[0] === "watch" ? url.searchParams.get("v") : ["shorts", "embed", "live", "v"].includes(parts[0]) ? parts[1] : null;
  if (id && youtubeId.test(id)) return { kind: "youtube", id, embed: `https://www.youtube-nocookie.com/embed/${id}?rel=0`, href: `https://www.youtube.com/watch?v=${id}` };
  if (host === "drive.google.com" || host === "docs.google.com") {
    const file = parts.indexOf("file");
    id = file >= 0 && parts[file + 1] === "d" ? parts[file + 2] : url.searchParams.get("id");
    if (id && driveId.test(id)) return { kind: "drive", id, embed: `https://drive.google.com/file/d/${id}/preview`, href: `https://drive.google.com/file/d/${id}/view` };
  }
  return null;
}

export const videoKindLabel = { youtube: "YouTube video", drive: "Google Drive video", upload: "Uploaded video" } as const;
