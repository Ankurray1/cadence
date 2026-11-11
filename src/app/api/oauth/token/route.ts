import { CORS, OAuthError, exchangeAuthCode, oauthErrorResponse, refreshTokens } from "@/lib/oauth";

async function readForm(req: Request) {
  const type = req.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    const j = await req.json().catch(() => ({}));
    return new URLSearchParams(Object.entries(j).map(([k, v]) => [k, String(v)]));
  }
  return new URLSearchParams(await req.text());
}

export async function POST(req: Request) {
  try {
    const f = await readForm(req);
    const grant = f.get("grant_type");
    const body =
      grant === "authorization_code"
        ? await exchangeAuthCode(f)
        : grant === "refresh_token"
          ? await refreshTokens(f)
          : (() => {
              throw new OAuthError("unsupported_grant_type", "Unsupported grant_type");
            })();
    return Response.json(body, { headers: { ...CORS, "Cache-Control": "no-store" } });
  } catch (e) {
    return oauthErrorResponse(e);
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
