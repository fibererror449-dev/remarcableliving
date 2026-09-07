import { mediaFiles } from "./media-manifest.generated";

/** True when the given public path (e.g. "/properties/x.jpg") exists in the repo. */
export function hasMedia(path: string): boolean {
  return mediaFiles.has(path);
}
