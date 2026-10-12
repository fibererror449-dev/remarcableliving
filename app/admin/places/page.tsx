import { requireChatGPTUser } from "../../chatgpt-auth";
import { getAdminUser } from "../../../lib/admin";
import { loadDiscovery } from "../../../lib/discovery";
import PlaceEditor from "./PlaceEditor";

export const dynamic = "force-dynamic";
export default async function Page() {
  await requireChatGPTUser("/admin/places");
  if (!(await getAdminUser())) return <main className="admin-page"><h1>Admin access required</h1></main>;
  const { places, listings } = await loadDiscovery();
  return <main className="admin-page"><a href="/admin">← Site admin</a><h1>Places &amp; collections</h1><p>Descriptions belong to the place and appear above its residences. Create or change relationships using the neighbourhood, project and university fields in a listing.</p><PlaceEditor places={places} listings={listings} /></main>;
}
