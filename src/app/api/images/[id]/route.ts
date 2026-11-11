import { sql } from "@/lib/db";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const [img] = await sql<{ mime: string; data: Buffer }[]>`select mime, data from images where id = ${id}`;
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: { "Content-Type": img.mime, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
