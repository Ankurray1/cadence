import "server-only";
import { cache } from "react";
import { sql } from "./db";
import { getAccount } from "./linkedin";
import { connectedApps } from "./oauth";

export type Onboarding = {
  linkedin: boolean;
  claude: boolean;
  firstPost: boolean;
  done: number;
  total: number;
  complete: boolean;
  dismissed: boolean;
  isDemo: boolean;
  email: string;
};

export const getOnboarding = cache(async (userId: string): Promise<Onboarding> => {
  const [acct, apps, [row]] = await Promise.all([
    getAccount(userId),
    connectedApps(userId),
    sql<{ posts: number; dismissed: boolean; is_demo: boolean; email: string }[]>`
      select ((select count(*) from posts where user_id = ${userId} and (source = 'claude' or status = 'posted')) + (case when first_claude_post_at is not null then 1 else 0 end))::int as posts,
             onboarding_dismissed_at is not null as dismissed, is_demo, email::text
      from users where id = ${userId}`,
  ]);
  const linkedin = Boolean(acct) || row.is_demo; // demo account never connects LinkedIn
  const claude = apps.length > 0;
  const firstPost = row.posts > 0;
  const done = [linkedin, claude, firstPost].filter(Boolean).length;
  return { linkedin, claude, firstPost, done, total: 3, complete: done === 3, dismissed: row.dismissed, isDemo: row.is_demo, email: row.email };
});
