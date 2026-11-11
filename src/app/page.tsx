import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  Eye,
  Flame,
  LayoutGrid,
  Lock,
  PenLine,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { ClaudeMark, LinkedInMark, Logo } from "@/components/Logo";
import { ConnectSteps } from "@/components/ConnectClaude";
import { getUser } from "@/lib/auth";

const LINKEDIN_PAGE = "https://www.linkedin.com/company/145439441/";

const COMPARE: [string, string][] = [
  ["The post lives in a chat, then scrolls away", "Every post is saved: drafts, scheduled and live, in one place"],
  ["You copy, paste and post at the right moment yourself", "Cadence publishes on schedule, even when you’re offline"],
  ["You guess how it will look in the feed", "See it as LinkedIn shows it, including where “…more” cuts in"],
  ["No plan, no record of how often you post", "A calendar, a daily streak and rewards keep you consistent"],
];

const FEATURES = [
  { i: CalendarDays, t: "Calendar by day, week or month", d: "See what goes out when. Click any open day to plan a post, or reschedule in one click." },
  { i: Sparkles, t: "Prompts that fill your week", d: "Ready-made Claude prompts built from your own posts and open days. One prompt can plan two weeks." },
  { i: Eye, t: "True LinkedIn preview", d: "Mobile and desktop views, the “…more” fold, bold text and lists that survive on LinkedIn." },
  { i: LayoutGrid, t: "Drafts, scheduled, live", d: "Every post in one board, as a list or a grid. Edit, move back to drafts or delete before it goes out." },
  { i: Flame, t: "Daily streak dashboard", d: "Track the days you post, this month’s output and your next milestone at a glance." },
  { i: ShieldCheck, t: "Your accounts stay yours", d: "Sign in with LinkedIn, Google or email. Claude only gets access you approve, and you can disconnect anytime." },
];

const FAQ: [string, React.ReactNode][] = [
  [
    "Do I need a paid Claude plan?",
    <>No. Cadence works as a custom connector on claude.ai, Claude Desktop and the mobile apps. Claude’s Free plan currently includes one custom connector.</>,
  ],
  [
    "Is there AI inside Cadence?",
    <>No. All writing happens in your own Claude, so you never pay for AI twice. Cadence stores, previews, schedules and publishes.</>,
  ],
  [
    "Will Cadence ever post without me?",
    <>Only posts you publish or schedule yourself, or that you explicitly ask your Claude to publish. Until then you can edit, reschedule, move it back to drafts or delete it.</>,
  ],
  [
    "What can Cadence access on LinkedIn?",
    <>Your basic profile (name, photo and email) and permission to publish posts you approve, through LinkedIn’s official API. Cadence can’t read your feed or your messages.</>,
  ],
  [
    "What happens to my LinkedIn connection over time?",
    <>LinkedIn asks every app to reconnect about every 60 days. Reconnecting takes one click in Settings, and your posts and schedule stay as they are.</>,
  ],
  [
    "Can I delete my data?",
    <>Yes. Delete any post at any time and disconnect LinkedIn or Claude from Settings. See the <Link href="/privacy" className="font-medium text-brand underline">privacy policy</Link> for details.</>,
  ],
];

