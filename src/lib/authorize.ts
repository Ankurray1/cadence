import "server-only";
import { getClient, type Client } from "./oauth";

export type AuthRequest = {
  client: Client;
  redirectUri: string;
  state: string | null;
  codeChallenge: string;
  resource: string | null;
};

/** Validate an /oauth/authorize request. Returns either a fatal error (show page) or a redirect error or the request. */
export async function parseAuthRequest(p: Record<string, string | undefined>): Promise<
  { fatal: string } | { redirectError: string; redirectUri: string; state: string | null } | { req: AuthRequest }
> {
  const client = await getClient(p.client_id ?? "");
  if (!client) return { fatal: "This app isn't registered with Cadence. Remove and re-add the connector in Claude." };
  const redirectUri = p.redirect_uri ?? (client.redirect_uris.length === 1 ? client.redirect_uris[0] : "");
  if (!redirectUri || !client.redirect_uris.includes(redirectUri)) return { fatal: "Invalid redirect URL for this app." };
  const state = p.state ?? null;
  if (p.response_type !== "code") return { redirectError: "unsupported_response_type", redirectUri, state };
  if (!p.code_challenge || (p.code_challenge_method && p.code_challenge_method !== "S256"))
    return { redirectError: "invalid_request", redirectUri, state };
  return { req: { client, redirectUri, state, codeChallenge: p.code_challenge, resource: p.resource ?? null } };
}

export function redirectWith(uri: string, params: Record<string, string | null | undefined>) {
  const u = new URL(uri);
  for (const [k, v] of Object.entries(params)) if (v) u.searchParams.set(k, v);
  return u.toString();
}
