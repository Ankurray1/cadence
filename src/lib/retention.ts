import "server-only";
import { getMilestones } from "./milestones";
import { computeStats } from "./stats";
import { buildRetention, type RetentionContext } from "./retention-core";
import type { Post } from "./types";

export type { RetentionContext, Stage } from "./retention-core";

export async function getRetentionContext(userId: string, posts: Post[], tz: string, weeklyGoal: number, ms?: { days: number; next: Awaited<ReturnType<typeof getMilestones>>["next"] }): Promise<RetentionContext> {
  const stats = computeStats(posts, tz, weeklyGoal);
  const { days, next } = ms ?? (await getMilestones(userId, tz));
  const real = posts.filter((p) => p.status === "posted" && !p.simulated && p.posted_at);
  const lastPostedAt = real.length ? new Date(Math.max(...real.map((p) => +new Date(p.posted_at!)))) : null;
  return buildRetention({ days, next, streak: stats.streak, bestStreak: stats.bestStreak, published: stats.published, thisWeek: stats.thisWeek, lastPostedAt, tz });
}
