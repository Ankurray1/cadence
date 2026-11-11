import "server-only";
import { getMilestones } from "./milestones";
import { computeStats } from "./stats";
import { buildRetention, type RetentionContext } from "./retention-core";
import type { Post } from "./types";

export type { RetentionContext, Stage } from "./retention-core";

export async function getRetentionContext(userId: string, posts: Post[], tz: string, weeklyGoal: number): Promise<RetentionContext> {
  const stats = computeStats(posts, tz, weeklyGoal);
  const { days, next } = await getMilestones(userId, tz);
  const real = posts.filter((p) => p.status === "posted" && !p.simulated && p.posted_at);
  const lastPostedAt = real.length ? new Date(Math.max(...real.map((p) => +new Date(p.posted_at!)))) : null;
  return buildRetention({ days, next, streak: stats.streak, bestStreak: stats.bestStreak, published: stats.published, thisWeek: stats.thisWeek, lastPostedAt, tz });
}
