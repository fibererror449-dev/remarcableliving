// Client-safe listing data and filter helpers. This module must never import
// "cloudflare:workers"; client components import from here, not lib/listings.ts.

export type ListingStatus = "available" | "viewing" | "rented" | "verify";
export type Listing = {
  id: number; slug: string; name: string; district: string; rent: number;
  bedrooms: number; bathrooms: number; sizeSqm: number; floor: string;
  stationType: string; stationName: string; walkMinutes: number;
  latitude: number; longitude: number; image: string; status: ListingStatus;
  sourceUrl: string; lastVerified: string; description: string;
};

export type PublicListing = Pick<Listing, "id" | "slug" | "name" | "district" | "rent" | "image" | "bedrooms" | "bathrooms" | "sizeSqm" | "status" | "stationType" | "stationName" | "walkMinutes">;

export function toPublicListing(listing: Listing): PublicListing {
  const { id, slug, name, district, rent, image, bedrooms, bathrooms, sizeSqm, status, stationType, stationName, walkMinutes } = listing;
  return { id, slug, name, district, rent, image, bedrooms, bathrooms, sizeSqm, status, stationType, stationName, walkMinutes };
}

export const fallbackListings: Listing[] = [
  { id: 8, slug: "baan-klang-krung-siam-2br", name: "Baan Klang Krung Siam · 2 Bedrooms", district: "Ratchathewi", rent: 30000, bedrooms: 2, bathrooms: 2, sizeSqm: 74, floor: "21", stationType: "BTS", stationName: "Ratchathewi", walkMinutes: 3, latitude: 13.751667, longitude: 100.5325, image: "/properties/baan-klang-krung-siam.jpg", status: "available", sourceUrl: "", lastVerified: "2026-08-21", description: "A furnished 74 sq m two-bedroom, two-bathroom home on the 21st floor, with an open living and dining area, a full kitchen, broad city windows, and BTS Ratchathewi close by." },
  { id: 7, slug: "centurion-park-ari-soi-5-1br", name: "Centurion Park · 1 Bedroom", district: "Ari", rent: 25000, bedrooms: 1, bathrooms: 1, sizeSqm: 62, floor: "—", stationType: "BTS", stationName: "Ari", walkMinutes: 8, latitude: 13.7827372, longitude: 100.5416299, image: "/properties/centurion-park-ari.jpg", status: "available", sourceUrl: "", lastVerified: "2026-08-20", description: "Fully renovated 62 sq m one-bedroom home on Ari Soi 5, with a separate sleeping area, generous work-from-home space, a full kitchen, and a private balcony." },
  { id: 1, slug: "centric-ari-station-1br", name: "Centric Ari Station · 1 Bedroom", district: "Ari", rent: 17000, bedrooms: 1, bathrooms: 1, sizeSqm: 28, floor: "17", stationType: "BTS", stationName: "Ari", walkMinutes: 3, latitude: 13.7797, longitude: 100.5447, image: "/properties/centric-ari-station/06-living-room-rug-edited.png", status: "available", sourceUrl: "https://propertyhub.in.th/en/condo-for-rent/bts-ari/price-not-more-than-20-thousand-thb", lastVerified: "2026-08-13", description: "Furnished one-bedroom option close to BTS Ari, cafés, offices, and La Villa." },
  { id: 2, slug: "noble-around-ari-1br", name: "Noble Around Ari · 1 Bedroom", district: "Ari", rent: 20000, bedrooms: 1, bathrooms: 1, sizeSqm: 26.58, floor: "High floor", stationType: "BTS", stationName: "Ari", walkMinutes: 2, latitude: 13.7799, longitude: 100.5444, image: "/bangkok/skyline.jpg", status: "verify", sourceUrl: "https://propertyhub.in.th/en/listings/condo-for-rent-noble-around-ari-new-condo-high-rise-good-location-bts-ari-220-m--cca00ac7---4235431", lastVerified: "2026-08-13", description: "Compact city-view home near BTS Ari with full furniture and building facilities." },
  { id: 3, slug: "thru-thonglor-1br", name: "Thru Thonglor · 1 Bedroom", district: "Thonglor", rent: 23000, bedrooms: 1, bathrooms: 1, sizeSqm: 37, floor: "16", stationType: "BTS", stationName: "Thong Lo", walkMinutes: 18, latitude: 13.7382, longitude: 100.5838, image: "/bangkok/night-city.jpg", status: "verify", sourceUrl: "https://propertyhub.in.th/en/condo-for-rent/project-thru-thonglor", lastVerified: "2026-08-13", description: "Larger one-bedroom layout in the Thonglor corridor with easy access to cafés and nightlife." },
  { id: 5, slug: "supalai-veranda-rama9-1br", name: "Supalai Veranda Rama 9 · 1 Bedroom", district: "Rama 9", rent: 17000, bedrooms: 1, bathrooms: 1, sizeSqm: 42, floor: "28", stationType: "MRT", stationName: "Phra Ram 9", walkMinutes: 14, latitude: 13.7566, longitude: 100.5778, image: "/bangkok/bang-wa.jpg", status: "available", sourceUrl: "https://propertyhub.in.th/en/condo-for-rent/project-supalai-veranda-rama-9/2", lastVerified: "2026-08-13", description: "High-floor one-bedroom residence with practical space near the Rama 9 business district." },
  { id: 6, slug: "belle-grand-rama9-1br", name: "Belle Grand Rama 9 · 1 Bedroom", district: "Rama 9", rent: 20000, bedrooms: 1, bathrooms: 1, sizeSqm: 42, floor: "22", stationType: "MRT", stationName: "Phra Ram 9", walkMinutes: 8, latitude: 13.7561, longitude: 100.5668, image: "/bangkok/night-city.jpg", status: "verify", sourceUrl: "https://propertyhub.in.th/en/condo-for-rent/the-ninth-tower", lastVerified: "2026-08-12", description: "Central Rama 9 option with generous one-bedroom space and convenient MRT access." },
];

