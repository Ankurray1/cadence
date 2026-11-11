import { ArrowRight, CalendarClock, Eye, PenLine, Sparkles, Wallet } from "lucide-react";
import Link from "next/link";
import { ClaudeMark, LinkedInMark, Logo } from "@/components/Logo";
import { ConnectSteps } from "@/components/ConnectClaude";
import { getUser } from "@/lib/auth";

export default async function Home() {
  const user = await getUser();
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#connect" className="btn-ghost hidden sm:inline-flex">Connect Claude</a>
            <a href="#pricing" className="btn-ghost hidden sm:inline-flex">Pricing</a>
            {user ? (
              <Link href="/app" className="btn-primary">Open studio <ArrowRight className="h-4 w-4" /></Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">Sign in</Link>
                <Link href="/signup" className="btn-primary">Get started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-dots relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-soft/60 via-surface/40 to-surface" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 md:pt-24 lg:grid-cols-[1.05fr_1fr]">
            <div className="animate-fade-up">
              <span className="chip h-7 border border-line bg-surface px-3 text-[13px] text-ink-2 shadow-[var(--shadow-soft)]">
                <ClaudeMark className="h-3.5 w-3.5 text-claude" /> Built for Claude · No AI fees
              </span>
              <h1 className="mt-6 font-display text-[40px] leading-[1.05] font-extrabold sm:text-[52px]">
                <span className="whitespace-nowrap">Your Claude writes it.</span>
                <br />
                <span className="bg-gradient-to-r from-brand to-[#a855f7] bg-clip-text text-transparent">Cadence ships it.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted">
                The LinkedIn studio for people who already pay for Claude. Write with Claude, polish with a pixel-perfect LinkedIn preview, and let Cadence post on schedule, even after the chat is closed.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#connect" className="btn-brand h-12 px-6 text-[15px]">Add to Claude <ArrowRight className="h-4 w-4" /></a>
                <Link href={user ? "/app" : "/signup"} className="btn-secondary h-12 px-6 text-[15px]">{user ? "Open your studio" : "Create free account"}</Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-[13px] text-muted">
                <span className="flex items-center gap-1.5"><Wallet className="h-4 w-4" /> $0 AI cost</span>
                <span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4" /> Auto-publishing</span>
                <span className="flex items-center gap-1.5"><LinkedInMark className="h-4 w-4 text-linkedin" /> Official LinkedIn API</span>
              </div>
            </div>

            {/* Product visual */}
            <div className="animate-fade-up relative" style={{ animationDelay: "120ms" }}>
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

        {/* Connect */}
        <section id="connect" className="scroll-mt-16 border-t border-line bg-canvas">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <div className="text-[13px] font-semibold tracking-wider text-brand uppercase">Get started</div>
              <h2 className="mt-2 font-display text-4xl font-bold">Add Cadence to Claude in 30 seconds</h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
                No API keys and nothing to install. Add one link to Claude, click <b className="text-ink-2">Connect</b>, sign in, and Claude can save, schedule and publish your posts.
              </p>
              <div className="mt-8 space-y-3 text-[13px] text-muted">
                <p>✓ Works on claude.ai, Claude Desktop and mobile, including the Free plan (1 custom connector)</p>
                <p>✓ No account yet? Claude walks you through creating one when you connect</p>
                <p>✓ Disconnect anytime from Settings</p>
              </div>
            </div>
            <div className="card p-6 sm:p-8"><ConnectSteps /></div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="max-w-xl font-display text-4xl font-bold">Claude does the thinking. Cadence does everything else.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { i: PenLine, t: "Write in Claude", d: "Draft and refine in the chat you already use, with your context, your voice and your projects. Say “save it to Cadence” when it’s right." },
              { i: Eye, t: "Polish in Cadence", d: "See exactly how it looks in the feed, including where “…more” cuts in. Bold text, lists and images, all LinkedIn-safe." },
              { i: CalendarClock, t: "Ship on schedule", d: "Pick a slot or let Claude plan your week. Cadence publishes to LinkedIn on time, even while you sleep." },
            ].map(({ i: Icon, t, d }) => (
              <div key={t} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-display text-lg font-bold">{t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-16 border-t border-line bg-canvas">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="font-display text-4xl font-bold">Priced like there’s no AI inside, because there isn’t.</h2>
            <p className="mt-3 max-w-xl text-muted">You already pay for Claude, so you shouldn’t pay for AI again.</p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { n: "Free", p: "$0", d: "5 scheduled posts / month", f: ["Claude connector", "LinkedIn preview", "Calendar", "Earn free Solo time with milestones"] },
                { n: "Solo", p: "$9", d: "per month", f: ["Unlimited scheduling", "Images", "Dashboard & streaks", "Streak rewards up to a free month of LinkedIn Premium"], hot: true },
                { n: "Team", p: "$15", d: "per seat / month", f: ["Shared calendar", "Approvals", "Multiple profiles"] },
              ].map((t) => (
                <div key={t.n} className={`card p-6 ${t.hot ? "ring-2 ring-brand" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t.n}</span>
                    {t.hot && <span className="chip bg-brand-soft text-brand-ink">Most popular</span>}
                  </div>
                  <div className="mt-4 font-display text-4xl font-bold">{t.p}<span className="ml-1 text-sm font-normal text-muted">{t.d}</span></div>
                  <ul className="mt-6 space-y-2 text-[13px] text-ink-2">{t.f.map((x) => <li key={x}>✓ {x}</li>)}</ul>
                </div>
              ))}
            </div>

            <div className="card mt-6 p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="eyebrow">Consistency rewards</div>
                  <h3 className="mt-1 font-display text-2xl font-bold">Show up daily. We’ll pay for your LinkedIn Premium.</h3>
                  <p className="mt-1 max-w-xl text-[14px] text-muted">21 days in a row builds a habit. Keep your daily posting streak going and Cadence covers LinkedIn Premium for you. Each reward is revealed when you reach the milestone before it.</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ["1st post", "Congratulations 🎉"],
                  ["21-day streak", "You’ve formed a habit + unlock your first offer"],
                  ["29-day streak", "50% of LinkedIn Premium, covered by Cadence"],
                  ["60-day streak", "1 month of LinkedIn Premium, paid by Cadence"],
                  ["90-day streak", "Get 1 more month of LinkedIn Premium free"],
                ].map(([m, r]) => (
                  <div key={m} className="rounded-2xl bg-canvas p-4">
                    <div className="text-[12px] font-semibold tracking-wide text-muted uppercase">{m}</div>
                    <div className="mt-1 text-[14px] font-semibold">{r}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[12px] text-faint">Premium rewards are funded by Cadence and are not a LinkedIn offer. <Link href="/terms#rewards" className="underline">Terms apply</Link>.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-[13px] text-muted sm:px-6">
          <Logo />
          <span>No AI inside. The thinking happens in your own Claude.</span>
          <span className="flex gap-4"><Link href="/privacy" className="hover:text-ink">Privacy policy</Link><Link href="/terms" className="hover:text-ink">Terms of service</Link></span>
        </div>
      </footer>
    </div>
  );
}
