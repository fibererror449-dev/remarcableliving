import { requireChatGPTUser } from "../../../chatgpt-auth";
import { getAdminUser } from "../../../../lib/admin";
import { DraftReview } from "../../ImportReview";

export const dynamic = "force-dynamic";

export default async function DraftReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const returnTo = `/admin/imports/${encodeURIComponent(id)}`;
  const user = await requireChatGPTUser(returnTo);
  if (!(await getAdminUser())) return <main className="admin-page"><h1>Admin access required</h1><p>This account does not have access to manage this site.</p><a href={`/signout-with-chatgpt?return_to=${encodeURIComponent(returnTo)}`}>Sign in with the admin account</a></main>;
  return <DraftReview id={id} displayName={user.displayName} />;
}
