import { requireUser } from "@/lib/auth";
import { getAccount, linkedinConfigured } from "@/lib/linkedin";
import { connectedApps } from "@/lib/oauth";
import { ClaudeMark, LinkedInMark } from "@/components/Logo";
import { ConnectSteps } from "@/components/ConnectClaude";
import { DisconnectApp, LinkedInActions, ProfileForm } from "@/components/SettingsClient";
import { relative } from "@/lib/format";
import { Avatar } from "@/components/Sidebar";

export const dynamic = "force-dynamic";

const LI_MSG: Record<string, string> = {
  denied: "LinkedIn connection was cancelled.",
  expired: "The LinkedIn sign-in took too long. Please try again.",
  failed: "Couldn’t connect LinkedIn. Please try again.",
  not_configured: "LinkedIn posting isn’t enabled on this server yet — you can keep using demo mode.",
};

function Section({ id, icon, title, desc, children }: { id: string; icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-6 overflow-hidden">
      <div className="flex items-start gap-3 border-b border-line px-6 py-5">
        {icon}
        <div>
          <h2 className="font-display text-base font-bold">{title}</h2>
          <p className="text-[13px] text-muted">{desc}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ li_error?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [acct, apps] = await Promise.all([getAccount(user.id), connectedApps(user.id)]);
  const expired = acct && new Date(acct.expires_at).getTime() < Date.now();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-8 sm:py-10">
      <header>
        <h1 className="font-display text-[28px] font-bold">Settings</h1>
        <p className="mt-1 text-muted">Claude writes, LinkedIn publishes. Cadence connects the two.</p>
      </header>

      {/* How the three accounts relate */}
      <section className="card p-6">
        <div className="eyebrow">How your accounts connect</div>
        <div className="mt-4 grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <div className="rounded-2xl bg-claude-soft/60 p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-claude"><ClaudeMark className="h-4 w-4" /> Claude</div>
            <div className="mt-2 text-[13px] text-ink-2">{apps.length ? "Connected to this Cadence account" : "Not connected yet"}</div>
            <div className="mt-1 text-[12px] text-muted">Whichever Claude login you use, Claude saves here once you connect it to this account.</div>
          </div>
          <div className="hidden place-items-center text-faint sm:grid">→</div>
          <div className="rounded-2xl border-2 border-brand/30 bg-brand-soft/50 p-4">
            <div className="text-[13px] font-semibold text-brand-ink">Cadence · this account</div>
            <div className="mt-2 truncate text-[14px] font-semibold">{user.name}</div>
            <div className="truncate text-[12px] text-muted">{user.email}</div>
          </div>
          <div className="hidden place-items-center text-faint sm:grid">→</div>
          <div className="rounded-2xl bg-linkedin-soft/70 p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-linkedin"><LinkedInMark className="h-4 w-4" /> LinkedIn</div>
            <div className="mt-2 text-[13px] text-ink-2">{user.is_demo ? "Demo mode (simulated)" : acct ? `Posts as ${acct.name}` : "Not connected yet"}</div>
            <div className="mt-1 text-[12px] text-muted">Where this account’s posts are published.</div>
          </div>
        </div>
        <p className="mt-4 text-[13px] text-muted">
          One rule: <b className="text-ink-2">the Cadence account you sign in with when you click “Connect” in Claude is where Claude saves.</b> To make Claude save to a different account, disconnect Cadence in Claude and connect again while signed in to that account.
        </p>
      </section>
      {sp.li_error && LI_MSG[sp.li_error] && (
        <div className="rounded-xl border border-warn/20 bg-warn-soft px-4 py-3 text-[13px] text-warn">{LI_MSG[sp.li_error]}</div>
      )}

      <Section
        id="claude"
        icon={<span className="grid h-10 w-10 place-items-center rounded-xl bg-claude-soft text-claude"><ClaudeMark className="h-5 w-5" /></span>}
        title="Claude"
        desc={apps.length ? `Claude saves to this account: ${user.name} (${user.email}).` : "Connect once and Claude can save posts straight into this account."}
      >
        {apps.length > 0 ? (
          <div className="space-y-3">
            {apps.map((a) => (
              <div key={a.client_id} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-success" />
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{a.client_name || "Claude"} → saves to {user.email}</div>
                  <div className="text-xs text-muted">Connected {relative(a.created_at)}{a.last_used_at ? ` · last used ${relative(a.last_used_at)}` : ""}</div>
                </div>
                <DisconnectApp clientId={a.client_id} />
              </div>
            ))}
            <details className="pt-2">
              <summary className="cursor-pointer text-[13px] font-medium text-muted hover:text-ink">Set up on another device</summary>
              <div className="pt-4"><ConnectSteps /></div>
            </details>
          </div>
        ) : (
          <ConnectSteps />
        )}
      </Section>

      <Section
        id="linkedin"
        icon={<span className="grid h-10 w-10 place-items-center rounded-xl bg-linkedin-soft text-linkedin"><LinkedInMark className="h-5 w-5" /></span>}
        title="LinkedIn"
        desc="Cadence can only publish posts you schedule. It can’t read your feed, messages or connections."
      >
        {user.is_demo ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-warn-soft px-4 py-3 text-[13px] text-warn">
              This is the shared <b>demo account</b>, so publishing is always simulated and it can’t connect a real LinkedIn.
            </div>
            <p className="text-[13px] text-muted">
              To post for real, log out and choose <b className="text-ink-2">Continue with LinkedIn</b>. You’ll get your own workspace.
            </p>
          </div>
        ) : acct && !expired ? (
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name={acct.name || user.name} src={acct.picture} size={40} />
            <div className="flex-1">
              <div className="text-[13px] font-medium">Posting as {acct.name}</div>
              <div className="text-xs text-muted">Connected · renews by {new Date(acct.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} (LinkedIn asks every 60 days)</div>
            </div>
            <LinkedInActions connected configured={linkedinConfigured()} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-warn-soft px-4 py-3 text-[13px] text-warn">
              {expired ? "Your LinkedIn access expired. Reconnect to keep scheduled posts going." : "You’re in demo mode: everything works, but publishing is simulated."}
            </div>
            <LinkedInActions connected={false} configured={linkedinConfigured()} />
          </div>
        )}
      </Section>

      <Section id="profile" icon={<Avatar name={user.name} src={acct?.picture ?? null} size={40} />} title="Profile & goals" desc="Used in the post preview and shared with Claude to plan your week.">
        <ProfileForm user={{ name: user.name, headline: user.headline, weekly_goal: user.weekly_goal, timezone: user.timezone }} />
      </Section>
    </div>
  );
}
