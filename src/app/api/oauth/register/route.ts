import { CORS, oauthErrorResponse, registerClient } from "@/lib/oauth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    return Response.json(await registerClient(body), { status: 201, headers: CORS });
  } catch (e) {
    return oauthErrorResponse(e);
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
