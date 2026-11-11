import { cookies } from "next/headers";
import { createSession, getUser, newMcpToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { exchangeCode } from "@/lib/linkedin";

function withParam(path: string, key: string, value: string, base: string) {
  const u = new URL(path, base);
  u.searchParams.set(key, value);
  return u;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  let saved: { state?: string; next?: string; mode?: string } = {};
  try {
    saved = JSON.parse(jar.get("li_state")?.value || "{}");
  } catch {}
  jar.delete("li_state");
  const next = saved.next && saved.next.startsWith("/") ? saved.next : "/app";
  // On failure, signed-out users go back to the page that can show the error (not a protected page).
  const signedIn = Boolean(await getUser());
  const failTo = signedIn || next.startsWith("/oauth/") ? next : `/login?next=${encodeURIComponent(next)}`;

  if (url.searchParams.get("error")) return Response.redirect(withParam(failTo, "li_error", "denied", req.url));
  const code = url.searchParams.get("code");
  if (!code || !saved.state || url.searchParams.get("state") !== saved.state)
    return Response.redirect(withParam(failTo, "li_error", "expired", req.url));

  try {
    const t = await exchangeCode(code);
    const expires = new Date(Date.now() + t.expires_in * 1000);

    // Who is this? 1) already signed in (unless switching)  2) known LinkedIn member  3) same email  4) brand-new user
    // The shared demo account can never hold a real LinkedIn connection — treat it like a switch.
    const current = saved.mode === "switch" ? null : await getUser();
    let userId = current && !current.is_demo ? current.id : undefined;
    if (!userId) {
      const [byMember] = await sql<{ user_id: string }[]>`select user_id from linkedin_accounts where member_sub = ${t.sub}`;
      userId = byMember?.user_id;
    }
    if (!userId && t.email) {
      const [byEmail] = await sql<{ id: string }[]>`select id from users where email = ${t.email}`;
      userId = byEmail?.id;
    }
    if (!userId) {
      const tz = jar.get("tz")?.value || "Asia/Kolkata";
      const [created] = await sql<{ id: string }[]>`
        insert into users (email, name, password_hash, mcp_token, avatar_url, timezone)
        values (${t.email || `${t.sub}@linkedin.member`}, ${t.name || "LinkedIn member"}, null, ${newMcpToken()}, ${t.picture ?? null}, ${tz})
        returning id`;
      userId = created.id;
    }

    // A LinkedIn member can only be linked to one Cadence account.
    await sql`delete from linkedin_accounts where member_sub = ${t.sub} and user_id <> ${userId}`;
    await sql`
      insert into linkedin_accounts (user_id, member_sub, name, picture, access_token, expires_at)
      values (${userId}, ${t.sub}, ${t.name ?? null}, ${t.picture ?? null}, ${t.access_token}, ${expires})
      on conflict (user_id) do update set member_sub = excluded.member_sub, name = excluded.name,
        picture = excluded.picture, access_token = excluded.access_token,
        expires_at = excluded.expires_at, connected_at = now()`;
    await sql`update users set avatar_url = coalesce(${t.picture ?? null}, avatar_url) where id = ${userId}`;
    await createSession(userId);
    return Response.redirect(new URL(next, req.url));
  } catch (e) {
    console.error(e);
    return Response.redirect(withParam(failTo, "li_error", "failed", req.url));
  }
}
