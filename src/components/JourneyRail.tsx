import { ArrowRight, CalendarClock, Check, Flame, Gift, Lock, PartyPopper } from "lucide-react";
import Link from "next/link";
import type { MilestoneState } from "@/lib/milestones";

/** What reaching a milestone gives you, in one line. */
export function milestonePrize(m: MilestoneState) {
  if (m.reward) return m.reward;
  return m.id === "streak-21" ? "Form a habit + unlock your first offer" : "Celebrate your first post";
}

/**
 * Vertical milestone map on the Posts page: where you are, what's next, and
 * what's still a mystery. Everything comes from real activity.
 */
export function JourneyRail({
  list,
  next,
  days,
  dailyStreak,
  scheduledDays,
}: {
  list: MilestoneState[];
  next: MilestoneState | null;
  days: number;
  dailyStreak: number;
  scheduledDays: number;
}) {
  const remaining = next ? Math.max(0, next.target - next.progress) : 0;
  const pct = next ? Math.min(100, (next.progress / next.target) * 100) : 100;
  const justDone = [...list].reverse().find((m) => m.unlocked);

  return (
    <aside className="card overflow-hidden xl:sticky xl:top-6">
      <div className="border-b border-line p-5">
        <div className="eyebrow">Your journey</div>
        <div className="mt-2 flex items-center gap-4 text-[13px] text-ink-2">
          <span><b className="font-display text-2xl font-bold text-ink">{days}</b> posting day{days === 1 ? "" : "s"}</span>
          <span className="flex items-center gap-1"><Flame className={`h-4 w-4 ${dailyStreak ? "text-[#e0843b]" : "text-faint"}`} /><span><b className="text-ink">{dailyStreak}</b>-day streak</span></span>
        </div>

        {justDone && (
          <div className="mt-4 flex gap-2.5 rounded-2xl bg-success-soft p-3 text-[13px] leading-snug text-success">
            <PartyPopper className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="font-medium">{justDone.celebration}</span>
          </div>
        )}

        {next ? (
          <div className="mt-3 rounded-2xl bg-canvas p-4">
            <div className="text-[12px] font-semibold tracking-wide text-muted uppercase">Next: {next.title}</div>
            <div className="mt-1 font-display text-[17px] leading-snug font-bold">{milestonePrize(next)}</div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} /></div>
            <div className="mt-2 text-[12px] text-muted">
              {next.kind === "daily" ? (
                <><b className="text-ink-2">Day {next.progress} of {next.target}</b> · {remaining} more day{remaining === 1 ? "" : "s"} in a row</>
              ) : (
                <><b className="text-ink-2">Publish your first post</b> to get started</>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-2xl bg-success-soft p-4 text-[13px] font-medium text-success">Every milestone reached. You’re a Cadence legend. 🏆</div>
        )}

        {scheduledDays > 0 && (
          <div className="mt-3 flex gap-2.5 rounded-2xl border border-brand/20 bg-brand-soft/40 p-3 text-[12px] leading-snug text-ink-2">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>You have posts lined up on <b className="text-ink">{scheduledDays} upcoming day{scheduledDays === 1 ? "" : "s"}</b>. Keep a post going out every day to grow your streak.</span>
          </div>
        )}
      </div>

      {/* Vertical milestone map */}
      <ol className="relative p-5">
        {list.map((m, i) => {
          const isNext = next?.id === m.id;
          const last = i === list.length - 1;
          const prev = list[i - 1];
          return (
            <li key={m.id} className="relative flex gap-3 pb-5 last:pb-0">
              {!last && <span className={`absolute top-8 bottom-0 left-[15px] w-0.5 ${m.unlocked ? "bg-brand" : "bg-line"}`} />}
              <span
                className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${
                  m.unlocked ? "border-transparent bg-vivid text-white" : isNext ? "border-brand bg-surface text-brand ring-4 ring-brand/10" : "border-line-strong bg-surface text-faint"
                }`}
              >
                {m.unlocked ? <Check className="h-4 w-4" strokeWidth={3} /> : isNext ? <Gift className="h-3.5 w-3.5" /> : <Lock className="h-3 w-3" />}
              </span>
              <div className="min-w-0 pt-0.5">
                <div className={`text-[12px] font-semibold tracking-wide uppercase ${m.unlocked || isNext ? "text-muted" : "text-faint"}`}>
                  {m.title}
                  {isNext && <span className="ml-1.5 normal-case tracking-normal text-brand">· you’re here</span>}
                </div>
                {m.unlocked ? (
                  <div className="text-[14px] leading-snug font-semibold text-ink-2">{m.reward ?? m.celebration}</div>
                ) : m.revealed ? (
                  <div className={`text-[14px] leading-snug font-semibold ${isNext ? "text-ink" : "text-ink-2"}`}>{milestonePrize(m)}</div>
                ) : (
                  <div className="text-[14px] leading-snug font-semibold text-faint">🎁 Mystery reward</div>
                )}
                {!m.revealed && prev && <div className="mt-0.5 text-[12px] text-faint">Revealed at your {prev.title.toLowerCase()}</div>}
                {m.unlocked && m.reward && !m.claimed && (
                  <Link href="/app/dashboard" className="mt-1 inline-flex text-[12px] font-semibold text-brand hover:underline">Claim reward →</Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-line px-5 py-3">
        <Link href="/app/dashboard" className="flex items-center justify-between text-[13px] font-medium text-muted hover:text-ink">
          See all stats & rewards <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}
