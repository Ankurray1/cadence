import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { json } from "../../_util";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  const [u] = await sql<{ id: string; password_hash: string | null }[]>`
    select id, password_hash from users where email = ${email ?? ""}`;
  if (u && !u.password_hash) return json({ error: "This account uses LinkedIn sign-in. Click “Continue with LinkedIn”." }, 400);
  if (!u || !(await bcrypt.compare(password ?? "", u.password_hash!)))
    return json({ error: "Wrong email or password." }, 401);
  await createSession(u.id);
  return json({ ok: true });
}
