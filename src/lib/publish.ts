import "server-only";
import { sql } from "./db";
import { getAccount, publishToLinkedIn } from "./linkedin";
import { PostError } from "./posts";
import type { Post } from "./types";

/**
 * Publish one post. Claims it atomically (status -> publishing) so the cron job
 * and a "Post now" click can never double-post. Without a LinkedIn connection the
 * post is marked as a simulated publish (demo mode).
 */
export async function publishPost(userId: string, id: string): Promise<Post> {
  const [claimed] = await sql<Post[]>`
    update posts set status = 'publishing', updated_at = now()
    where id = ${id} and user_id = ${userId} and status in ('draft','scheduled','failed')
    returning *`;
  if (!claimed) throw new PostError("Post not found or already published.");
  if (!claimed.body.trim()) {
    await sql`update posts set status = 'draft' where id = ${id}`;
    throw new PostError("Can't publish an empty post.");
  }
  try {
    const [{ is_demo }] = await sql<{ is_demo: boolean }[]>`select is_demo from users where id = ${userId}`;
    const acct = is_demo ? null : await getAccount(userId);
    const urn = acct ? await publishToLinkedIn(acct, claimed) : null;
    const [done] = await sql<Post[]>`
      update posts set status = 'posted', posted_at = now(), linkedin_urn = ${urn},
        simulated = ${!acct}, error = null, updated_at = now()
      where id = ${id} returning *`;
    return done;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const [failed] = await sql<Post[]>`
      update posts set status = 'failed', error = ${msg}, updated_at = now()
      where id = ${id} returning *`;
    return failed;
  }
}

/** Publish every scheduled post that is due. Optionally limited to one user. */
export async function runDue(userId?: string) {
  const due = await sql<{ id: string; user_id: string }[]>`
    select id, user_id from posts
    where status = 'scheduled' and scheduled_at <= now()
    ${userId ? sql`and user_id = ${userId}` : sql``}
    order by scheduled_at limit 25`;
  const results = [];
  for (const p of due) {
    try {
      const r = await publishPost(p.user_id, p.id);
      results.push({ id: p.id, status: r.status });
    } catch (e) {
      results.push({ id: p.id, status: "skipped", error: String(e) });
    }
  }
  return results;
}
