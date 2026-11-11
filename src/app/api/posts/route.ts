import { createPost, listPosts } from "@/lib/posts";
import { json, withUser } from "../_util";

export async function GET() {
  return withUser(async (u) => json(await listPosts(u.id)));
}

export async function POST(req: Request) {
  return withUser(async (u) => {
    const b = await req.json();
    const p = await createPost(u.id, { body: b.body ?? "", title: b.title || "Untitled draft", pillar: b.pillar, source: "app" });
    return json(p, 201);
  });
}
