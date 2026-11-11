import "server-only";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  PostError,
  calendar,
  createPost,
  deletePost,
  getPost,
  importImageFromUrl,
  listPosts,
  schedulePost,
  updatePost,
  weekStats,
} from "@/lib/posts";
import { publishPost } from "@/lib/publish";
import { getAccount, postUrl } from "@/lib/linkedin";
import { FOLD_CHARS, MAX_CHARS, PILLARS, type Post, type User } from "@/lib/types";

const appUrl = () => process.env.APP_URL || "http://localhost:3000";
const maskEmail = (e: string) => { const [n, d] = e.split("@"); return `${n.slice(0, 2)}•••@${d}`; };
const accountLabel = (u: User) => `${u.name}'s Cadence (${maskEmail(u.email)})`;

function fmt(p: Post) {
  return {
    id: p.id,
    title: p.title,
    status: p.status,
    pillar: p.pillar,
    scheduled_at: p.scheduled_at,
    posted_at: p.posted_at,
    simulated_publish: p.simulated || undefined,
    error: p.error || undefined,
    has_image: Boolean(p.image_id),
    characters: p.body.length,
    edit_url: `${appUrl()}/app/posts/${p.id}`,
    linkedin_url: postUrl(p.linkedin_urn) || undefined,
    body: p.body,
  };
}

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const fail = (msg: string) => ({ content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true });

async function guard<T>(fn: () => Promise<T>) {
  try {
    return ok(await fn());
  } catch (e) {
    if (e instanceof PostError) return fail(e.message);
    console.error("[mcp]", e);
    return fail("Something went wrong on the Cadence server. Please try again.");
  }
}

const pillarHint = `One of: ${PILLARS.join(", ")}.`;
const whenHint =
  "ISO 8601 date-time WITH timezone offset, e.g. 2026-11-12T09:00:00+05:30. Call get_workspace first to learn the user's timezone and current time.";

