import { sql } from "@/lib/db";
import { runDue } from "@/lib/publish";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function authorized(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  const token = auth.slice(7);
  if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) return true;
  // Supabase pg_cron authenticates with a secret that lives only in the database.
  const [row] = await sql<{ value: string }[]>`select value from app_secrets where key = 'cron'`;
  return Boolean(row && token === row.value);
}

async function handle(req: Request) {
  if (!(await authorized(req))) return new Response("Unauthorized", { status: 401 });
  const results = await runDue();
  return Response.json({ ran_at: new Date().toISOString(), results });
}

export { handle as GET, handle as POST };
