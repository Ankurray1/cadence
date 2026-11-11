import { Check, Clock, TrendingDown, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listPosts } from "@/lib/posts";
import { getMilestones } from "@/lib/milestones";
import { MilestonesCard } from "@/components/Milestones";

export const dynamic = "force-dynamic";

const DOW = ["M", "T", "W", "T", "F", "S", "S"];
const dayNum = (k: string) => Math.floor(Date.parse(k + "T12:00:00Z") / 86400000);
const fromNum = (n: number) => new Date(n * 86400000).toISOString().slice(0, 10);

export default async function DashboardPage() {
  const user = await requireUser("/app/dashboard");
  const tz = user.timezone;
  const [posts, ms] = await Promise.all([listPosts(user.id, "all", 500), getMilestones(user.id, tz)]);

  const key = (d: string | Date) => new Date(d).toLocaleDateString("en-CA", { timeZone: tz });
  const today = key(new Date());
  const todayN = dayNum(today);

  // Days with a published post (any) and days with something queued.
  const published = posts.filter((p) => p.status === "posted" && p.posted_at);
  const publishedDays = new Set(published.map((p) => key(p.posted_at!)));
  const realDays = new Set(ms.dates); // what counts toward the streak
  const scheduledDays = new Set(posts.filter((p) => p.status === "scheduled" && p.scheduled_at).map((p) => key(p.scheduled_at!)));

  // This month vs last month.
  const [y, m] = today.split("-").map(Number);
  const monthKey = today.slice(0, 7);
  const prevKey = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  const thisMonth = published.filter((p) => key(p.posted_at!).startsWith(monthKey)).length;
  const lastMonth = published.filter((p) => key(p.posted_at!).startsWith(prevKey)).length;
  const delta = thisMonth - lastMonth;
  const queuedThisMonth = posts.filter((p) => p.status === "scheduled" && p.scheduled_at && key(p.scheduled_at).startsWith(monthKey)).length;
  const monthName = new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstDow = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => `${monthKey}-${String(i + 1).padStart(2, "0")}`);

  // This week, Monday to Sunday.
  const monday = todayN - ((new Date(today + "T12:00:00Z").getUTCDay() + 6) % 7);
  const week = Array.from({ length: 7 }, (_, i) => fromNum(monday + i));
  const postedToday = realDays.has(today);
  const queuedToday = scheduledDays.has(today);
  const streak = ms.dailyStreak;
  const status = postedToday
    ? { tone: "good", text: `Today’s done. Come back tomorrow for day ${streak + 1}.` }
    : queuedToday
      ? { tone: "good", text: `Today’s post is scheduled, so your streak is covered.` }
      : streak > 0
        ? { tone: "risk", text: `Post today to keep your ${streak}-day streak alive.` }
        : { tone: "idle", text: "Publish today to start a streak. 21 days builds a habit." };


  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <header className="animate-fade-up">
        <div className="eyebrow">Dashboard</div>
        <h1 className="mt-1 font-display text-[34px] font-bold">Your LinkedIn momentum</h1>
        <p className="mt-1 text-muted">Consistency beats virality. Here’s how steadily you’re showing up.</p>
      </header>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        {/* Hero: published this month + month map */}
        <div className="surface-plum relative overflow-hidden rounded-3xl p-6 text-white sm:p-7">
          <div className="text-[12px] font-semibold tracking-[0.12em] text-white/75 uppercase">Published in {monthName}</div>
          <div className="mt-5 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <div className="font-display text-[72px] leading-none font-bold">{thisMonth}</div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
                {lastMonth > 0 || thisMonth > 0 ? (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${delta >= 0 ? "bg-white/10 text-white" : "bg-white/10 text-white/70"}`}>
                    {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {delta >= 0 ? "+" : ""}{delta} vs last month
                  </span>
                ) : null}
                {queuedThisMonth > 0 && <span className="text-white/60">+{queuedThisMonth} queued</span>}
              </div>
              <div className="mt-2 text-[13px] text-white/50">{published.length} published all time</div>
            </div>

            {/* Month map */}
            <div>
              <div className="grid grid-cols-7 gap-1.5">
                {DOW.map((d, i) => <span key={i} className="text-center text-[10px] font-medium text-white/40">{d}</span>)}
                {Array.from({ length: firstDow }, (_, i) => <span key={`b${i}`} />)}
                {monthDays.map((d) => {
                  const n = dayNum(d);
                  const cls = publishedDays.has(d)
                    ? "bg-white text-ink"
                    : scheduledDays.has(d)
                      ? "border border-dashed border-white/60 text-white"
                      : n < todayN
                        ? "bg-white/10 text-white/50"
                        : "border border-white/20 text-white/60";
                  return (
                    <span key={d} title={d} className={`grid h-7 w-7 place-items-center rounded-lg text-[10px] font-medium ${cls} ${d === today ? "ring-2 ring-white/70 ring-offset-2 ring-offset-[#6e4ea8]" : ""}`}>
                      {Number(d.slice(8))}
                    </span>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-3 text-[10px] text-white/50">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-white" /> Published</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm border border-dashed border-white/60" /> Scheduled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily streak meter */}
        <div className="card flex flex-col p-6">
          <div className="flex items-center justify-between text-[13px] font-medium text-muted">
            <span className="text-[12px] font-semibold tracking-[0.12em] uppercase">Daily streak</span>
            <span>Best: {ms.bestDailyStreak} day{ms.bestDailyStreak === 1 ? "" : "s"}</span>
          </div>
          <div className="mt-4 flex items-end gap-2">
            <span className={`text-4xl ${streak ? "" : "opacity-30 grayscale"}`}>🔥</span>
            <span className="font-display text-[56px] leading-none font-bold">{streak}</span>
            <span className="pb-1.5 text-muted">day{streak === 1 ? "" : "s"} in a row</span>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-1.5">
            {week.map((d, i) => {
              const n = dayNum(d);
              const done = realDays.has(d);
              const queued = !done && scheduledDays.has(d);
              const isToday = d === today;
              return (
                <div key={d} className="flex flex-col items-center gap-1.5">
                  <span className={`text-[11px] font-semibold ${isToday ? "text-ink" : "text-faint"}`}>{DOW[i]}</span>
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full ${
                      done ? "bg-vivid text-white" : queued ? "border-2 border-dashed border-brand text-brand" : isToday ? "border-2 border-brand bg-brand-soft/40" : n < todayN ? "bg-hover" : "border border-line"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" strokeWidth={3} /> : queued ? <Clock className="h-3.5 w-3.5" /> : null}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            className={`mt-auto rounded-2xl px-4 py-3 text-[13px] font-medium ${
              status.tone === "risk" ? "bg-[#fdf1e7] text-[#a4541b]" : status.tone === "good" ? "bg-success-soft text-success" : "bg-canvas text-ink-2"
            }`}
            style={{ marginTop: "1.5rem" }}
          >
            {status.text}
          </div>
        </div>
      </section>

      {/* Milestones & rewards */}
      <div className="mt-4">
        <MilestonesCard list={ms.list} next={ms.next} days={ms.days} dailyStreak={ms.dailyStreak} />
      </div>
    </div>
  );
}
