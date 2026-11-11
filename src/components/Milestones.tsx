import { Check, Gift, Lock, PartyPopper } from "lucide-react";
import Link from "next/link";
import type { MilestoneState } from "@/lib/milestones";
import { ClaimButton } from "./ClaimButton";
import { milestonePrize } from "./JourneyRail";

export function MilestonesCard({ list, next, days, dailyStreak }: { list: MilestoneState[]; next: MilestoneState | null; days: number; dailyStreak: number }) {
  const reached = list.filter((m) => m.unlocked).length;
  const remaining = next ? Math.max(0, next.target - next.progress) : 0;
  const pct = next ? Math.min(100, (next.progress / next.target) * 100) : 100;

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-medium text-muted"><Gift className="h-4 w-4" /> Milestones & rewards</div>
          <h2 className="mt-1 font-display text-2xl font-bold">Show up daily. 21 days builds a habit.</h2>
          <p className="mt-1 text-[14px] text-muted">Post every day to grow your streak. Each milestone reveals the next reward, all the way to a free month of LinkedIn Premium.</p>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl font-bold">{reached}<span className="text-lg text-faint">/{list.length}</span></div>
          <div className="text-[12px] text-muted">reached · {dailyStreak}-day streak · {days} posting day{days === 1 ? "" : "s"}</div>
        </div>
      </div>

      {/* Track */}
      <div className="px-6 pt-8 pb-2">
        <div className="relative">
          <div className="absolute top-4 right-4 left-4 h-1 rounded-full bg-hover" />
          <div className="absolute top-4 left-4 h-1 rounded-full bg-brand transition-all" style={{ width: `calc((100% - 2rem) * ${Math.max(0, reached - 1 + (next ? pct / 100 : 0)) / (list.length - 1)})` }} />
          <ol className="relative flex justify-between">
            {list.map((m) => {
              const isNext = next?.id === m.id;
              return (
                <li key={m.id} className="flex w-20 flex-col items-center text-center">
                  <span className={`grid h-9 w-9 place-items-center rounded-full border-2 transition ${m.unlocked ? "border-transparent bg-vivid text-white" : isNext ? "border-brand bg-surface text-brand ring-4 ring-brand/10" : "border-line-strong bg-surface text-faint"}`}>
                    {m.unlocked ? <Check className="h-4 w-4" strokeWidth={3} /> : isNext ? <Gift className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                  </span>
                  <span className={`mt-2 text-[11px] leading-tight font-semibold ${m.unlocked || isNext ? "text-ink" : "text-faint"}`}>{m.title}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {next ? (
        <div className="mx-6 mt-4 rounded-2xl bg-canvas p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[14px]">
            <span>
              {next.kind === "daily" ? <><b>{remaining} more day{remaining === 1 ? "" : "s"} in a row</b> to </> : <><b>Publish your first post</b> to </>}
              <b>{milestonePrize(next).charAt(0).toLowerCase() + milestonePrize(next).slice(1)}</b>
            </span>
            {next.kind === "daily" && <span className="chip bg-surface text-ink-2">Day {next.progress} of {next.target}</span>}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} /></div>
        </div>
      ) : (
        <div className="mx-6 mt-4 rounded-2xl bg-success-soft p-4 text-[14px] font-medium text-success">Every milestone reached. Legend. 🏆</div>
      )}

      <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-5">
        {list.map((m, i) => (
          <div key={m.id} className={`flex flex-col rounded-2xl border p-4 ${m.unlocked ? "border-line-strong bg-surface" : "border-line bg-canvas/60"}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold tracking-wide text-muted uppercase">{m.title}</span>
              {m.revealed && <span className={`chip h-5 text-[11px] ${m.unlocked ? "bg-brand-soft text-brand-ink" : "bg-hover text-faint"}`}>{m.value}</span>}
            </div>
            {m.unlocked ? (
              <>
                <div className="mt-2 flex items-start gap-1.5 font-display text-[16px] font-bold"><PartyPopper className="mt-0.5 h-4 w-4 shrink-0 text-success" />{m.celebration}</div>
                {m.reward && <div className="mt-1 text-[13px] text-ink-2">{m.reward}</div>}
              </>
            ) : m.revealed ? (
              <>
                <div className="mt-2 font-display text-[16px] font-bold text-ink-2">{milestonePrize(m)}</div>
                <div className="mt-1 flex-1 text-[13px] text-muted">{m.detail}</div>
              </>
            ) : (
              <>
                <div className="mt-2 font-display text-[16px] font-bold text-faint">🎁 Mystery reward</div>
                <div className="mt-1 flex-1 text-[13px] text-faint">Revealed when you reach your {list[i - 1]?.title.toLowerCase()}.</div>
              </>
            )}
            <div className="mt-3">
              {m.unlocked && m.reward ? (
                m.claimed ? <span className="flex items-center gap-1.5 text-[13px] font-medium text-success"><Check className="h-4 w-4" /> Claimed · we’ll be in touch</span> : <ClaimButton id={m.id} />
              ) : m.unlocked ? (
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-success"><Check className="h-4 w-4" /> Achieved</span>
              ) : m.revealed ? (
                <div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-hover"><div className="h-full rounded-full bg-brand/40" style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }} /></div>
                  <div className="mt-1 text-[12px] text-faint">{m.kind === "daily" ? `Day ${Math.min(m.progress, m.target)} of ${m.target}` : `${Math.min(m.progress, m.target)} of ${m.target}`}</div>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <p className="px-6 pb-5 text-[11px] text-faint">
        LinkedIn Premium rewards are funded by Cadence as a reimbursement or Premium gift, and are not a LinkedIn offer. <Link href="/terms#rewards" className="underline">Terms apply</Link>.
      </p>
    </section>
  );
}
