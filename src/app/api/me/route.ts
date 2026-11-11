import { sql } from "@/lib/db";
import { json, withUser } from "../_util";

export async function PATCH(req: Request) {
  return withUser(async (u) => {
    const b = await req.json();
    let tz = u.timezone;
    if (b.timezone) {
      try {
        new Intl.DateTimeFormat("en", { timeZone: b.timezone });
        tz = b.timezone;
      } catch {
        return json({ error: "Unknown timezone" }, 400);
      }
    }
    const goal = Math.max(1, Math.min(14, Number(b.weekly_goal ?? u.weekly_goal) || 3));
    const name = String(b.name ?? u.name).trim().slice(0, 80) || u.name;
    const headline = String(b.headline ?? u.headline).slice(0, 160);
    await sql`update users set name = ${name}, headline = ${headline}, weekly_goal = ${goal}, timezone = ${tz}
      where id = ${u.id}`;
    return json({ ok: true });
  });
}
