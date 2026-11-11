import { userByMcpToken } from "@/lib/auth";
import { buildMcpHandler } from "@/lib/mcp";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Legacy personal-link connector (kept so existing connections keep working).
async function handle(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const user = await userByMcpToken(token);
  if (!user) return Response.json({ error: "Invalid link. Use https://cadence-for-claude.vercel.app/api/mcp instead." }, { status: 404 });
  return buildMcpHandler(user)(req);
}

export { handle as GET, handle as POST, handle as DELETE };
