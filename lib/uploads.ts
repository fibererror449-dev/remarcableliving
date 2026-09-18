export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MEDIA_TYPES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
};
export type UploadedMedia = { key: string; url: string; name: string; type: string; size: number; uploaded: string };
