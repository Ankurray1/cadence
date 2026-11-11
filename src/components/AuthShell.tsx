import { CalendarClock, Flame, TrendingUp } from "lucide-react";
import Link from "next/link";
import { ClaudeMark, Logo } from "./Logo";

/**
 * Split-screen auth layout: form on the left, a plum "why consistency wins" panel on the right.
 * Every number on the panel is sourced (links shown under each stat). No invented stats.
 */
const STATS = [
  {
    icon: TrendingUp,
    big: "+1,182",
    unit: "impressions per post",
    body: "for accounts posting 2–5× a week vs. once a week.",
    src: "Buffer · 2M+ LinkedIn posts, 2025",
    href: "https://buffer.com/resources/how-often-to-post-on-linkedin/",
  },
  {
    icon: Flame,
    big: "3×",
    unit: "engagements per post",
    body: "for accounts posting 11+ times a week.",
    src: "Buffer · same study",
    href: "https://buffer.com/resources/how-often-to-post-on-linkedin/",
  },
  {
    icon: CalendarClock,
    big: "5.6×",
    unit: "follower growth",
    body: "for LinkedIn Pages that post weekly.",
    src: "LinkedIn Marketing",
    href: "https://www.linkedin.com/business/marketing/blog/linkedin-ads/why-you-should-be-marketing-on-linkedin-right-now",
  },
];

function PromoPanel() {
  return (
    <aside className="surface-plum relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div className="pointer-events-none absolute -right-24 -bottom-10 font-display text-[260px] leading-none font-extrabold text-white/[0.05] select-none">weekly</div>
      <div className="relative">
        <span className="chip h-7 bg-white/15 px-3 text-[13px] text-white"><ClaudeMark className="h-3.5 w-3.5" /> Built for people who already pay for Claude</span>
        <h2 className="mt-6 max-w-lg font-display text-[44px] leading-[1.05] font-bold">
          Consistency is the LinkedIn algorithm.
          <span className="text-white/60"> Cadence makes it effortless.</span>
        </h2>
        <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/75">
          Your Claude writes with your voice. Cadence previews, schedules and publishes, so you show up every week without the blank page.
        </p>
      </div>

      <div className="relative mt-10 grid gap-3">
        {STATS.map(({ icon: Icon, big, unit, body, src, href }) => (
          <div key={big} className="flex items-start gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-sm">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white"><Icon className="h-5 w-5" /></span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[28px] leading-none font-bold">{big}</span>
                <span className="text-[14px] font-medium text-white/90">{unit}</span>
              </div>
              <div className="mt-1 text-[13px] text-white/70">{body}</div>
              <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11px] text-white/50 underline-offset-2 hover:text-white/80 hover:underline">Source: {src}</a>
            </div>
          </div>
        ))}
      </div>

      <p className="relative mt-8 text-[12px] text-white/50">Studies show correlation, not a guarantee. The pattern is clear, though: people who post consistently get seen more.</p>
    </aside>
  );
}

export function AuthShell({ children }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <main className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <Link href="/" className="text-[13px] font-medium text-muted hover:text-ink">← Back to site</Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="animate-fade-up w-full max-w-[420px]">{children}</div>
        </div>
        <p className="text-center text-xs text-faint">
          Cadence has no AI inside. Your own Claude does the writing. ·{" "}
          <Link href="/privacy" className="hover:text-ink">Privacy</Link> · <Link href="/terms" className="hover:text-ink">Terms</Link>
        </p>
      </main>
      <PromoPanel />
    </div>
  );
}
