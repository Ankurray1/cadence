"use client";

import { ArrowUpRight, CalendarClock, Check, ChevronDown, Eye, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClaudeMark, LinkedInMark, LogoMark } from "../Logo";
import { CopyField } from "../ui/CopyButton";
import { ClaudeConnectDemo } from "./ClaudeConnectDemo";
import { PromptPlayground } from "./PromptPlayground";

type Props = {
  firstName: string;
  linkedin: { done: boolean; name: string | null; picture: string | null };
  claude: boolean;
  firstPost: boolean;
  isDemo: boolean;
  mcpUrl: string;
};

/** Re-check the server every few seconds while we're waiting for something to happen outside Cadence (in Claude). */
function useLiveRefresh(enabled: boolean) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 6000);
    return () => clearInterval(t);
  }, [enabled, router]);
}

function StepShell({
  n, title, sub, done, active, locked, onToggle, open, children, doneNote,
}: {
  n: number; title: string; sub: string; done: boolean; active: boolean; locked?: boolean; onToggle: () => void; open: boolean; children: React.ReactNode; doneNote?: React.ReactNode;
}) {
  return (
    <section className={`overflow-hidden rounded-[28px] border transition ${open ? "border-brand/25 bg-surface shadow-[var(--shadow-lift)]" : "border-line bg-surface/70 hover:bg-surface"}`}>
      <button onClick={onToggle} className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold transition ${done ? "bg-success text-white" : active ? "bg-brand text-white ring-4 ring-brand/15" : "bg-hover text-muted"}`}>
          {done ? <Check className="h-5 w-5" strokeWidth={3} /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-display text-[18px] font-bold ${done ? "text-muted" : ""}`}>{title}</span>
            {done ? <span className="chip bg-success-soft text-success">Done</span> : active ? <span className="chip bg-brand-soft text-brand-ink">Up next</span> : locked ? <span className="chip bg-hover text-muted"><Lock className="h-3 w-3" /> After step {n - 1}</span> : null}
          </div>
          <div className="truncate text-[13px] text-muted">{done && doneNote ? doneNote : sub}</div>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-faint transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="animate-fade-up border-t border-line px-5 py-6 sm:px-6">{children}</div>}
    </section>
  );
}

/**
 * If Claude already had Cadence connected to ANOTHER Cadence account, clicking Connect in Claude
 * silently reuses that connection, so this account never ticks. Explain the fix after a short wait.
 */
function StuckHelp({ firstName }: { firstName: string }) {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 20000);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="animate-fade-up mt-3 rounded-2xl border border-apricot/40 bg-apricot-soft/60 text-[13px]">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-semibold text-[#9a4d12]">
        Claude says “Connected” but this hasn’t ticked?
        <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-2 border-t border-apricot/30 px-4 py-3 text-ink-2">
          <p>Claude is probably still linked to a <b>different Cadence account</b> from before, so it reused that connection instead of asking you to sign in.</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>In Claude → <b>Customize → Connectors</b>, open <b>Cadence</b> → <b>⋯</b> → <b>Remove</b>.</li>
            <li>Click <b>+ Add → Add custom connector</b> again, paste your Cadence link, click <b>Add</b>.</li>
            <li>Click <b>Connect</b>. On the Cadence screen, make sure the card says <b>{firstName}</b>. If not, click “Use a different one”.</li>
          </ol>
        </div>
      )}
    </div>
  );
}

