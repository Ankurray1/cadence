import "server-only";
import { sql } from "./db";

/**
 * Consistency milestones. Streaks count CONSECUTIVE DAYS with a real LinkedIn post
 * (demo publishes excluded, max one per day), in the user's timezone.
 *
 *   1st post        → congratulations (no reward)
 *   21-day streak   → "You've formed a habit" (21 days builds a habit) — reveals the next offer
 *   29-day streak   → Cadence covers 50% of LinkedIn Premium
 *   60-day streak   → 1 month of LinkedIn Premium, paid by Cadence
 *   90-day streak   → another free month of LinkedIn Premium (always visible as the grand prize)
 *
 * Each reward stays a mystery until the previous milestone is reached.
 * LinkedIn Premium rewards are funded by Cadence (reimbursement or Premium gift), not a LinkedIn discount.
 */
export type Milestone = {
  id: string;
  kind: "posts" | "daily"; // posts = total posting days; daily = consecutive-day streak
  target: number;
  title: string;
  reward: string | null; // null = celebration only, nothing to claim
  celebration: string;
  detail: string;
  value: string;
};

export const MILESTONES: Milestone[] = [
  { id: "first-post", kind: "posts", target: 1, title: "First post", reward: null, celebration: "Congratulations, your first post is live!", detail: "The hardest post is the first one. You’ve done it.", value: "Milestone" },
  { id: "streak-21", kind: "daily", target: 21, title: "21-day streak", reward: null, celebration: "You’ve formed a habit. 🎉", detail: "21 days in a row builds a habit, and it unlocks your first offer.", value: "Unlocks an offer" },
  { id: "streak-29", kind: "daily", target: 29, title: "29-day streak", reward: "50% of LinkedIn Premium, covered by Cadence", celebration: "Half of your LinkedIn Premium is on us.", detail: "Keep going 8 more days after your habit forms. We reimburse 50% of one month.", value: "≈$20" },
  { id: "streak-60", kind: "daily", target: 60, title: "60-day streak", reward: "1 month of LinkedIn Premium, paid by Cadence", celebration: "Two months of showing up. Premium is on us.", detail: "Post every day for 2 months and we pay for a month of LinkedIn Premium.", value: "≈$40" },
  { id: "streak-90", kind: "daily", target: 90, title: "90-day streak", reward: "Get 1 month of LinkedIn Premium free", celebration: "90 days. You’re a LinkedIn regular. Another free month of Premium is yours.", detail: "Post every day for 90 days and get 1 month of LinkedIn Premium free, paid by Cadence.", value: "≈$40" },
];

export type MilestoneState = Milestone & { progress: number; unlocked: boolean; claimed: boolean; revealed: boolean };

/** Current and best run of consecutive days (YYYY-MM-DD strings, sorted). Current counts if it includes today or yesterday. */
function streaks(dates: string[], tz: string) {
  const dayNum = (d: string) => Math.round(new Date(d + "T12:00:00Z").getTime() / 86400000);
  const nums = [...new Set(dates)].map(dayNum).sort((a, b) => a - b);
  let best = 0, run = 0;
  for (let i = 0; i < nums.length; i++) {
    run = i > 0 && nums[i] === nums[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  const today = dayNum(new Date().toLocaleDateString("en-CA", { timeZone: tz }));
  const last = nums[nums.length - 1];
  const current = last !== undefined && today - last <= 1 ? run : 0;
  return { current, best };
}

export async function getMilestones(userId: string, tz = "Asia/Kolkata") {
  const [rows, claims] = await Promise.all([
    sql<{ d: string }[]>`
      select distinct to_char(posted_at at time zone ${tz}, 'YYYY-MM-DD') as d
      from posts where user_id = ${userId} and status = 'posted' and not simulated and posted_at is not null`,
    sql<{ milestone_id: string }[]>`select milestone_id from reward_claims where user_id = ${userId}`,
  ]);
  const dates = rows.map((r) => r.d);
  const days = dates.length;
  const { current: dailyStreak, best: bestDailyStreak } = streaks(dates, tz);
  const claimed = new Set(claims.map((c) => c.milestone_id));

  const base = MILESTONES.map((m) => {
    const progress = m.kind === "posts" ? days : dailyStreak;
    const unlocked = m.kind === "posts" ? days >= m.target : bestDailyStreak >= m.target;
    return { ...m, progress, unlocked, claimed: claimed.has(m.id), revealed: true };
  });
  const nextIdx = base.findIndex((m) => !m.unlocked);
  const list: MilestoneState[] = base.map((m, i) => ({ ...m, revealed: nextIdx === -1 || i <= nextIdx || i === base.length - 1 })); // the grand prize is always visible
  const next = nextIdx === -1 ? null : list[nextIdx];
  return { dates, days, dailyStreak, bestDailyStreak, list, next, unclaimed: list.filter((m) => m.unlocked && m.reward && !m.claimed).length };
}

export async function claimMilestone(userId: string, milestoneId: string, tz?: string) {
  const { list } = await getMilestones(userId, tz);
  const m = list.find((x) => x.id === milestoneId);
  if (!m || !m.unlocked || !m.reward) return false;
  await sql`insert into reward_claims (user_id, milestone_id) values (${userId}, ${milestoneId}) on conflict do nothing`;
  return true;
}
