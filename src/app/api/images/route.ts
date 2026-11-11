import { saveImage } from "@/lib/posts";
import { json, withUser } from "../_util";

export async function POST(req: Request) {
  return withUser(async (u) => {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "No file" }, 400);
    const id = await saveImage(u.id, file.type, Buffer.from(await file.arrayBuffer()));
    return json({ id });
  });
}
