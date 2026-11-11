import { sql } from "@/lib/db";
import { newMcpToken } from "@/lib/auth";
import { json, withUser } from "../../_util";

export async function POST() {
  return withUser(async (u) => {
    await sql`update users set mcp_token = ${newMcpToken()} where id = ${u.id}`;
    return json({ ok: true });
  });
}