export function statusLabel(status: string) {
  return status === "available" ? "Available" : status === "viewing" ? "Viewing" : "Confirm status";
}

// Filters shared by the home collection, /residences and /neighbourhoods.
export const AREA_ALL = "All Bangkok areas";
export const BUDGET_ANY = "Any budget";
export const areaOptions = [AREA_ALL, "Ratchathewi", "Thonglor", "Phrom Phong", "Sathorn", "Ari", "Rama 9", "On Nut"] as const;
export const budgetOptions: { label: string; param: string; test: (rent: number) => boolean }[] = [
  { label: BUDGET_ANY, param: "", test: () => true },
  { label: "Under ฿20,000", param: "under-20k", test: (rent) => rent < 20000 },
  { label: "฿20,000–฿25,000", param: "20k-25k", test: (rent) => rent >= 20000 && rent <= 25000 },
  { label: "฿25,000+", param: "25k-plus", test: (rent) => rent > 25000 },
];

export function filterListings<T extends Pick<PublicListing, "district" | "rent">>(listings: T[], filters: { area: string; budget: string }): T[] {
  const budget = budgetOptions.find((option) => option.label === filters.budget) ?? budgetOptions[0];
  return listings.filter((listing) => (filters.area === AREA_ALL || listing.district === filters.area) && budget.test(listing.rent));
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parseArea(value: string | string[] | undefined): string {
  const candidate = first(value);
  return (areaOptions as readonly string[]).includes(candidate) ? candidate : AREA_ALL;
}

export function parseBudget(value: string | string[] | undefined): string {
  const candidate = first(value);
  return budgetOptions.find((option) => option.param && option.param === candidate)?.label ?? BUDGET_ANY;
}

export function toResidencesHref(filters: { area?: string; budget?: string }): string {
  const params = new URLSearchParams();
  if (filters.area && filters.area !== AREA_ALL) params.set("area", filters.area);
  const budget = budgetOptions.find((option) => option.label === filters.budget);
  if (budget?.param) params.set("budget", budget.param);
  const query = params.toString();
  return query ? `/residences?${query}` : "/residences";
}