export function buildMcpHandler(user: User) {
  return createMcpHandler(
    (server) => {
      server.registerTool(
        "get_workspace",
        {
          title: "Get Cadence workspace",
          description:
            "Get the user's Cadence workspace: name, headline, timezone, current time, weekly posting goal, progress this week, whether LinkedIn is connected, and writing guidelines. Call this first in a session.",
          inputSchema: z.object({}),
        },
        async () =>
          guard(async () => {
            const [stats, acct] = await Promise.all([weekStats(user.id), getAccount(user.id)]);
            return {
              account: accountLabel(user),
              name: user.name,
              headline: user.headline,
              timezone: user.timezone,
              now_utc: new Date().toISOString(),
              now_local: new Date().toLocaleString("en-GB", { timeZone: user.timezone, dateStyle: "full", timeStyle: "short" }),
              weekly_goal: user.weekly_goal,
              this_week: stats,
              linkedin_connected: Boolean(acct),
              app_url: `${appUrl()}/app`,
              content_pillars: PILLARS,
              writing_guidelines: [
                `Max ${MAX_CHARS} characters.`,
                `LinkedIn cuts posts with "…see more" after ~${FOLD_CHARS} characters / 3 lines, so the hook must land before that.`,
                "Plain text only (no markdown). Use short lines and blank lines between ideas.",
                "Posts are saved as drafts for the user to review and edit in Cadence unless they explicitly ask to schedule.",
              ],
            };
          }),
      );

      server.registerTool(
        "create_post",
        {
          title: "Create LinkedIn post",
          description:
            "Save a finished LinkedIn post into the user's Cadence studio. Use this when the user says to save / draft / schedule the post (show them the final text in chat first). By default it is saved as a DRAFT so the user can review and edit it in the app. Pass schedule_at only if the user asked to schedule it. Returns the post and an edit_url to share with the user.",
          inputSchema: z.object({
            body: z.string().min(1).describe("Full post text exactly as it should appear on LinkedIn. Plain text, no markdown."),
            title: z.string().optional().describe("Short internal title for the user's board (not posted)."),
            pillar: z.string().optional().describe(`Content pillar. ${pillarHint}`),
            image_url: z.string().optional().describe("Optional public https URL of an image to attach (PNG/JPG/GIF/WebP, under 5 MB)."),
            schedule_at: z.string().optional().describe(`Optional publish time. ${whenHint}`),
          }),
        },
        async (a) =>
          guard(async () => {
            const imageId = a.image_url ? await importImageFromUrl(user.id, a.image_url) : null;
            const p = await createPost(user.id, { body: a.body, title: a.title, pillar: a.pillar, imageId, scheduleAt: a.schedule_at, source: "claude" });
            return { message: p.status === "scheduled" ? `Scheduled in ${accountLabel(user)}. Tell the user it will auto-publish, mention which account it went to, and share edit_url: ${appUrl()}/app/posts/${p.id}` : `Draft saved to ${accountLabel(user)}. Tell the user which account it was saved to and give them this link to review, edit and schedule it: ${appUrl()}/app/posts/${p.id}`, post: fmt(p) };
          }),
      );

      server.registerTool(
        "update_post",
        {
          title: "Update LinkedIn post",
          description:
            "Rewrite or adjust an existing draft or scheduled post (e.g. after the user asks for changes). Always call get_post first so you don't overwrite edits the user made in the app.",
          inputSchema: z.object({
            id: z.string().describe("Post id"),
            body: z.string().optional().describe("New full post text."),
            title: z.string().optional(),
            pillar: z.string().optional().describe(pillarHint),
          }),
        },
        async (a) =>
          guard(async () => ({
            message: "Post updated.",
            post: fmt(await updatePost(user.id, a.id, { body: a.body, title: a.title, pillar: a.pillar, byClaude: true })),
          })),
      );

      server.registerTool(
        "get_post",
        {
          title: "Get LinkedIn post",
          description: "Get one post with its current text (including any edits the user made in the app).",
          inputSchema: z.object({ id: z.string() }),
        },
        async ({ id }) =>
          guard(async () => {
            const p = await getPost(user.id, id);
            if (!p) throw new PostError("Post not found.");
            return { ...fmt(p), edited_by_user_in_app: p.original_body !== null && p.original_body !== p.body };
          }),
      );

      server.registerTool(
        "list_posts",
        {
          title: "List LinkedIn posts",
          description: "List the user's posts, newest first. Filter by status to find drafts, scheduled, posted or failed posts.",
          inputSchema: z.object({
            status: z.enum(["all", "draft", "scheduled", "posted", "failed"]).optional().default("all"),
            limit: z.number().int().min(1).max(50).optional().default(20),
          }),
        },
        async ({ status, limit }) =>
          guard(async () => {
            const posts = await listPosts(user.id, status, limit);
            return posts.map((p) => ({ ...fmt(p), body: p.body.slice(0, 280) + (p.body.length > 280 ? "…" : "") }));
          }),
      );

      server.registerTool(
        "schedule_post",
        {
          title: "Schedule LinkedIn post",
          description:
            "Schedule a post to publish automatically on LinkedIn at a given time, or pass schedule_at = null to unschedule it back to a draft. Use get_calendar first to avoid stacking posts on the same day.",
          inputSchema: z.object({
            id: z.string(),
            schedule_at: z.string().nullable().describe(`${whenHint} Use null to unschedule.`),
          }),
        },
        async ({ id, schedule_at }) =>
          guard(async () => {
            const p = await schedulePost(user.id, id, schedule_at);
            return { message: p.status === "scheduled" ? "Scheduled." : "Moved back to drafts.", post: fmt(p) };
          }),
      );

      server.registerTool(
        "get_calendar",
        {
          title: "Get posting calendar",
          description:
            "Get scheduled and published posts between two dates. Use it to plan a content week: see which days are already booked and which pillars are over/under-used.",
          inputSchema: z.object({
            from: z.string().describe("Start date-time (ISO 8601)."),
            to: z.string().describe("End date-time (ISO 8601)."),
          }),
        },
        async ({ from, to }) =>
          guard(async () => {
            const f = new Date(from), t = new Date(to);
            if (isNaN(f.getTime()) || isNaN(t.getTime())) throw new PostError("from/to must be valid ISO dates.");
            const posts = await calendar(user.id, f, t);
            return posts.map((p) => ({ id: p.id, title: p.title, pillar: p.pillar, status: p.status, at: p.scheduled_at ?? p.posted_at }));
          }),
      );

      server.registerTool(
        "publish_post_now",
        {
          title: "Publish post now",
          description:
            "Immediately publish a post to the user's LinkedIn. ONLY call this when the user explicitly says to post it right now — otherwise save a draft and let them publish from the app. If LinkedIn isn't connected, Cadence records a simulated (demo) publish.",
          inputSchema: z.object({ id: z.string() }),
        },
        async ({ id }) =>
          guard(async () => {
            const p = await publishPost(user.id, id);
            if (p.status === "failed") throw new PostError(p.error || "Publishing failed.");
            return { message: p.simulated ? "Published in demo mode (LinkedIn not connected)." : "Published to LinkedIn.", post: fmt(p) };
          }),
      );

      server.registerTool(
        "delete_post",
        {
          title: "Delete post",
          description: "Permanently delete a draft or scheduled post from Cadence. Confirm with the user first.",
          inputSchema: z.object({ id: z.string() }),
        },
        async ({ id }) =>
          guard(async () => {
            if (!(await deletePost(user.id, id))) throw new PostError("Post not found.");
            return { message: "Deleted." };
          }),
      );
    },
    {
      serverInfo: { name: "cadence", version: "1.1.0" },
      instructions:
        "Cadence is the user's LinkedIn post studio and scheduler. This connection is tied to ONE Cadence account (see get_workspace.account); every post is saved there. Whenever you save, schedule or publish, tell the user which Cadence account it went to. Help the user write and refine posts in the chat first. Show the final post text in the conversation and save it with create_post only when the user asks to save, draft, schedule or post it. After saving, share the edit_url so they can polish it in Cadence. Before updating a post, call get_post so you don't overwrite edits the user made in the app. Only call publish_post_now when the user explicitly says to post right now.",
    },
  );
}
