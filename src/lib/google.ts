import "server-only";

const id = () => (process.env.GOOGLE_CLIENT_ID || "").trim();
const secret = () => (process.env.GOOGLE_CLIENT_SECRET || "").trim();

export const googleConfigured = () => Boolean(id() && secret());
export const googleRedirectUri = () => `${(process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "")}/api/auth/google/callback`;

export function googleAuthorizeUrl(state: string) {
  const p = new URLSearchParams({
    client_id: id(),
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

export async function googleExchange(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: id(), client_secret: secret(), redirect_uri: googleRedirectUri(), grant_type: "authorization_code" }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  const { access_token } = (await res.json()) as { access_token: string };
  const me = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${access_token}` } });
  if (!me.ok) throw new Error(`Google profile lookup failed: ${await me.text()}`);
  return (await me.json()) as { sub: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
}
