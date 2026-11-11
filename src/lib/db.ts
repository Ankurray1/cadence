import postgres from "postgres";

declare global {
  var __cadenceSql: ReturnType<typeof postgres> | undefined;
}

/**
 * Supabase transaction pooler (port 6543): built for serverless, shares a few database
 * connections across thousands of short-lived clients.
 *  - max_pipeline: 1 — Supavisor's transaction mode hangs on pipelined queries
 *    (documented in the postgres.js README), so never send more than one at a time per connection.
 *  - query_timeout — if the pooler ever stops answering, fail fast instead of hanging the page.
 *  - fetch_types: false — skips a type-lookup round trip on every cold connection.
 */
const url = (process.env.DATABASE_URL || "").replace(/\.pooler\.supabase\.com:5432\//, ".pooler.supabase.com:6543/");

export const sql =
  globalThis.__cadenceSql ??
  postgres(url, {
    prepare: false,
    max: 6,
    max_pipeline: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    query_timeout: 15,
    fetch_types: false,
    connection: { search_path: "cadence, extensions, public" },
  } as Parameters<typeof postgres>[1]);

globalThis.__cadenceSql = sql;
