import { getUser } from "@/lib/auth";
import { parseAuthRequest, redirectWith } from "@/lib/authorize";
import { baseUrl, createCode } from "@/lib/oauth";

// Handles the Allow / Deny buttons on /oauth/authorize.
export async function POST(req: Request) {
  const form = await req.formData();
  const p = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  const parsed = await parseAuthRequest(p);
  if ("fatal" in parsed) return new Response(parsed.fatal, { status: 400 });
  if ("redirectError" in parsed)
    return Response.redirect(redirectWith(parsed.redirectUri, { error: parsed.redirectError, state: parsed.state }), 303);

  const user = await getUser();
  if (!user) return Response.redirect(new URL(`/oauth/authorize?${new URLSearchParams(p)}`, req.url), 303);

  const { req: a } = parsed;
  if (p.decision !== "allow")
    return Response.redirect(redirectWith(a.redirectUri, { error: "access_denied", state: a.state, iss: baseUrl() }), 303);

  const code = await createCode({ clientId: a.client.client_id, userId: user.id, redirectUri: a.redirectUri, codeChallenge: a.codeChallenge, resource: a.resource });
  return Response.redirect(redirectWith(a.redirectUri, { code, state: a.state, iss: baseUrl() }), 303);
}
