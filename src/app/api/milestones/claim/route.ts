import { claimMilestone } from "@/lib/milestones";
import { json, withUser } from "../../_util";

export async function POST(req: Request) {
  return withUser(async (u) => {
    const { id } = await req.json().catch(() => ({}));
    const ok = await claimMilestone(u.id, String(id || ""), u.timezone);
    return ok ? json({ ok: true }) : json({ error: "This reward isn’t unlocked yet." }, 400);
  });
}
