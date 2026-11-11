import "server-only";
import { cache } from "react";
import { sql } from "./db";
import type { Post } from "./types";

export const LINKEDIN_SCOPES = "openid profile email w_member_social";

const clientId = () => (process.env.LINKEDIN_CLIENT_ID || "").trim();
const clientSecret = () => (process.env.LINKEDIN_CLIENT_SECRET || "").trim();

export function linkedinConfigured() {
  return Boolean(clientId() && clientSecret());
}

export function redirectUri() {
  return `${process.env.APP_URL}/api/linkedin/callback`;
}

/** LinkedIn's versioned REST API wants YYYYMM; use a version ~2 months old so it's always live. */
function apiVersion() {
  if (process.env.LINKEDIN_VERSION) return process.env.LINKEDIN_VERSION;
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 2);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function authorizeUrl(state: string) {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: clientId(),
    redirect_uri: redirectUri(),
    state,
    scope: LINKEDIN_SCOPES,
    // Shows LinkedIn's newer sign-in page with "Continue with Google / Apple" and passkeys.
    // (Google sign-in itself only works in real browsers — not in embedded app webviews.)
    enable_extended_login: "true",
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${p}`;
}

export async function exchangeCode(code: string) {
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      client_id: clientId(),
      client_secret: clientSecret(),
    }),
  });
  if (!res.ok) throw new Error(`LinkedIn token exchange failed: ${await res.text()}`);
  const tok = (await res.json()) as { access_token: string; expires_in: number };
  const me = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${tok.access_token}` },
  });
  if (!me.ok) throw new Error(`LinkedIn profile lookup failed: ${await me.text()}`);
  const info = (await me.json()) as { sub: string; name?: string; picture?: string; email?: string };
  return { ...tok, ...info };
}

export type LinkedInAccount = {
  user_id: string;
  member_sub: string;
  name: string | null;
  picture: string | null;
  access_token: string;
  expires_at: string;
};

export const getAccount = cache(async (userId: string) => {
  const [a] = await sql<LinkedInAccount[]>`select * from linkedin_accounts where user_id = ${userId}`;
  return a ?? null;
});

/** LinkedIn "little text" format: these characters must be backslash-escaped or text gets dropped. */
function escapeCommentary(text: string) {
  return text.replace(/[\\|{}@\[\]()<>#*_~]/g, (c) => "\\" + c);
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "LinkedIn-Version": apiVersion(),
    "X-Restli-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };
}

async function uploadImage(acct: LinkedInAccount, imageId: string) {
  const [img] = await sql<{ mime: string; data: Buffer }[]>`select mime, data from images where id = ${imageId}`;
  if (!img) return null;
  const init = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers: headers(acct.access_token),
    body: JSON.stringify({ initializeUploadRequest: { owner: `urn:li:person:${acct.member_sub}` } }),
  });
  if (!init.ok) throw new Error(`Image upload init failed (${init.status}): ${await init.text()}`);
  const { value } = (await init.json()) as { value: { uploadUrl: string; image: string } };
  const put = await fetch(value.uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${acct.access_token}`, "Content-Type": img.mime },
    body: new Uint8Array(img.data),
  });
  if (!put.ok) throw new Error(`Image upload failed (${put.status}): ${await put.text()}`);
  return value.image;
}

export async function publishToLinkedIn(acct: LinkedInAccount, post: Post) {
  if (new Date(acct.expires_at).getTime() < Date.now())
    throw new Error("LinkedIn connection expired. Reconnect LinkedIn in Settings.");
  const imageUrn = post.image_id ? await uploadImage(acct, post.image_id) : null;
  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: headers(acct.access_token),
    body: JSON.stringify({
      author: `urn:li:person:${acct.member_sub}`,
      commentary: escapeCommentary(post.body),
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      ...(imageUrn ? { content: { media: { id: imageUrn } } } : {}),
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });
  if (!res.ok) throw new Error(`LinkedIn rejected the post (${res.status}): ${(await res.text()).slice(0, 300)}`);
  return res.headers.get("x-restli-id") || "";
}

export function postUrl(urn: string | null) {
  return urn ? `https://www.linkedin.com/feed/update/${urn}/` : null;
}
