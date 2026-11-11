import { sql } from "@/lib/db";
import { json, withUser } from "../../_util";

export async function POST() {
  return withUser(async (u) => {
    await sql`update users set onboarding_dismissed_at = now() where id = ${u.id}`;
    return json({ ok: true });
  });
}
