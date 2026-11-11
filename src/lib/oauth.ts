import "server-only";
import { createHash, randomBytes } from "crypto";
import { sql } from "./db";
import type { User } from "./types";

export const ACCESS_TTL_S = 60 * 60 * 24 * 30; // 30 days
const REFRESH_TTL_S = 60 * 60 * 24 * 180; // 180 days
const CODE_TTL_S = 300;

export const baseUrl = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
export const mcpResource = () => `${baseUrl()}/api/mcp`;

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const token = (prefix: string) => prefix + randomBytes(32).toString("base64url");

export class OAuthError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, MCP-Protocol-Version",
};

export function oauthErrorResponse(e: unknown) {
  if (e instanceof OAuthError)
    return Response.json({ error: e.code, error_description: e.message }, { status: e.status, headers: CORS });
  console.error("[oauth]", e);
  return Response.json({ error: "server_error" }, { status: 500, headers: CORS });
}

export function authServerMetadata() {
  const b = baseUrl();
  return {
    issuer: b,
    authorization_endpoint: `${b}/oauth/authorize`,
    token_endpoint: `${b}/api/oauth/token`,
    registration_endpoint: `${b}/api/oauth/register`,
    revocation_endpoint: `${b}/api/oauth/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["posts"],
    client_id_metadata_document_supported: true,
  };
}

export function protectedResourceMetadata() {
  return {
    resource: mcpResource(),
    authorization_servers: [baseUrl()],
    scopes_supported: ["posts"],
    bearer_methods_supported: ["header"],
    resource_name: "Cadence",
  };
}

function validRedirect(u: string) {
  try {
    const url = new URL(u);
    return url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** RFC 7591 dynamic client registration (public clients only). */
export async function registerClient(body: { redirect_uris?: unknown; client_name?: unknown }) {
  const uris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((u): u is string => typeof u === "string") : [];
  if (!uris.length || !uris.every(validRedirect))
    throw new OAuthError("invalid_redirect_uri", "redirect_uris must be https URLs");
  const clientId = "cdc_" + randomBytes(16).toString("hex");
  const name = typeof body.client_name === "string" ? body.client_name.slice(0, 100) : null;
  await sql`insert into oauth_clients (client_id, client_name, redirect_uris) values (${clientId}, ${name}, ${uris})`;
  return {
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: name ?? undefined,
    redirect_uris: uris,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  };
}

export type Client = { client_id: string; client_name: string | null; redirect_uris: string[] };

/** Look up a registered client, or fetch a Client ID Metadata Document when client_id is an https URL. */
export async function getClient(clientId: string): Promise<Client | null> {
  if (!clientId) return null;
  if (clientId.startsWith("https://")) {
    try {
      const res = await fetch(clientId, { signal: AbortSignal.timeout(5000), headers: { Accept: "application/json" } });
      if (!res.ok) return null;
      const doc = await res.json();
      if (doc.client_id !== clientId || !Array.isArray(doc.redirect_uris)) return null;
      return { client_id: clientId, client_name: doc.client_name ?? new URL(clientId).hostname, redirect_uris: doc.redirect_uris };
    } catch {
      return null;
    }
  }
  const [c] = await sql<Client[]>`select client_id, client_name, redirect_uris from oauth_clients where client_id = ${clientId}`;
  return c ?? null;
}

export async function createCode(p: { clientId: string; userId: string; redirectUri: string; codeChallenge: string; resource?: string | null }) {
  const code = token("cdcode_");
  await sql`insert into oauth_codes (code_hash, client_id, user_id, redirect_uri, code_challenge, resource, expires_at)
    values (${sha256(code)}, ${p.clientId}, ${p.userId}, ${p.redirectUri}, ${p.codeChallenge}, ${p.resource ?? null},
      ${new Date(Date.now() + CODE_TTL_S * 1000)})`;
  return code;
}

async function issue(clientId: string, userId: string) {
  const access = token("cat_");
  const refresh = token("crt_");
  await sql`insert into oauth_tokens (token_hash, kind, client_id, user_id, expires_at) values
    (${sha256(access)}, 'access', ${clientId}, ${userId}, ${new Date(Date.now() + ACCESS_TTL_S * 1000)}),
    (${sha256(refresh)}, 'refresh', ${clientId}, ${userId}, ${new Date(Date.now() + REFRESH_TTL_S * 1000)})`;
  return { access_token: access, token_type: "Bearer", expires_in: ACCESS_TTL_S, refresh_token: refresh, scope: "posts" };
}

export async function exchangeAuthCode(f: URLSearchParams) {
  const code = f.get("code") || "";
  const verifier = f.get("code_verifier") || "";
  const [row] = await sql<{ client_id: string; user_id: string; redirect_uri: string; code_challenge: string; expires_at: Date; used: boolean }[]>`
    update oauth_codes set used = true where code_hash = ${sha256(code)} and used = false
    returning client_id, user_id, redirect_uri, code_challenge, expires_at, used`;
  if (!row || row.expires_at.getTime() < Date.now()) throw new OAuthError("invalid_grant", "Code is invalid or expired");
  if (f.get("client_id") && f.get("client_id") !== row.client_id) throw new OAuthError("invalid_grant", "client_id mismatch");
  if (f.get("redirect_uri") && f.get("redirect_uri") !== row.redirect_uri) throw new OAuthError("invalid_grant", "redirect_uri mismatch");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  if (!verifier || challenge !== row.code_challenge) throw new OAuthError("invalid_grant", "PKCE verification failed");
  return issue(row.client_id, row.user_id);
}

export async function refreshTokens(f: URLSearchParams) {
  const rt = f.get("refresh_token") || "";
  const [row] = await sql<{ client_id: string; user_id: string }[]>`
    update oauth_tokens set revoked = true
    where token_hash = ${sha256(rt)} and kind = 'refresh' and not revoked and expires_at > now()
    returning client_id, user_id`;
  if (!row) throw new OAuthError("invalid_grant", "Refresh token is invalid or expired");
  return issue(row.client_id, row.user_id);
}

export async function revokeToken(t: string) {
  await sql`update oauth_tokens set revoked = true where token_hash = ${sha256(t)}`;
}

export async function userFromAccessToken(bearer: string | null): Promise<User | null> {
  if (!bearer?.startsWith("cat_")) return null;
  const [u] = await sql<User[]>`
    update oauth_tokens t set last_used_at = now()
    from users u
    where t.token_hash = ${sha256(bearer)} and t.kind = 'access' and not t.revoked and t.expires_at > now() and u.id = t.user_id
    returning u.id, u.email::text, u.name, u.headline, u.mcp_token, u.weekly_goal, u.timezone, u.is_demo`;
  return u ?? null;
}

export async function connectedApps(userId: string) {
  return sql<{ client_id: string; client_name: string | null; last_used_at: Date | null; created_at: Date }[]>`
    select t.client_id, c.client_name, max(t.last_used_at) as last_used_at, min(t.created_at) as created_at
    from oauth_tokens t left join oauth_clients c on c.client_id = t.client_id
    where t.user_id = ${userId} and not t.revoked and t.expires_at > now()
    group by t.client_id, c.client_name order by min(t.created_at) desc`;
}

export async function revokeClient(userId: string, clientId: string) {
  await sql`update oauth_tokens set revoked = true where user_id = ${userId} and client_id = ${clientId}`;
}
