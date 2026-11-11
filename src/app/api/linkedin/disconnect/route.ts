import { sql } from "@/lib/db";
import { json, withUser } from "../../_util";

export async function POST() {
  return withUser(async (u) => {
    await sql`delete from linkedin_accounts where user_id = ${u.id}`;
    return json({ ok: true });
  });
}
