import { cookies } from "next/headers";
import { createSession, newMcpToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { googleExchange } from "@/lib/google";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  let saved: { state?: string; next?: string } = {};
  try {
    saved = JSON.parse(jar.get("g_state")?.value || "{}");
  } catch {}
  jar.delete("g_state");
  const next = saved.next && saved.next.startsWith("/") ? saved.next : "/app";
  const fail = (code: string) => {
    const u = new URL("/login", req.url);
    u.searchParams.set("next", next);
    u.searchParams.set("auth_error", code);
    return Response.redirect(u);
  };

  if (url.searchParams.get("error")) return fail("google_denied");
  const code = url.searchParams.get("code");
  if (!code || !saved.state || url.searchParams.get("state") !== saved.state) return fail("expired");

  try {
    const g = await googleExchange(code);
    if (!g.email || g.email_verified === false) return fail("google_email");

    // 1) known Google identity  2) same verified email (link it)  3) new account
    let [user] = await sql<{ id: string; is_demo: boolean }[]>`select id, is_demo from users where google_sub = ${g.sub}`;
    if (!user) {
      [user] = await sql<{ id: string; is_demo: boolean }[]>`select id, is_demo from users where email = ${g.email}`;
      if (user && !user.is_demo) await sql`update users set google_sub = ${g.sub} where id = ${user.id}`;
    }
    if (user?.is_demo) return fail("demo");
    if (!user) {
      const tz = jar.get("tz")?.value || "Asia/Kolkata";
      [user] = await sql<{ id: string; is_demo: boolean }[]>`
        insert into users (email, name, password_hash, mcp_token, avatar_url, timezone, google_sub)
        values (${g.email}, ${g.name || g.email.split("@")[0]}, null, ${newMcpToken()}, ${g.picture ?? null}, ${tz}, ${g.sub})
        returning id, is_demo`;
    }
    await createSession(user.id);
    return Response.redirect(new URL(next, req.url));
  } catch (e) {
    console.error(e);
    return fail("google_failed");
  }
}
