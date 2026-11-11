import { deletePost, getPost, schedulePost, updatePost } from "@/lib/posts";
import { json, withUser } from "../../_util";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return withUser(async (u) => {
    const p = await getPost(u.id, id);
    return p ? json(p) : json({ error: "Not found" }, 404);
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return withUser(async (u) => {
    const b = await req.json();
    let p = await updatePost(u.id, id, { body: b.body, title: b.title, pillar: b.pillar, imageId: b.image_id });
    if ("scheduled_at" in b) p = await schedulePost(u.id, id, b.scheduled_at);
    return json(p);
  });
}

export async function DELETE(_: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return withUser(async (u) => json({ ok: await deletePost(u.id, id) }));
}
