import { requireChatGPTUser } from "../../chatgpt-auth";
import { getAdminUser } from "../../../lib/admin";
import { ImportQueue } from "../ImportReview";

export const dynamic = "force-dynamic";

export default async function ImportsPage() {
  const user = await requireChatGPTUser("/admin/imports");
  if (!(await getAdminUser())) return <main className="admin-page"><h1>Admin access required</h1><p>This account does not have access to manage this site.</p><a href="/signout-with-chatgpt?return_to=/admin/imports">Sign in with the admin account</a></main>;
  return <ImportQueue displayName={user.displayName} />;
}
