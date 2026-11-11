import type { Post } from "./types";

/** YYYY-MM-DD of the Monday of the week containing `d`, in timezone `tz`. */
export function weekKey(d: Date | string, tz: string) {
  const local = new Date(new Date(d).toLocaleDateString("en-CA", { timeZone: tz }) + "T12:00:00Z");
  local.setUTCDate(local.getUTCDate() - ((local.getUTCDay() + 6) % 7));
  return local.toISOString().slice(0, 10);
}

function shiftWeek(key: string, weeks: number) {
  const d = new Date(key + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export type Badge = { id: string; label: string; desc: string; earned: boolean; emoji: string };

export type Stats = {
  published: number;
  scheduled: number;
  drafts: number;
  publishedThisMonth: number;
  streak: number; // consecutive weeks with ≥1 post (published, or scheduled for the current week)
  bestStreak: number;
  thisWeek: { published: number; planned: number };
  weeks: { key: string; published: number; planned: number }[]; // last 12 weeks, oldest first
  badges: Badge[];
  nextBadge: Badge | null;
};

export function computeStats(posts: Post[], tz: string, weeklyGoal: number): Stats {
  const now = new Date();
  const current = weekKey(now, tz);
  const monthKey = now.toLocaleDateString("en-CA", { timeZone: tz }).slice(0, 7);

  const publishedByWeek = new Map<string, number>();
  const plannedByWeek = new Map<string, number>();
  let publishedThisMonth = 0;
  for (const p of posts) {
    if (p.status === "posted" && p.posted_at) {
      const k = weekKey(p.posted_at, tz);
      publishedByWeek.set(k, (publishedByWeek.get(k) ?? 0) + 1);
      if (new Date(p.posted_at).toLocaleDateString("en-CA", { timeZone: tz }).startsWith(monthKey)) publishedThisMonth++;
    } else if ((p.status === "scheduled" || p.status === "publishing") && p.scheduled_at) {
      const k = weekKey(p.scheduled_at, tz);
      plannedByWeek.set(k, (plannedByWeek.get(k) ?? 0) + 1);
    }
  }

  // Current streak: the current week counts if anything is published or planned; it never breaks mid-week.
  const active = (k: string) => (publishedByWeek.get(k) ?? 0) > 0;
  let streak = 0;
  let k = current;
  if (active(k) || (plannedByWeek.get(k) ?? 0) > 0) streak++;
  k = shiftWeek(k, -1);
  while (active(k)) { streak++; k = shiftWeek(k, -1); }

  // Best streak across all published weeks.
  const keys = [...publishedByWeek.keys()].sort();
  let best = 0, run = 0, prev = "";
  for (const key of keys) {
    run = prev && shiftWeek(prev, 1) === key ? run + 1 : 1;
    best = Math.max(best, run);
    prev = key;
  }
  best = Math.max(best, streak);

  const weeks = Array.from({ length: 12 }, (_, i) => {
    const key = shiftWeek(current, i - 11);
    return { key, published: publishedByWeek.get(key) ?? 0, planned: plannedByWeek.get(key) ?? 0 };
  });

  const published = posts.filter((p) => p.status === "posted").length;
  const scheduled = posts.filter((p) => p.status === "scheduled" || p.status === "publishing").length;
  const drafts = posts.filter((p) => p.status === "draft" || p.status === "failed").length;
  const goalWeeks = [...publishedByWeek.values()].filter((n) => n >= weeklyGoal).length;
  const fromClaude = posts.filter((p) => p.source === "claude").length;

  const badges: Badge[] = [
    { id: "first", emoji: "🚀", label: "First post", desc: "Publish your first post", earned: published >= 1 },
    { id: "claude", emoji: "✨", label: "Claude co-pilot", desc: "Save a post from Claude", earned: fromClaude >= 1 },
    { id: "planner", emoji: "🗓️", label: "Planner", desc: "Have 3 posts scheduled at once", earned: scheduled >= 3 },
    { id: "goal", emoji: "🎯", label: "Goal crusher", desc: `Hit ${weeklyGoal} posts in a week`, earned: goalWeeks >= 1 },
    { id: "streak3", emoji: "🔥", label: "On fire", desc: "3-week posting streak", earned: best >= 3 },
    { id: "ten", emoji: "🏆", label: "Ten club", desc: "Publish 10 posts", earned: published >= 10 },
  ];

  return {
    published,
    scheduled,
    drafts,
    publishedThisMonth,
    streak,
    bestStreak: best,
    thisWeek: { published: publishedByWeek.get(current) ?? 0, planned: plannedByWeek.get(current) ?? 0 },
    weeks,
    badges,
    nextBadge: badges.find((b) => !b.earned) ?? null,
  };
}
