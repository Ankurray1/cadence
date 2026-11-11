import type { Milestone } from "./milestones";

export type Stage = "new" | "streak_at_risk" | "building" | "engaged" | "lapsed";

/** Everything the delete dialog needs to talk to THIS user, computed from their real activity. */
export type RetentionContext = {
  stage: Stage;
  headline: string;
  lines: string[]; // personal, data-backed sentences (rendered with **bold** markers)
  reward: string | null; // "**1 posting day** away from unlocking **7 days of Solo**"
  showProof: boolean; // generic industry stats (only for people without a track record yet)
};

function plural(n: number, w: string) {
  return `${n} ${w}${n === 1 ? "" : "s"}`;
}

function relativeAgo(d: Date) {
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 1) return "today";
  if (days < 14) return `${plural(days, "day")} ago`;
  return `${plural(Math.round(days / 7), "week")} ago`;
}

/** Last day of the current Monday-based week in the user's timezone, e.g. "Sunday". */
function weekEndsIn(tz: string) {
  const dow = (new Date(new Date().toLocaleDateString("en-CA", { timeZone: tz }) + "T12:00:00Z").getUTCDay() + 6) % 7; // 0 = Mon
  const left = 6 - dow;
  return left === 0 ? "tonight" : left === 1 ? "tomorrow" : "this Sunday";
}

export type RetentionInput = {
  days: number; // distinct days with a real LinkedIn post
  next: (Milestone & { progress: number }) | null;
  streak: number;
  bestStreak: number;
  published: number;
  thisWeek: { published: number; planned: number };
  lastPostedAt: Date | null;
  tz: string;
};

/** Pure decision logic: which stage this user is in, and what to say to them. */
export function buildRetention({ days, next, streak, bestStreak, published, thisWeek, lastPostedAt, tz }: RetentionInput): RetentionContext {
  const stats = { streak, bestStreak, published, thisWeek };
  const last = lastPostedAt;
  const daysSinceLast = last ? (Date.now() - last.getTime()) / 86400000 : Infinity;
  const nothingThisWeek = thisWeek.published === 0 && thisWeek.planned === 0;

  const reward = next
    ? next.kind === "daily"
      ? `You’re **${plural(next.target - next.progress, "day")} in a row** away from ${next.reward ? `unlocking **${next.reward}**` : "**forming a habit** and unlocking your first offer"}. Publishing this would count.`
      : `Publish this and you’ll hit your **first post** milestone.`
    : null;

  // Order matters: the most urgent, most personal situation wins.
  if (days === 0)
    return {
      stage: "new",
      headline: "This could be your first post on LinkedIn.",
      lines: [],
      reward,
      showProof: true,
    };

  if (daysSinceLast > 14)
    return {
      stage: "lapsed",
      headline: "Welcome back. This draft can restart your rhythm.",
      lines: [`Your last post went live **${relativeAgo(last!)}**. Publishing this starts a fresh streak.`, `You’ve already shown up on **${plural(days, "posting day")}**. Momentum is easier to rebuild than to start.`],
      reward,
      showProof: true,
    };

  if (stats.streak >= 1 && nothingThisWeek)
    return {
      stage: "streak_at_risk",
      headline: `Your ${stats.streak}-week streak ends ${weekEndsIn(tz)}.`,
      lines: [`Nothing is published or scheduled this week yet. **Scheduling this keeps your streak alive.**`, `Best streak so far: **${plural(stats.bestStreak, "week")}**.`],
      reward,
      showProof: false,
    };

  if (days >= 10)
    return {
      stage: "engaged",
      headline: "You’ve built a real posting habit.",
      lines: [
        `**${plural(days, "posting day")}** so far, with a best streak of **${plural(stats.bestStreak, "week")}**.`,
        `This would be post **#${stats.published + 1}** on your profile.`,
      ],
      reward,
      showProof: false,
    };

  return {
    stage: "building",
    headline: "Keep the momentum going.",
    lines: [`You’ve published on **${plural(days, "day")}** so far${stats.streak ? `, on a **${stats.streak}-week** streak` : ""}. Each post makes the next one easier.`],
    reward,
    showProof: true,
  };
}
