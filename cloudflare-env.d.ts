/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    MEDIA: R2Bucket;
    ADMIN_EMAILS?: string;
    IMPORTS_ENABLED?: string;
    SITE_ORIGIN?: string;
  }
}
