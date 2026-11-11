import { CORS, revokeToken } from "@/lib/oauth";

export async function POST(req: Request) {
  const f = new URLSearchParams(await req.text());
  const t = f.get("token");
  if (t) await revokeToken(t);
  return new Response(null, { status: 200, headers: CORS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
