import { buildMcpHandler } from "@/lib/mcp";
import { CORS, baseUrl, userFromAccessToken } from "@/lib/oauth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Public MCP endpoint. Anyone can add this one URL to Claude; Claude then runs the
 * standard MCP OAuth flow (Connect → sign in to Cadence → Allow) to get a token.
 */
async function handle(req: Request) {
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const user = await userFromAccessToken(bearer);
  if (!user) {
    return new Response(JSON.stringify({ error: "unauthorized", error_description: "Sign in to Cadence to continue." }), {
      status: 401,
      headers: {
        ...CORS,
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer resource_metadata="${baseUrl()}/.well-known/oauth-protected-resource/api/mcp", scope="posts"`,
      },
    });
  }
  const res = await buildMcpHandler(user)(req);
  return res;
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...CORS, "Access-Control-Expose-Headers": "WWW-Authenticate" } });
}

export { handle as GET, handle as POST, handle as DELETE };
