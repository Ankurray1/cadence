import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { createSession, newMcpToken } from "@/lib/auth";
import { json } from "../../_util";

export async function POST(req: Request) {
  const { email, password, name, timezone } = await req.json().catch(() => ({}));
  let tz = "Asia/Kolkata";
  try {
    if (timezone) {
      new Intl.DateTimeFormat("en", { timeZone: timezone });
      tz = timezone;
    }
  } catch {}
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Enter a valid email." }, 400);
  if (!password || password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);
  if (!name?.trim()) return json({ error: "Enter your name." }, 400);
  const [exists] = await sql`select 1 from users where email = ${email}`;
  if (exists) return json({ error: "An account with this email already exists. Log in instead." }, 409);
  const hash = await bcrypt.hash(password, 10);
  const [u] = await sql<{ id: string }[]>`
    insert into users (email, name, password_hash, mcp_token, timezone)
    values (${email}, ${name.trim()}, ${hash}, ${newMcpToken()}, ${tz}) returning id`;
  await createSession(u.id);
  return json({ ok: true });
}
