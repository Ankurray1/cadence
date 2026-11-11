import { publishPost } from "@/lib/publish";
import { json, withUser } from "../../../_util";

export const maxDuration = 60;

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withUser(async (u) => json(await publishPost(u.id, id)));
}
