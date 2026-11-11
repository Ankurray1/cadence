import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listPosts } from "@/lib/posts";
import { dayKey, fmtTime } from "@/lib/format";
import { getMilestones } from "@/lib/milestones";
import { ClaudeMark } from "@/components/Logo";
import { ScheduleDay } from "@/components/ScheduleDay";
import { PromptCard } from "@/components/PromptCard";
import type { Post, User } from "@/lib/types";

export const dynamic = "force-dynamic";

type View = "day" | "week" | "month";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY = 86400000;

const addDays = (k: string, n: number) => new Date(Date.parse(k + "T12:00:00Z") + n * DAY).toISOString().slice(0, 10);
const dow = (k: string) => (new Date(k + "T12:00:00Z").getUTCDay() + 6) % 7; // 0 = Mon
const weekStart = (k: string) => addDays(k, -dow(k));
const fmt = (k: string, o: Intl.DateTimeFormatOptions) => new Date(k + "T12:00:00Z").toLocaleDateString("en-US", { ...o, timeZone: "UTC" });

function shift(k: string, view: View, n: number) {
  if (view === "day") return addDays(k, n);
  if (view === "week") return addDays(k, 7 * n);
  const d = new Date(k.slice(0, 7) + "-01T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}

function monthGrid(ym: string) {
  const start = weekStart(ym + "-01");
  const cells: string[] = [];
  for (let i = 0; i < 42; i++) {
    const c = addDays(start, i);
    if (i >= 35 && !c.startsWith(ym) && cells.length % 7 === 0) break;
    cells.push(c);
  }
  return cells;
}

const when = (p: Post) => (p.status === "posted" ? p.posted_at : p.status === "scheduled" || p.status === "publishing" ? p.scheduled_at : null);

function statusStyle(p: Post) {
  return p.status === "posted" ? "bg-canvas text-ink-2 ring-1 ring-line" : "bg-brand-soft text-brand-ink";
}
function StatusIcon({ p, className = "h-3 w-3" }: { p: Post; className?: string }) {
  return p.status === "posted" ? <CheckCircle2 className={`${className} text-success`} /> : <Clock className={className} />;
}

/**
 * Action prompts for the user's own Claude. They work for anyone: Claude grounds each post in what it already
 * knows about the person (memory and past chats: their work, interests, wins and setbacks) and asks when it
 * doesn't know enough. Cadence adds only live facts: open days, streak and the next free slot.
 */
function buildPrompts(open: string[], streak: number, todayKey: string, postedToday: boolean, queuedToday: boolean, tz: string) {
  const short = (k: string) => fmt(k, { weekday: "short", month: "short", day: "numeric" });
  const long = (k: string) => fmt(k, { weekday: "long", month: "short", day: "numeric" });
  const week = open.filter((d) => d <= addDays(todayKey, 7));
  const twoWeeks = open.filter((d) => d <= addDays(todayKey, 14));
  const list = (ds: string[]) => ds.map(short).join(", ");

  // When the story goes out: ~2 hours from now today (time to review in Cadence), else the next open day.
  const hourNow = Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: tz })) % 24;
  const slotHour = hourNow + 2;
  const today = !postedToday && !queuedToday && slotHour <= 21;
  const hourLabel = (h: number) => new Date(Date.UTC(2000, 0, 1, h)).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
  const storySlot = today ? `today (${long(todayKey)}) at ${hourLabel(slotHour)} my time` : `${open[0] ? long(open[0]) : "my next open day"} at 9:00 AM my time`;

  const know = `Use what you already know about me from our past conversations and your memory: the work I do, projects I’m proud of, topics I care about, and the ups and downs I’ve shared with you. Also read my recent posts in Cadence to match my voice and avoid repeating a topic. Use real details only and never invent experiences. If you know little about me, write from my recent Cadence posts and my field, and keep personal claims general rather than made up.`;

  const style = `Writing rules: a hook under 12 words that makes a claim or names a tension (no “I’m excited to share”). 120–220 words, one idea per post, short lines with white space. One concrete detail: a number, a tool, or the exact moment. End with one specific question for readers. Max 3 hashtags at the end. Sound like a practitioner talking to peers, not a marketer.`;

  const mix = `Mix the kinds of posts across the days: ups-and-downs stories (a real high or low at work and what changed after), practical how-tos (something I do well, as numbered steps), and points of view (a belief in my field I see differently, backed by my experience). Never two of the same kind in a row.`;

  const direct = `Don’t ask me any questions and don’t wait for my approval. I’ll review and edit everything in Cadence before it goes live.`;

  return [
    {
      title: "Post a story now",
      why: today ? `Goes live ${hourLabel(slotHour)} today. Review it in Cadence first.` : `Today’s covered. Ready for ${open[0] ? short(open[0]) : "your next open day"}.`,
      featured: true,
      prompt: `${know}

Write one honest story post about a turning point in my work: a failure, a hard call, a rejection or a lucky break. Pick the strongest moment you know about.

Structure: the moment (one vivid scene), what I felt or got wrong, what I did next, and the lesson in one line. Humble and specific, no humble-brag.

${style}

${direct} Save it to Cadence now and schedule it for ${storySlot}. Then reply with just the hook and the scheduled time.`,
    },
    {
      title: "Fill this week",
      why: week.length ? `${week.length} open day${week.length === 1 ? "" : "s"} in the next 7, starting ${short(week[0])}.` : "Every day this week has a post. Nice.",
      prompt: `${know}

Write one LinkedIn post for each of these open days: ${week.length ? list(week) : "my open days in the next 7 days"}. ${mix}

${style}

${direct} Save each post to Cadence now and schedule it for 9:00 AM my time on its day. Then reply with a short list: date, kind of post, hook.`,
    },
    {
      title: "Fill the next 2 weeks",
      why: twoWeeks.length ? `${twoWeeks.length} open days in the next 14. One prompt plans them all.` : "Your next two weeks are fully planned.",
      prompt: `${know}

Write a 2-week LinkedIn content plan and every post in it, one post for each of these open days: ${twoWeeks.length ? list(twoWeeks) : "my open days in the next 14 days"}. Give the two weeks a light arc, so week 2 builds on week 1. ${mix}

${style}

${direct} Save every post to Cadence now and schedule each for 9:00 AM my time on its date. Then reply with a table: date, kind of post, topic, hook.`,
    },
  ];
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ view?: string; d?: string; m?: string }> }) {
  const user = await requireUser("/app/calendar");
  const tz = user.timezone;
  const todayKey = dayKey(new Date(), tz);
  const sp = await searchParams;
  const view: View = sp.view === "day" || sp.view === "week" ? sp.view : "month";
  const anchor = sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : sp.m && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m + "-01" : todayKey;

  const [posts, ms] = await Promise.all([listPosts(user.id, "all", 500), getMilestones(user.id, tz)]);

  const byDay = new Map<string, Post[]>();
  for (const p of posts) {
    const at = when(p);
    if (!at) continue;
    const k = dayKey(at, tz);
    byDay.set(k, [...(byDay.get(k) ?? []), p].sort((a, b) => +new Date(when(a)!) - +new Date(when(b)!)));
  }

  // Range for the current view.
  const ym = anchor.slice(0, 7);
  const days =
    view === "day" ? [anchor] : view === "week" ? Array.from({ length: 7 }, (_, i) => addDays(weekStart(anchor), i)) : monthGrid(ym).filter((c) => c.startsWith(ym));
  const inRange = days.flatMap((d) => byDay.get(d) ?? []);
  const title =
    view === "day"
      ? fmt(anchor, { weekday: "long", month: "long", day: "numeric" })
      : view === "week"
        ? `${fmt(days[0], { month: "short", day: "numeric" })} – ${days[0].slice(5, 7) === days[6].slice(5, 7) ? Number(days[6].slice(8)) : fmt(days[6], { month: "short", day: "numeric" })}, ${days[6].slice(0, 4)}`
        : fmt(anchor, { month: "long", year: "numeric" });
  const unit = view === "day" ? "today" : `this ${view}`;
  const scheduledN = inRange.filter((p) => p.status !== "posted").length;
  const subtitle = inRange.length
    ? `${inRange.length - scheduledN} live · ${scheduledN} scheduled ${view === "day" && anchor !== todayKey ? "on this day" : unit}`
    : view === "day"
      ? "Nothing planned for this day yet."
      : `Nothing planned ${unit} yet.`;

  const href = (v: View, d: string) => `/app/calendar?view=${v}&d=${d}`;
  const isCurrent = view === "day" ? anchor === todayKey : view === "week" ? weekStart(anchor) === weekStart(todayKey) : ym === todayKey.slice(0, 7);

  // Personalised prompts.
  const next14 = Array.from({ length: 14 }, (_, i) => addDays(todayKey, i + 1));
  const open = next14.filter((d) => !(byDay.get(d) ?? []).some((p) => p.status !== "posted"));
  const todayItems = byDay.get(todayKey) ?? [];
  const prompts = buildPrompts(open, ms.dailyStreak, todayKey, todayItems.some((p) => p.status === "posted"), todayItems.some((p) => p.status !== "posted"), tz);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-10">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Content calendar</div>
          <h1 className="mt-1 font-display text-[34px] font-bold">{title}</h1>
          <p className="mt-1 text-muted">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex items-center gap-1 rounded-full border border-line-strong bg-surface p-1" aria-label="Calendar view">
            {(["day", "week", "month"] as View[]).map((v) => (
              <Link
                key={v}
                href={href(v, anchor)}
                aria-current={view === v ? "page" : undefined}
                className={`btn h-9 px-4 capitalize ${view === v ? "bg-vivid text-white" : "text-ink-2 hover:bg-hover"}`}
              >
                {v}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1 rounded-full border border-line-strong bg-surface p-1">
            <Link className="grid h-9 w-9 place-items-center rounded-full hover:bg-hover" href={href(view, shift(anchor, view, -1))} aria-label={`Previous ${view}`}><ChevronLeft className="h-4 w-4" /></Link>
            <Link className={`btn h-9 px-4 ${isCurrent ? "bg-hover text-ink" : "hover:bg-hover"}`} href={href(view, todayKey)}>Today</Link>
            <Link className="grid h-9 w-9 place-items-center rounded-full hover:bg-hover" href={href(view, shift(anchor, view, 1))} aria-label={`Next ${view}`}><ChevronRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="card min-w-0 overflow-hidden p-0">
          {view === "month" && <MonthView ym={ym} todayKey={todayKey} byDay={byDay} tz={tz} />}
          {view === "week" && <WeekView days={days} todayKey={todayKey} byDay={byDay} tz={tz} />}
          {view === "day" && <DayView day={anchor} todayKey={todayKey} items={byDay.get(anchor) ?? []} tz={tz} />}
        </section>

        {/* Try this in Claude */}
        <aside className="claude-glow h-fit rounded-3xl p-5 xl:sticky xl:top-6">
          <div className="flex items-start gap-3">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-claude text-white">
              <span className="animate-ping-soft absolute inset-0 rounded-xl bg-claude" aria-hidden />
              <ClaudeMark className="relative h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="font-display text-[17px] font-bold">Let Claude fill your calendar</div>
              <div className="mt-0.5 text-[12.5px] leading-snug text-muted">
                Claude uses what it knows about you and your past posts. One prompt writes and schedules everything in Cadence, ready for you to review here.
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2.5">
            {prompts.map((p) => <PromptCard key={p.title} {...p} />)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11.5px] text-muted">
            <Sparkles className="h-3.5 w-3.5 text-claude" /> Runs in your own Claude. No AI cost in Cadence.
          </div>
        </aside>
      </div>
    </div>
  );
}

function PostChip({ p, tz }: { p: Post; tz: string }) {
  return (
    <Link href={`/app/posts/${p.id}`} className={`block rounded-xl px-2 py-1.5 text-[12px] leading-tight transition hover:-translate-y-px hover:shadow-[var(--shadow-lift)] ${statusStyle(p)}`}>
      <div className="flex items-center gap-1 font-semibold whitespace-nowrap">
        <StatusIcon p={p} />
        {fmtTime(when(p)!, tz)}
        {p.source === "claude" && <ClaudeMark className="ml-auto h-3 w-3 opacity-60" />}
      </div>
      <div className="mt-0.5 truncate">{p.title}</div>
    </Link>
  );
}

function MonthView({ ym, todayKey, byDay, tz }: { ym: string; todayKey: string; byDay: Map<string, Post[]>; tz: string }) {
  const cells = monthGrid(ym);
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[680px]">
        <div className="grid grid-cols-7 border-b border-line">
          {WEEKDAYS.map((d) => <div key={d} className="px-3 py-3 text-[12px] font-semibold tracking-wide text-muted uppercase">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c, i) => {
            const items = byDay.get(c) ?? [];
            const inM = c.startsWith(ym);
            const isToday = c === todayKey;
            const past = c < todayKey;
            return (
              <div key={c} className={`group relative min-h-[124px] border-line p-2 ${i % 7 !== 6 ? "border-r" : ""} ${i < cells.length - 7 ? "border-b" : ""} ${inM ? "" : "bg-canvas/60"} ${isToday ? "bg-brand-soft/30" : ""}`}>
                <div className="flex items-center justify-between">
                  <Link href={`/app/calendar?view=day&d=${c}`} className={`grid h-7 min-w-7 place-items-center rounded-full px-1.5 text-[13px] font-semibold hover:bg-hover ${isToday ? "bg-brand text-white hover:bg-brand" : inM ? (past ? "text-faint" : "text-ink") : "text-faint/70"}`}>
                    {Number(c.slice(8))}
                  </Link>
                  {!past && <ScheduleDay day={c} className="grid h-7 w-7 place-items-center rounded-full bg-vivid text-white transition hover:scale-110 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100" />}
                </div>
                <div className="mt-1.5 space-y-1.5">
                  {items.slice(0, 3).map((p) => <PostChip key={p.id} p={p} tz={tz} />)}
                  {items.length > 3 && <Link href={`/app/calendar?view=day&d=${c}`} className="block px-2 text-[11px] font-medium text-muted hover:text-ink">+{items.length - 3} more</Link>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekView({ days, todayKey, byDay, tz }: { days: string[]; todayKey: string; byDay: Map<string, Post[]>; tz: string }) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[680px] grid-cols-7">
        {days.map((d, i) => {
          const items = byDay.get(d) ?? [];
          const isToday = d === todayKey;
          const past = d < todayKey;
          return (
            <div key={d} className={`flex min-h-[520px] flex-col border-line ${i < 6 ? "border-r" : ""} ${isToday ? "bg-brand-soft/25" : ""}`}>
              <Link href={`/app/calendar?view=day&d=${d}`} className="border-b border-line px-3 py-3 hover:bg-hover/60">
                <div className="text-[12px] font-semibold tracking-wide text-muted uppercase">{WEEKDAYS[i]}</div>
                <div className={`mt-1 inline-grid h-9 min-w-9 place-items-center rounded-full px-2 font-display text-xl font-bold ${isToday ? "bg-brand text-white" : past ? "text-faint" : "text-ink"}`}>{Number(d.slice(8))}</div>
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-2">
                {items.map((p) => (
                  <Link key={p.id} href={`/app/posts/${p.id}`} className={`block rounded-2xl p-2.5 transition hover:-translate-y-px hover:shadow-[var(--shadow-lift)] ${statusStyle(p)}`}>
                    <div className="flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap">
                      <StatusIcon p={p} /> {fmtTime(when(p)!, tz)}
                      {p.source === "claude" && <ClaudeMark className="ml-auto h-3 w-3 opacity-60" />}
                    </div>
                    <div className="mt-1 line-clamp-2 text-[13px] leading-snug font-semibold text-ink">{p.title}</div>
                    {p.body && <div className="mt-1 line-clamp-3 text-[11.5px] leading-snug text-muted">{p.body}</div>}
                  </Link>
                ))}
                {!past && (
                  <ScheduleDay
                    day={d}
                    label="Add post"
                    className={`mt-auto flex h-9 items-center justify-center gap-1 rounded-xl border border-dashed text-[12px] font-medium transition ${items.length ? "border-line text-faint hover:border-brand/40 hover:text-brand" : "border-line-strong text-muted hover:border-brand/40 hover:bg-brand-soft/30 hover:text-brand"}`}
                  />
                )}
                {past && !items.length && <div className="mt-auto pb-1 text-center text-[11px] text-faint">No post</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ day, todayKey, items, tz }: { day: string; todayKey: string; items: Post[]; tz: string }) {
  const hourOf = (p: Post) => Number(new Date(when(p)!).toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: tz })) % 24;
  const hours = items.map(hourOf);
  const from = Math.min(7, ...hours);
  const to = Math.max(21, ...hours);
  const past = day < todayKey;
  const nowHour = day === todayKey ? Number(new Date().toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: tz })) % 24 : -1;
  const label = (h: number) => new Date(Date.UTC(2000, 0, 1, h)).toLocaleTimeString("en-US", { hour: "numeric", timeZone: "UTC" });

  return (
    <div>
      {!items.length && (
        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-canvas px-5 py-3 text-[13px] text-muted">
          <Sparkles className="h-4 w-4 text-claude" />
          <span className="flex-1">{past ? "Nothing went out this day." : "Nothing planned yet. Pick a time below, or ask Claude to write today’s post."}</span>
        </div>
      )}
      <ol>
        {Array.from({ length: to - from + 1 }, (_, i) => from + i).map((h) => {
          const at = items.filter((p) => hourOf(p) === h);
          const slotPast = past || (nowHour >= 0 && h < nowHour);
          return (
            <li key={h} className={`group grid grid-cols-[72px_1fr] border-b border-line last:border-0 ${h === nowHour ? "bg-brand-soft/25" : ""}`}>
              <div className={`px-4 py-3 text-right text-[12px] font-medium ${h === nowHour ? "text-brand" : "text-faint"}`}>{label(h)}</div>
              <div className="flex min-h-[56px] flex-col gap-2 border-l border-line p-2">
                {at.map((p) => (
                  <Link key={p.id} href={`/app/posts/${p.id}`} className={`flex items-start gap-3 rounded-2xl p-3 transition hover:shadow-[var(--shadow-lift)] ${statusStyle(p)}`}>
                    <StatusIcon p={p} className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[12px] font-semibold">
                        {fmtTime(when(p)!, tz)} · {p.status === "posted" ? "Live" : "Scheduled"}
                        {p.source === "claude" && <span className="flex items-center gap-1 font-medium text-muted"><ClaudeMark className="h-3 w-3" /> by Claude</span>}
                      </div>
                      <div className="mt-0.5 text-[15px] font-semibold text-ink">{p.title}</div>
                      {p.body && <div className="mt-1 line-clamp-2 text-[13px] text-muted">{p.body}</div>}
                    </div>
                  </Link>
                ))}
                {!slotPast && !at.length && (
                  <ScheduleDay
                    day={day}
                    time={`${String(h).padStart(2, "0")}:00`}
                    label={`Schedule at ${label(h)}`}
                    className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-[12px] font-medium text-faint opacity-0 transition group-hover:opacity-100 hover:bg-brand-soft/40 hover:text-brand focus:opacity-100"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
