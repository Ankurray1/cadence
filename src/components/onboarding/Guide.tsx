import { ArrowRight, Check, CircleCheck, Cpu, Globe2, MessageSquareText, MousePointerClick, PenLine, Plug, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { ClaudeMark, LinkedInMark } from "../Logo";
import { CopyField, CopyPrompt } from "../ui/CopyButton";
import { FIRST_PROMPT, MCP_URL } from "../ConnectClaude";
import type { Onboarding } from "@/lib/onboarding";

/* ---------- small building blocks (Volopay assignment format) ---------- */

export function StatusPill({ done, label }: { done: boolean; label?: string }) {
  return done ? (
    <span className="chip bg-success-soft text-success"><Check className="h-3 w-3" strokeWidth={3} /> {label ?? "Done"}</span>
  ) : (
    <span className="chip bg-apricot-soft text-[#9a4d12]">{label ?? "To do"}</span>
  );
}

function Row({ n, title, desc, meta, children }: { n: number; title: string; desc?: React.ReactNode; meta?: string; children?: React.ReactNode }) {
  return (
    <li className="flex gap-4 border-b border-line py-5 last:border-b-0">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{n}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="font-semibold text-ink">{title}</div>
          {meta && <span className="shrink-0 text-[13px] font-semibold text-brand">{meta}</span>}
        </div>
        {desc && <div className="mt-1 text-[14px] leading-relaxed text-muted">{desc}</div>}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </li>
  );
}

function StepHeader({ step, title, done, sub }: { step: number; title: string; done: boolean; sub: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="eyebrow">Step {step}</div>
        <h2 className="mt-1 font-display text-[28px] font-bold leading-tight">{title}</h2>
        <p className="mt-1 text-[15px] text-muted">{sub}</p>
      </div>
      <StatusPill done={done} label={done ? "Connected" : "Not yet"} />
    </div>
  );
}

/* ---------- the full guide ---------- */

export function GuidePage({ state }: { state: Onboarding }) {
  const pct = Math.round((state.done / state.total) * 100);
  return (
    <div className="bg-surface">
      <div className="bar-gradient h-1.5 w-full" />
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-10 sm:py-14">
        {/* Header */}
        <div className="flex items-center justify-between text-[12px] font-medium tracking-wide text-muted uppercase">
          <span>Cadence</span>
          <span>Getting started / Setup guide</span>
        </div>
        <h1 className="mt-10 font-display text-[44px] leading-[1.05] font-bold sm:text-[56px]">
          Set up Cadence
          <br />
          in two minutes
        </h1>
        <p className="mt-4 max-w-2xl text-[17px] text-ink-2">
          Connect LinkedIn so Cadence can publish for you, connect Claude so it can write for you, then send your first prompt.
        </p>

        {/* Facts strip */}
        <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-3">
          {[
            ["Time", "About 2 minutes"],
            ["You need", "LinkedIn + any Claude plan"],
            ["AI inside Cadence", "None"],
          ].map(([k, v]) => (
            <div key={k} className="bg-canvas px-5 py-4">
              <div className="text-[12px] font-medium tracking-wide text-muted uppercase">{k}</div>
              <div className="mt-1 text-[17px] font-semibold">{v}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-line px-5 py-4">
          <div className="flex-1">
            <div className="flex justify-between text-[13px] font-medium"><span>Your progress</span><span className="text-brand">{state.done} of {state.total} done</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-hover">
              <div className="h-full rounded-full bg-gradient-to-r from-brand to-apricot transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {state.complete && <Link href="/app" className="btn-primary">Go to my studio <ArrowRight className="h-4 w-4" /></Link>}
        </div>

        {/* What is MCP */}
        <div className="mt-6 flex gap-4 rounded-2xl bg-brand-soft p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white"><Plug className="h-5 w-5" /></span>
          <p className="text-[15px] leading-relaxed text-ink-2">
            <b className="text-ink">How does Claude talk to Cadence?</b> Through a <b className="text-ink">connector</b> (MCP), a plug between Claude and an app. You add Cadence’s link to Claude once, and Claude can save, schedule and publish posts for you. Your own Claude plan does all the writing.
          </p>
        </div>

        {/* STEP 1 — LinkedIn */}
        <section className="mt-14">
          <StepHeader step={1} title="Connect your LinkedIn" done={state.linkedin} sub="So Cadence can publish posts to your profile, on time." />
          {state.isDemo ? (
            <div className="mt-5 rounded-2xl bg-warn-soft p-5 text-[14px] text-warn">
              This is the shared demo account, so publishing is simulated. To post for real, log out and choose <b>Continue with LinkedIn</b>.
            </div>
          ) : (
            <ol className="mt-4">
              <Row n={1} title="Click “Connect LinkedIn”" meta="10 sec" desc="You’ll go to LinkedIn’s own secure page. Sign in with your password, Google or Apple." />
              <Row n={2} title="Approve Cadence" meta="5 sec" desc="LinkedIn asks if Cadence can post on your behalf. Click Allow. Cadence can’t read your feed, messages or connections." />
              <Row n={3} title="You’re back in Cadence" meta="Done" desc="Your name and photo appear in the post preview. Scheduled posts now publish to your profile automatically.">
                {state.linkedin ? (
                  <StatusPill done label="LinkedIn connected" />
                ) : (
                  <a href="/api/auth/linkedin?next=/app/welcome" className="btn-linkedin"><LinkedInMark className="h-4 w-4" /> Connect LinkedIn</a>
                )}
              </Row>
            </ol>
          )}
        </section>

        {/* STEP 2 — Claude */}
        <section className="mt-14">
          <StepHeader step={2} title="Connect Claude" done={state.claude} sub="So you can say “save this to Cadence” in any Claude chat." />
          <ol className="mt-4">
            <Row n={1} title="Copy the Cadence connector link" meta="5 sec" desc="It’s the same link for everyone. Your login keeps your posts private.">
              <CopyField value={MCP_URL()} label="Copy link" />
            </Row>
            <Row n={2} title="Open Claude’s connector settings" meta="10 sec" desc={<>In <b className="text-ink-2">claude.ai</b> or the Claude desktop app, click your name (bottom-left), then <b className="text-ink-2">Settings → Connectors</b>.</>} />
            <Row n={3} title="Add a custom connector" meta="15 sec" desc={<>Click <b className="text-ink-2">Add custom connector</b>. Name: <b className="text-ink-2">Cadence</b>. URL: paste the link. Click <b className="text-ink-2">Add</b>. On the Free plan you can have one custom connector, so remove any old one first.</>} />
            <Row n={4} title="Click “Connect” and choose your Cadence account" meta="20 sec" desc={<>A Cadence window opens. <b className="text-ink-2">Sign in with the Cadence account you want Claude to save to</b> (this one: {state.email}). Check the account card, then click Connect. The window closes by itself.</>} />
            <Row n={5} title="Switch Cadence on in your chat" meta="5 sec" desc={<>In a new chat, click the <b className="text-ink-2">+</b> / tools icon under the message box and make sure <b className="text-ink-2">Cadence</b> is on.</>}>
              <StatusPill done={state.claude} label={state.claude ? "Claude connected" : "Waiting for Claude"} />
            </Row>
          </ol>
        </section>

        {/* STEP 3 — First prompt */}
        <section id="step-3" className="mt-14 scroll-mt-6">
          <StepHeader step={3} title="Send your first prompt" done={state.firstPost} sub="Claude writes it with you, then saves it to Cadence when you say so." />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <CopyPrompt text={FIRST_PROMPT} />
            <CopyPrompt text="Turn this rough idea into a LinkedIn post in my voice: [your idea]. Show me the final version, then schedule it in Cadence for tomorrow 9am." />
          </div>
        </section>

        {/* Big picture */}
        <section className="mt-16">
          <div className="eyebrow">The big picture</div>
          <h2 className="mt-1 font-display text-[28px] font-bold">How it works</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              { n: 1, icon: MessageSquareText, t: "You ask Claude", d: "“Write a post about my launch and save it to Cadence.”", tone: "bg-canvas" },
              { n: 2, icon: Sparkles, t: "Claude does the thinking", d: "Writes, refines and shows you the final post in chat.", tone: "bg-canvas" },
              { n: 3, icon: PenLine, t: "It lands in Cadence", d: "Polish it with the live LinkedIn preview.", tone: "bg-brand-soft" },
              { n: 4, icon: Globe2, t: "It goes live", d: "Cadence publishes on schedule, even after the chat ends.", tone: "bg-brand-soft" },
            ].map(({ n, icon: Icon, t, d, tone }) => (
              <div key={n} className={`rounded-2xl p-5 ${tone}`}>
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-semibold text-white">{n}</span>
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <div className="mt-4 font-semibold">{t}</div>
                <div className="mt-1 text-[14px] text-muted">{d}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-canvas p-5">
              <div className="flex items-center gap-2 font-semibold"><ClaudeMark className="h-4 w-4 text-claude" />Claude does</div>
              <p className="mt-1 text-[14px] text-muted">Thinking, writing, rewriting and planning. Paid for by your own Claude plan.</p>
            </div>
            <div className="rounded-2xl bg-brand-soft p-5">
              <div className="flex items-center gap-2 font-semibold"><Cpu className="h-4 w-4 text-brand" />Cadence does</div>
              <p className="mt-1 text-[14px] text-muted">Saving, editing, previewing, scheduling and publishing. No AI inside.</p>
            </div>
          </div>
        </section>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-3xl surface-plum p-7 text-white">
          <div>
            <div className="font-display text-2xl font-bold">You’re ready to ship.</div>
            <div className="mt-1 text-white/75">Your first post is one prompt away.</div>
          </div>
          <Link href="/app" className="btn bg-white text-ink hover:bg-white/90">Open my studio <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  );
}

/* ---------- compact checklist used in the welcome pop-up ---------- */

export function GuideChecklist({ state }: { state: Onboarding }) {
  const items = [
    {
      done: state.linkedin,
      icon: <LinkedInMark className="h-5 w-5" />,
      tone: "bg-linkedin-soft text-linkedin",
      t: "Connect LinkedIn",
      d: state.isDemo ? "Demo account: publishing is simulated" : "So Cadence can publish to your profile",
      cta: state.isDemo ? null : <a href="/api/auth/linkedin?next=/app" className="btn-linkedin h-9 px-4 text-[13px]">Connect</a>,
    },
    {
      done: state.claude,
      icon: <ClaudeMark className="h-5 w-5" />,
      tone: "bg-claude-soft text-claude",
      t: "Connect Claude",
      d: "Add one link in Claude → Settings → Connectors",
      cta: <Link href="/app/welcome" className="btn-primary h-9 px-4 text-[13px]">Show me how</Link>,
    },
    {
      done: state.firstPost,
      icon: <Send className="h-5 w-5" />,
      tone: "bg-apricot-soft text-apricot-dark",
      t: "Create your first post",
      d: "Ask Claude, or write one yourself",
      cta: <Link href="/app/welcome#step-3" className="btn-secondary h-9 px-4 text-[13px]"><MousePointerClick className="h-4 w-4" />Try a prompt</Link>,
    },
  ];
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.t} className={`flex items-center gap-4 rounded-2xl border p-4 transition ${it.done ? "border-line bg-canvas" : "border-line-strong bg-surface"}`}>
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${it.tone}`}>{it.icon}</span>
          <div className="min-w-0 flex-1">
            <div className={`font-semibold ${it.done ? "text-muted line-through decoration-faint" : ""}`}>{it.t}</div>
            <div className="text-[13px] text-muted">{it.d}</div>
          </div>
          {it.done ? <CircleCheck className="h-6 w-6 shrink-0 text-success" /> : it.cta}
        </li>
      ))}
    </ul>
  );
}
