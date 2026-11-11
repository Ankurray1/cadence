import { ArrowLeftRight, CalendarClock, Check, FilePenLine, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { SignInPanel } from "@/components/AuthForm";
import { ClaudeMark, LinkedInMark, LogoMark } from "@/components/Logo";
import { Avatar } from "@/components/Sidebar";
import { getUser } from "@/lib/auth";
import { parseAuthRequest, redirectWith } from "@/lib/authorize";
import { getAccount, linkedinConfigured } from "@/lib/linkedin";
import { sql } from "@/lib/db";
import { googleConfigured } from "@/lib/google";

export const dynamic = "force-dynamic";

export default async function AuthorizePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const parsed = await parseAuthRequest(sp);
  if ("fatal" in parsed)
    return (
      <AuthShell>
        <h1 className="font-display text-xl font-bold">Can’t connect</h1>
        <p className="mt-2 text-muted">{parsed.fatal}</p>
      </AuthShell>
    );
  if ("redirectError" in parsed) redirect(redirectWith(parsed.redirectUri, { error: parsed.redirectError, state: parsed.state }));

  const user = await getUser();
  // Never assume the browser's current Cadence session is the account the person wants Claude to use:
  // the Connect window always starts with a sign-in, and only after that shows a confirmation.
  const params = new URLSearchParams(
    Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === "string" && !["li_error", "auth_error", "signed_in"].includes(e[0])),
  );
  const here = `/oauth/authorize?${params}`;
  const afterSignIn = `${here}&signed_in=1`;
  const freshlySignedIn = sp.signed_in === "1";
  const appName = parsed.req.client.client_name || "Claude";
  const isClaude = /claude/i.test(appName) || parsed.req.redirectUri.includes("claude.ai");

  const header = (
    <div className="mb-6 flex items-center gap-3">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-claude-soft text-claude"><ClaudeMark className="h-6 w-6" /></span>
      <span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-1 w-1 rounded-full bg-line-strong" />)}</span>
      <LogoMark className="h-12 w-12 rounded-2xl" />
    </div>
  );

  if (!user || !freshlySignedIn)
    return (
      <AuthShell wide>
        {header}
        <SignInPanel
          next={afterSignIn}
          linkedinMode="switch"
          linkedinEnabled={linkedinConfigured()}
          googleEnabled={googleConfigured()}
          liError={sp.li_error ?? sp.auth_error}
          title={`Connect ${isClaude ? "Claude" : appName} to Cadence`}
          subtitle={`Sign in with the Cadence account you want ${isClaude ? "Claude" : appName} to save to, or create a new one. Everything Claude saves will go to that account.`}
        />
      </AuthShell>
    );

  const [acct, [counts]] = await Promise.all([
    getAccount(user.id),
    sql<{ posts: number }[]>`select count(*)::int as posts from posts where user_id = ${user.id}`,
  ]);

  return (
    <AuthShell wide>
      {header}
      <div className="eyebrow">Last step · Confirm</div>
      <h1 className="mt-2 font-display text-[30px] leading-tight font-bold">Allow {isClaude ? "Claude" : appName} to save to your account?</h1>
      <p className="mt-2 text-[15px] text-muted">
        Everything you save from {isClaude ? "Claude" : appName} will go to the account below, and only that account.
      </p>

      {/* The account Claude will save to */}
      <div className={`mt-6 rounded-3xl border-2 p-5 ${user.is_demo ? "border-warn/40 bg-warn-soft/50" : "border-brand/30 bg-brand-soft/40"}`}>
        <div className="text-[12px] font-semibold tracking-wide text-muted uppercase">You signed in as</div>
        <div className="mt-3 flex items-center gap-3">
          <Avatar name={user.name} src={acct?.picture ?? null} size={48} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-lg font-bold">{user.name}</div>
            <div className="truncate text-[14px] text-ink-2">{user.email}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="chip bg-surface text-ink-2">{counts.posts} post{counts.posts === 1 ? "" : "s"} in this workspace</span>
          {user.is_demo ? (
            <span className="chip bg-warn-soft text-warn">Shared demo account · publishing simulated</span>
          ) : acct ? (
            <span className="chip bg-success-soft text-success"><LinkedInMark className="h-3 w-3" /> Posts as {acct.name}</span>
          ) : (
            <span className="chip bg-surface text-muted">LinkedIn not connected yet</span>
          )}
        </div>
        {user.is_demo && (
          <p className="mt-3 text-[13px] text-warn">This is the shared demo account. To save to your own workspace, use a different account.</p>
        )}
      </div>

      <form action="/api/auth/logout" method="post" className="mt-3">
        <input type="hidden" name="next" value={here} />
        <button className="flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:underline">
          <ArrowLeftRight className="h-3.5 w-3.5" /> Signed in with the wrong account? Switch
        </button>
      </form>

      <ul className="my-6 space-y-3 rounded-2xl bg-canvas p-4 text-[13px]">
        {[
          [FilePenLine, "Save, read and update your LinkedIn post drafts"],
          [CalendarClock, "See your calendar and schedule posts"],
          [Check, "Publish a post only when you explicitly ask"],
        ].map(([Icon, t]) => {
          const I = Icon as typeof Check;
          return (
            <li key={t as string} className="flex items-start gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-surface text-brand shadow-[var(--shadow-soft)]"><I className="h-3.5 w-3.5" /></span>
              <span className="pt-0.5 text-ink-2">{t as string}</span>
            </li>
          );
        })}
      </ul>
      <form action="/api/oauth/authorize" method="post" className="grid grid-cols-2 gap-2">
        {[...params.entries()].map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <button name="decision" value="deny" className="btn-secondary h-12">Cancel</button>
        <button name="decision" value="allow" className="btn-brand h-12" autoFocus>Allow</button>
      </form>
      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-faint">
        <ShieldCheck className="h-3.5 w-3.5" /> You can disconnect anytime in Cadence Settings or in Claude.
      </p>
    </AuthShell>
  );
}
