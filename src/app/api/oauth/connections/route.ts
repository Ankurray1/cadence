import { revokeClient } from "@/lib/oauth";
import { json, withUser } from "../../_util";

export async function DELETE(req: Request) {
  return withUser(async (u) => {
    const { client_id } = await req.json();
    await revokeClient(u.id, String(client_id || ""));
    return json({ ok: true });
  });
}
