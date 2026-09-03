import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureListings, listListings } from "../../../lib/listings";

export async function GET(request: Request) {
  const includeClosed = new URL(request.url).searchParams.get("admin") === "1";
  if (includeClosed && !(await getChatGPTUser())) return Response.json({ error: "Sign in required" }, { status: 401 });
  return Response.json({ listings: await listListings(includeClosed) });
}

export async function POST(request: Request) {
  if (!(await getChatGPTUser())) return Response.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const required = ["name", "district", "rent", "sizeSqm", "stationType", "stationName", "walkMinutes", "latitude", "longitude", "lastVerified"];
  if (required.some((key) => body[key] === undefined || body[key] === "")) return Response.json({ error: "Complete all required fields" }, { status: 400 });
  const slug = String(body.slug || body.name).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  await ensureListings();
  const result = await env.DB.prepare(`INSERT INTO listings (slug,name,district,rent,bedrooms,bathrooms,size_sqm,floor,station_type,station_name,walk_minutes,latitude,longitude,image,status,source_url,last_verified,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id`).bind(slug, String(body.name), String(body.district), Number(body.rent), Number(body.bedrooms || 1), Number(body.bathrooms || 1), Number(body.sizeSqm), String(body.floor || "—"), String(body.stationType), String(body.stationName), Number(body.walkMinutes), Number(body.latitude), Number(body.longitude), String(body.image || "/bangkok/skyline.jpg"), String(body.status || "verify"), String(body.sourceUrl || ""), String(body.lastVerified), String(body.description || "")).first();
  return Response.json({ id: result?.id, slug }, { status: 201 });
}