export function SetupHero({ firstName, linkedin, claude, firstPost, isDemo, mcpUrl }: Props) {
  const steps = [linkedin.done, claude, firstPost];
  const done = steps.filter(Boolean).length;
  const current = steps.findIndex((s) => !s); // 0,1,2 (or -1 when complete)
  const [open, setOpen] = useState<number>(current === -1 ? 2 : current);
  const [going, setGoing] = useState(false);
  useLiveRefresh(!claude || !firstPost);

  // When a step completes in the background (e.g. Claude connected), move to the next one.
  useEffect(() => { if (current !== -1) setOpen(current); }, [current]);

  const headline =
    current === 0
      ? { eyebrow: `Welcome, ${firstName}`, title: "Let’s get you posting in two minutes.", sub: "Three quick steps: connect LinkedIn, connect Claude, send your first prompt." }
      : current === 1
        ? { eyebrow: linkedin.done && !isDemo ? "LinkedIn connected ✓" : "Almost there", title: `You’re one step away, ${firstName}.`, sub: "Connect Claude so it can write and save posts straight into Cadence." }
        : { eyebrow: "Everything’s connected", title: "Now send your first prompt.", sub: "Pick a prompt, paste it into Claude, and watch it land in your drafts." };

  return (
    <div className="space-y-4">
      {/* Banner: calm white card with a single progress accent */}
      <section className="card relative overflow-hidden p-7 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="eyebrow">{headline.eyebrow}</div>
            <h2 className="mt-2 font-display text-[30px] leading-[1.1] font-bold sm:text-[36px]">{headline.title}</h2>
            <p className="mt-2 text-[15px] text-muted">{headline.sub}</p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-line bg-canvas px-4 py-3">
            <div className="relative grid h-16 w-16 place-items-center">
              <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-line)" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-brand)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(done / 3) * 97.4} 97.4`} className="transition-all duration-700" />
              </svg>
              <span className="font-display text-lg font-bold">{done}/3</span>
            </div>
            <div className="space-y-1.5 text-[13px]">
              {[
                ["LinkedIn", linkedin.done],
                ["Claude", claude],
                ["First post", firstPost],
              ].map(([l, ok]) => (
                <div key={l as string} className={`flex items-center gap-2 ${ok ? "text-ink" : "text-muted"}`}>
                  <span className={`grid h-4 w-4 place-items-center rounded-full ${ok ? "bg-success text-white" : "border border-line-strong"}`}>{ok && <Check className="h-3 w-3" strokeWidth={3} />}</span>
                  {l as string}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Step 1: LinkedIn */}
      <StepShell
        n={1}
        title="Connect LinkedIn"
        sub="So Cadence can publish your posts on time, as you."
        done={linkedin.done}
        active={current === 0}
        open={open === 0}
        onToggle={() => setOpen(open === 0 ? -1 : 0)}
        doneNote={isDemo ? "Demo account: publishing is simulated" : <span className="inline-flex items-center gap-1.5"><LinkedInMark className="h-3.5 w-3.5 text-linkedin" /> Publishing as {linkedin.name}</span>}
      >
        {linkedin.done ? (
          <div className="flex items-center gap-4">
            {linkedin.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={linkedin.picture} alt="" className="h-14 w-14 rounded-full object-cover ring-4 ring-success-soft" />
            ) : (
              <span className="grid h-14 w-14 place-items-center rounded-full bg-linkedin-soft text-linkedin"><LinkedInMark className="h-6 w-6" /></span>
            )}
            <div>
              <div className="font-display text-lg font-bold">{isDemo ? "Demo mode" : `Connected as ${linkedin.name}`}</div>
              <div className="text-[14px] text-muted">{isDemo ? "This shared account simulates publishing." : "Nothing to do here. Your posts will publish to this profile."}</div>
            </div>
          </div>
        ) : (
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_340px]">
            <div>
              <ul className="space-y-3 text-[15px]">
                {[
                  [CalendarClock, "Publishes your scheduled posts on time, even when your laptop is closed"],
                  [Eye, "Shows your real name and photo in the live post preview"],
                  [ShieldCheck, "Can only post what you approve. It can’t read your feed or messages"],
                ].map(([Icon, t]) => {
                  const I = Icon as typeof Eye;
                  return (
                    <li key={t as string} className="flex items-start gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-linkedin-soft text-linkedin"><I className="h-4 w-4" /></span>
                      <span className="pt-1 text-ink-2">{t as string}</span>
                    </li>
                  );
                })}
              </ul>
              <a href="/api/auth/linkedin?next=/app" onClick={() => setGoing(true)} className="btn-linkedin mt-6 h-12 px-6 text-[15px]">
                {going ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkedInMark className="h-4 w-4" />} Connect LinkedIn
              </a>
              <p className="mt-2 text-[12px] text-muted">Takes 10 seconds on LinkedIn’s own secure page.</p>
            </div>
            {/* Mini LinkedIn consent mock */}
            <div className="relative mx-auto w-full max-w-[340px] rounded-3xl border border-line bg-canvas p-5">
              <div className="flex items-center justify-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-linkedin text-white"><LinkedInMark className="h-6 w-6" /></span>
                <span className="text-faint">⇄</span>
                <LogoMark className="h-12 w-12 rounded-2xl" />
              </div>
              <div className="mt-4 text-center text-[14px] font-semibold">Cadence would like to:</div>
              <ul className="mt-2 space-y-1 text-[12px] text-muted">
                <li>• Use your name and photo</li>
                <li>• Create posts on your behalf</li>
              </ul>
              <div className="mt-4 rounded-full bg-linkedin py-2 text-center text-[13px] font-semibold text-white">Allow</div>
              <span className="absolute -top-3 -right-3 chip h-7 bg-vivid px-3 text-[12px] font-semibold text-white shadow">You’ll see this</span>
            </div>
          </div>
        )}
      </StepShell>

      {/* Step 2: Claude */}
      <StepShell
        n={2}
        title="Connect Claude"
        sub="Two steps: copy one link, paste it in Claude."
        done={claude}
        active={current === 1}
        locked={!linkedin.done}
        open={open === 1}
        onToggle={() => setOpen(open === 1 ? -1 : 1)}
        doneNote={<span className="inline-flex items-center gap-1.5"><ClaudeMark className="h-3.5 w-3.5 text-claude" /> Claude saves to this account</span>}
      >
        {claude ? (
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-claude-soft text-claude ring-4 ring-success-soft"><ClaudeMark className="h-6 w-6" /></span>
            <div>
              <div className="font-display text-lg font-bold">Claude is connected</div>
              <div className="text-[14px] text-muted">Anything you ask Claude to save goes straight into this workspace.</div>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <div className="space-y-5">
                <div className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-vivid font-display text-sm font-bold text-white">A</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">Copy your Cadence link</div>
                    <div className="mt-2"><CopyField value={mcpUrl} label="Copy link" /></div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-vivid font-display text-sm font-bold text-white">B</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">Paste it in Claude</div>
                    <ol className="mt-2 space-y-1.5 text-[14px] text-ink-2">
                      <li><span className="text-muted">1.</span> Claude → <b>Customize → Connectors</b></li>
                      <li><span className="text-muted">2.</span> <b>+ Add → Add custom connector</b>, name it <b>Cadence</b>, paste the link, click <b>Add</b></li>
                      <li><span className="text-muted">3.</span> Click <b>Connect</b> and confirm <b>{firstName}’s</b> account</li>
                    </ol>
                    <a href="https://claude.ai/settings/connectors" target="_blank" rel="noreferrer" className="btn-primary mt-4 h-11 px-5">
                      <ClaudeMark className="h-4 w-4" /> Open Claude settings <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2.5 rounded-2xl bg-brand-soft/60 px-4 py-3 text-[13px] text-brand-ink">
                <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" /></span>
                Waiting for Claude… this step ticks itself off once you click Connect.
              </div>
              <StuckHelp firstName={firstName} />
              <p className="mt-3 text-[12px] text-muted">On Claude’s Free plan you can add one custom connector, so remove any old one first.</p>
            </div>
            <ClaudeConnectDemo mcpUrl={mcpUrl} firstName={firstName} />
          </div>
        )}
      </StepShell>

      {/* Step 3: First prompt */}
      <StepShell
        n={3}
        title="Send your first prompt"
        sub="Claude writes it with you and saves it here as a draft."
        done={firstPost}
        active={current === 2}
        locked={!claude}
        open={open === 2}
        onToggle={() => setOpen(open === 2 ? -1 : 2)}
      >
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <PromptPlayground />
          <div className="space-y-4 text-[14px] text-ink-2">
            {[
              ["1", "Pick a prompt and click Open in Claude (or copy and paste it)."],
              ["2", "Chat with Claude until the post feels right. It shows you the final version."],
              ["3", "Say “save it to Cadence”. The draft appears here within seconds, ready to polish and schedule."],
            ].map(([n, t]) => (
              <div key={n} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-apricot-soft text-[13px] font-bold text-[#9a4d12]">{n}</span>
                <span className="pt-0.5">{t}</span>
              </div>
            ))}
            {!claude && <p className="rounded-2xl bg-warn-soft px-4 py-3 text-[13px] text-warn">Connect Claude first (step 2), or Claude won’t be able to save to Cadence.</p>}
          </div>
        </div>
      </StepShell>
    </div>
  );
}
