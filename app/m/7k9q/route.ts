import { businessCard } from "../../../lib/business-card";

export function GET(request: Request) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL(businessCard.path, request.url).href,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
