import "server-only";
import { sql } from "./db";
import { MAX_CHARS, PILLARS, type Post, type PostStatus } from "./types";

export class PostError extends Error {}

const COLS = sql`id, user_id, title, body, original_body, image_id, pillar, status,
  scheduled_at, posted_at, linkedin_urn, simulated, error, source, created_at, updated_at`;

function cleanPillar(p?: string | null) {
  if (!p) return undefined;
  const hit = PILLARS.find((x) => x.toLowerCase() === p.toLowerCase());
  return hit ?? p.slice(0, 40);
}

function checkBody(body?: string) {
  if (body !== undefined && body.length > MAX_CHARS)
    throw new PostError(`Post is ${body.length} characters; LinkedIn allows ${MAX_CHARS}.`);
}

export function parseFutureDate(input: string): Date {
  const d = new Date(input);
  if (isNaN(d.getTime())) throw new PostError(`"${input}" is not a valid date/time. Use ISO 8601 with a timezone offset, e.g. 2026-11-12T09:00:00+05:30.`);
  if (d.getTime() < Date.now() - 60_000) throw new PostError("That time is in the past. Pick a future time.");
  return d;
}

export async function listPosts(userId: string, status?: PostStatus | "all", limit = 100) {
  return sql<Post[]>`
    select ${COLS} from posts
    where user_id = ${userId}
    ${status && status !== "all" ? sql`and status = ${status}` : sql``}
    order by coalesce(scheduled_at, posted_at, updated_at) desc
    limit ${limit}`;
}

export async function getPost(userId: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [p] = await sql<Post[]>`select ${COLS} from posts where id = ${id} and user_id = ${userId}`;
  return p ?? null;
}

export async function createPost(
  userId: string,
  input: { body: string; title?: string; pillar?: string; imageId?: string | null; scheduleAt?: string | null; source: "claude" | "app" },
) {
  checkBody(input.body);
  const when = input.scheduleAt ? parseFutureDate(input.scheduleAt) : null;
  const title = (input.title || input.body.split("\n").find((l) => l.trim()) || "Untitled").slice(0, 80);
  const [p] = await sql<Post[]>`
    insert into posts (user_id, title, body, original_body, pillar, image_id, status, scheduled_at, source)
    values (${userId}, ${title}, ${input.body}, ${input.source === "claude" ? input.body : null},
      ${cleanPillar(input.pillar) ?? "Thought leadership"}, ${input.imageId ?? null},
      ${when ? "scheduled" : "draft"}, ${when}, ${input.source})
    returning ${COLS}`;
  if (input.source === "claude") await sql`update users set first_claude_post_at = coalesce(first_claude_post_at, now()) where id = ${userId}`;
  return p;
}

export async function updatePost(
  userId: string,
  id: string,
  input: { body?: string; title?: string; pillar?: string; imageId?: string | null; byClaude?: boolean },
) {
  checkBody(input.body);
  const post = await getPost(userId, id);
  if (!post) throw new PostError("Post not found.");
  if (post.status === "posted" || post.status === "publishing")
    throw new PostError("This post is already published and can't be edited.");
  const [p] = await sql<Post[]>`
    update posts set
      body = ${input.body ?? post.body},
      original_body = ${input.byClaude && input.body !== undefined ? input.body : post.original_body},
      title = ${(input.title ?? post.title).slice(0, 80)},
      pillar = ${cleanPillar(input.pillar) ?? post.pillar},
      image_id = ${input.imageId === undefined ? post.image_id : input.imageId},
      status = case when status = 'failed' then 'draft' else status end,
      error = null,
      updated_at = now()
    where id = ${id} and user_id = ${userId}
    returning ${COLS}`;
  return p;
}

export async function schedulePost(userId: string, id: string, at: string | null) {
  const post = await getPost(userId, id);
  if (!post) throw new PostError("Post not found.");
  if (post.status === "posted" || post.status === "publishing")
    throw new PostError("This post is already published.");
  const when = at ? parseFutureDate(at) : null;
  if (when && !post.body.trim()) throw new PostError("Can't schedule an empty post.");
  const [p] = await sql<Post[]>`
    update posts set scheduled_at = ${when}, status = ${when ? "scheduled" : "draft"},
      error = null, updated_at = now()
    where id = ${id} and user_id = ${userId}
    returning ${COLS}`;
  return p;
}

export async function deletePost(userId: string, id: string) {
  const r = await sql`delete from posts where id = ${id} and user_id = ${userId} and status <> 'publishing'`; // never delete mid-publish
  return r.count > 0;
}

export async function calendar(userId: string, from: Date, to: Date) {
  return sql<Post[]>`
    select ${COLS} from posts
    where user_id = ${userId}
      and coalesce(scheduled_at, posted_at) between ${from} and ${to}
    order by coalesce(scheduled_at, posted_at) asc`;
}

export async function weekStats(userId: string) {
  const [s] = await sql<{ posted: number; scheduled: number; drafts: number }[]>`
    select
      count(*) filter (where status = 'posted' and posted_at >= date_trunc('week', now()))::int as posted,
      count(*) filter (where status = 'scheduled' and scheduled_at < date_trunc('week', now()) + interval '7 days')::int as scheduled,
      count(*) filter (where status = 'draft')::int as drafts
    from posts where user_id = ${userId}`;
  return s;
}

export async function saveImage(userId: string, mime: string, data: Buffer) {
  if (!/^image\/(png|jpe?g|gif|webp)$/.test(mime)) throw new PostError("Only PNG, JPG, GIF or WebP images are supported.");
  if (data.length > 5 * 1024 * 1024) throw new PostError("Image must be under 5 MB.");
  const [r] = await sql<{ id: string }[]>`
    insert into images (user_id, mime, data) values (${userId}, ${mime}, ${data}) returning id`;
  return r.id;
}

export async function importImageFromUrl(userId: string, url: string) {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new PostError("image_url is not a valid URL.");
  }
  if (u.protocol !== "https:") throw new PostError("image_url must be an https:// link.");
  const res = await fetch(u, { redirect: "follow", signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new PostError(`Couldn't download the image (HTTP ${res.status}).`);
  const mime = (res.headers.get("content-type") || "").split(";")[0].trim();
  const buf = Buffer.from(await res.arrayBuffer());
  return saveImage(userId, mime, buf);
}