export default async function Home() {
  const user = await getUser();
  const primaryHref = user ? "/app" : "/signup";
  const primaryLabel = user ? "Open your studio" : "Start free";

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
            <a href="#how" className="btn-ghost hidden md:inline-flex">How it works</a>
            <a href="#features" className="btn-ghost hidden md:inline-flex">Features</a>
            <a href="#pricing" className="btn-ghost hidden md:inline-flex">Pricing</a>
            <a href="#faq" className="btn-ghost hidden md:inline-flex">FAQ</a>
            {user ? (
              <Link href="/app" className="btn-primary">Open studio <ArrowRight className="h-4 w-4" /></Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">Sign in</Link>
                <Link href="/signup" className="btn-primary">Start free</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-dots relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-soft/60 via-surface/40 to-surface" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 md:pt-24 lg:grid-cols-[1.05fr_1fr]">
            <div className="animate-fade-up min-w-0">
              <span className="chip h-7 border border-line bg-surface px-3 text-[13px] text-ink-2 shadow-[var(--shadow-soft)]">
                <ClaudeMark className="h-3.5 w-3.5 text-claude" /> Works with your Claude · No AI fees
              </span>
              <h1 className="mt-6 font-display text-[38px] leading-[1.06] font-extrabold sm:text-[52px]">
                <span className="block text-balance">Your Claude writes it.</span>
                <span className="block text-balance bg-gradient-to-r from-brand to-[#a855f7] bg-clip-text text-transparent">Cadence ships it.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted">
                The LinkedIn workspace for founders, consultants and creators who want to <b className="font-semibold text-ink-2">show up consistently</b>. Claude writes the post. Cadence shows it the way LinkedIn will, schedules it, and publishes on time, even after the chat is closed.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={primaryHref} className="btn-primary h-12 px-6 text-[15px]">{primaryLabel} <ArrowRight className="h-4 w-4" /></Link>
                <a href="#connect" className="btn-secondary h-12 px-6 text-[15px]"><ClaudeMark className="h-4 w-4 text-claude" /> Add to Claude</a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted">
                <span className="flex items-center gap-1.5"><Wallet className="h-4 w-4" /> No AI fees</span>
                <span className="flex items-center gap-1.5"><LinkedInMark className="h-4 w-4 text-linkedin" /> LinkedIn’s official API</span>
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Free during early access</span>
              </div>
            </div>

            {/* Product visual */}
            <div className="animate-fade-up relative min-w-0" style={{ animationDelay: "120ms" }}>
              <div className="rounded-3xl border border-line bg-surface p-5" style={{ boxShadow: "var(--shadow-pop)" }}>
                <div className="flex items-center gap-2 border-b border-line pb-3 text-[13px] font-medium text-ink-2">
                  <ClaudeMark className="h-4 w-4 text-claude" /> Claude
                </div>
                <div className="mt-4 ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-canvas px-4 py-3 text-[13px] leading-relaxed">
                  Help me write a post about shipping our payments launch in 6 weeks. Then save it to Cadence for Tuesday 9am.
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                  <span className="chip h-6 border border-line bg-surface"><Sparkles className="h-3 w-3 text-brand" /> Used Cadence · create_post</span>
                </div>
                <div className="mt-3 rounded-2xl border border-line p-4">
                  <div className="flex items-center justify-between">
                    <span className="chip bg-brand-soft text-brand-ink"><CalendarClock className="h-3 w-3" />Tue 9:00 AM</span>
                    <span className="chip bg-claude-soft text-claude"><ClaudeMark className="h-3 w-3" />Claude</span>
                  </div>
                  <p className="mt-3 text-[14px] font-semibold">We shipped payments in 6 weeks. Here’s what nobody tells you 👇</p>
                  <p className="mt-1 text-[13px] text-muted">1. Your first launch date is a hypothesis… <span className="font-medium text-ink-2">…more</span></p>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-line bg-surface px-4 py-3 text-[13px] sm:block" style={{ boxShadow: "var(--shadow-pop)" }}>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-success" /> Published to LinkedIn · 9:00 AM</div>
              </div>
            </div>
          </div>
        </section>

        {/* Why not just Claude */}
        <section className="border-t border-line bg-canvas">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="eyebrow">Why Cadence</div>
            <h2 className="mt-2 max-w-2xl font-display text-[32px] leading-tight font-bold sm:text-4xl">Claude is a great writer. Consistency needs a workspace.</h2>
            <p className="mt-3 max-w-xl text-[15px] text-muted">Ideas in notes, drafts in a chat, formatting in one tool, scheduling in another. That’s why most people post twice and go quiet for a month.</p>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="card p-6">
                <div className="flex items-center gap-2 font-semibold text-ink-2"><ClaudeMark className="h-4 w-4 text-claude" /> Claude on its own</div>
                <ul className="mt-5 space-y-3.5">
                  {COMPARE.map(([a]) => (
                    <li key={a} className="flex gap-3 text-[14px] leading-snug text-muted"><X className="mt-0.5 h-4 w-4 shrink-0 text-faint" />{a}</li>
                  ))}
                </ul>
              </div>
              <div className="card p-6 ring-2 ring-brand/30">
                <div className="flex items-center gap-2 font-semibold text-ink"><ClaudeMark className="h-4 w-4 text-claude" /> Claude <span className="text-faint">+</span> Cadence</div>
                <ul className="mt-5 space-y-3.5">
                  {COMPARE.map(([, b]) => (
                    <li key={b} className="flex gap-3 text-[14px] leading-snug text-ink-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6">
          <div className="eyebrow">How it works</div>
          <h2 className="mt-2 max-w-xl font-display text-[32px] leading-tight font-bold sm:text-4xl">Claude does the thinking. Cadence does everything else.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { i: PenLine, t: "1. Write in Claude", d: "Draft in the chat you already use, with your context and your voice. Say “save it to Cadence” when it’s right." },
              { i: Eye, t: "2. Polish in Cadence", d: "Edit next to a live LinkedIn preview. See exactly where “…more” cuts in before anyone else does." },
              { i: CalendarClock, t: "3. Ship on schedule", d: "Pick a time, or let Claude plan your week. Cadence publishes to LinkedIn on time, even while you sleep." },
            ].map(({ i: Icon, t, d }) => (
              <div key={t} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-display text-lg font-bold">{t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-16 border-t border-line bg-canvas">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="eyebrow">Inside Cadence</div>
            <h2 className="mt-2 max-w-2xl font-display text-[32px] leading-tight font-bold sm:text-4xl">Everything you need to post every day, nothing you don’t.</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ i: Icon, t, d }) => (
                <div key={t} className="card p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 font-display text-[17px] font-bold">{t}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Connect */}
        <section id="connect" className="scroll-mt-16 border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="min-w-0">
              <div className="eyebrow">Get started</div>
              <h2 className="mt-2 font-display text-[32px] leading-tight font-bold sm:text-4xl">Add Cadence to Claude in about a minute</h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
                No API keys and nothing to install. Add one link to Claude, click <b className="text-ink-2">Connect</b>, sign in, and Claude can save, schedule and publish your posts.
              </p>
              <div className="mt-8 space-y-3 text-[14px] text-muted">
                <p className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Works on claude.ai, Claude Desktop and mobile</p>
                <p className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> No account yet? You can create one when you connect</p>
                <p className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> You choose the account; disconnect anytime from Settings</p>
              </div>
            </div>
            <div className="card min-w-0 p-6 sm:p-8"><ConnectSteps /></div>
          </div>
        </section>

        {/* Rewards */}
        <section className="border-t border-line bg-canvas">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="eyebrow">Consistency rewards</div>
            <h2 className="mt-2 max-w-2xl font-display text-[32px] leading-tight font-bold sm:text-4xl">Show up daily. We’ll pay for your LinkedIn Premium.</h2>
            <p className="mt-3 max-w-xl text-[15px] text-muted">21 days in a row builds a habit. Keep your daily posting streak going and Cadence rewards you, all the way to a free month of LinkedIn Premium.</p>
            <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["First post", "A celebration 🎉", false],
                ["21-day streak", "You’ve formed a habit, and unlock your first offer", false],
                ["29-day streak", "50% of a month of LinkedIn Premium, covered by Cadence", false],
                ["60-day streak", "1 month of LinkedIn Premium, paid by Cadence", false],
                ["90-day streak", "Another month of LinkedIn Premium, free", true],
              ].map(([m, r, top]) => (
                <li key={m as string} className={`rounded-2xl p-4 ${top ? "surface-plum text-white" : "border border-line bg-surface"}`}>
                  <div className={`text-[12px] font-semibold tracking-wide uppercase ${top ? "text-white/75" : "text-muted"}`}>{m}</div>
                  <div className="mt-1.5 text-[14px] leading-snug font-semibold">{r}</div>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[12px] text-faint">Streaks count days with a post published through Cadence. Premium rewards are funded by Cadence and are not a LinkedIn offer. <Link href="/terms#rewards" className="underline">Terms apply</Link>.</p>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-16 border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="eyebrow">Pricing</div>
            <h2 className="mt-2 max-w-2xl font-display text-[32px] leading-tight font-bold sm:text-4xl">Priced like there’s no AI inside, because there isn’t.</h2>
            <p className="mt-3 max-w-xl text-[15px] text-muted">You already pay for Claude. You shouldn’t pay for AI again.</p>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:max-w-4xl">
              <div className="card p-6 ring-2 ring-brand sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Early access</span>
                  <span className="chip bg-brand-soft text-brand-ink">Available now</span>
                </div>
                <div className="mt-4 font-display text-5xl font-bold">Free</div>
                <p className="mt-1 text-[13px] text-muted">Everything in Cadence while we’re in early access. No card needed.</p>
                <ul className="mt-6 space-y-2.5 text-[14px] text-ink-2">
                  {["Claude connector (MCP)", "Unlimited drafts and scheduling", "LinkedIn preview and auto-publishing", "Calendar, dashboard and daily streaks", "Consistency rewards"].map((x) => (
                    <li key={x} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{x}</li>
                  ))}
                </ul>
                <Link href={primaryHref} className="btn-primary mt-8 h-11 w-full">{primaryLabel} <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="card p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Pro</span>
                  <span className="chip bg-hover text-muted">After early access</span>
                </div>
                <div className="mt-4 font-display text-5xl font-bold">₹399<span className="ml-1 text-base font-normal text-muted">/ month</span></div>
                <p className="mt-1 text-[13px] text-muted">Starts with a 30-day free trial. We’ll tell you well before anything changes.</p>
                <ul className="mt-6 space-y-2.5 text-[14px] text-ink-2">
                  {["Everything in early access", "Priority support", "New platforms as they launch (X and Instagram next)"].map((x) => (
                    <li key={x} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{x}</li>
                  ))}
                </ul>
                <p className="mt-8 flex items-center gap-2 rounded-2xl bg-canvas px-4 py-3 text-[13px] text-muted"><Lock className="h-4 w-4 shrink-0" /> Teams and agencies: <a href={LINKEDIN_PAGE} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">talk to us on LinkedIn</a></p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-16 border-t border-line bg-canvas">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.6fr]">
            <div>
              <div className="eyebrow">FAQ</div>
              <h2 className="mt-2 font-display text-[32px] leading-tight font-bold sm:text-4xl">Questions, answered</h2>
              <p className="mt-3 text-[15px] text-muted">
                Something else? <a href={LINKEDIN_PAGE} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">Message us on LinkedIn</a>.
              </p>
            </div>
            <div className="space-y-2.5">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group card p-0 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-semibold">
                    {q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 text-[14px] leading-relaxed text-muted">{a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="surface-plum relative overflow-hidden rounded-3xl px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <h2 className="mx-auto max-w-2xl font-display text-[30px] leading-tight font-bold sm:text-[40px]">Start showing up. Every day.</h2>
            <p className="mx-auto mt-3 max-w-lg text-[16px] text-white/80">Connect your Claude, write your first post, and let Cadence handle the rest. Free during early access.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={primaryHref} className="btn h-12 bg-white px-6 text-[15px] text-ink hover:bg-white/90">{primaryLabel} <ArrowRight className="h-4 w-4" /></Link>
              <a href="#connect" className="btn h-12 border border-white/30 px-6 text-[15px] text-white hover:bg-white/10"><ClaudeMark className="h-4 w-4" /> Add to Claude</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-[13px] text-muted sm:px-6">
          <Logo />
          <span>No AI inside. The thinking happens in your own Claude.</span>
          <span className="flex flex-wrap gap-4">
            <a href={LINKEDIN_PAGE} target="_blank" rel="noreferrer" className="hover:text-ink">LinkedIn</a>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
