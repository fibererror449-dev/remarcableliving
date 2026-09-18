import { getChatGPTUser } from "../app/chatgpt-auth";

/** Fail closed unless the signed-in account is explicitly allowed by the owner. */
export async function getAdminUser() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const { env } = await import("cloudflare:workers");
  const allowed = String((env as unknown as Record<string, unknown>).ADMIN_EMAILS ?? "")
    .split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(user.email.trim().toLowerCase()) ? user : null;
}

export function isSameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}
