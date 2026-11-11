import { ArrowRight, ArrowUpRight, CalendarClock, ChevronRight, CircleAlert, ExternalLink, FileText, Radio } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listPosts } from "@/lib/posts";
import { fmtWhen, pillarStyle, relative } from "@/lib/format";
import { ClaudeMark } from "@/components/Logo";
import { NewPostButton } from "@/components/Sidebar";
import { RowMenu } from "@/components/RowMenu";
import { ScheduleTimeButton } from "@/components/ScheduleTimeButton";
import { getRetentionContext, type RetentionContext } from "@/lib/retention";
import { getMilestones } from "@/lib/milestones";
import { JourneyRail } from "@/components/JourneyRail";
import { CopyPrompt } from "@/components/ui/CopyButton";
import { FIRST_PROMPT, MCP_URL } from "@/components/ConnectClaude";
import { SetupHero } from "@/components/onboarding/SetupHero";
import { getOnboarding } from "@/lib/onboarding";
import { getAccount, postUrl } from "@/lib/linkedin";
import { PostsBoard, type TabKey } from "@/components/PostsBoard";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

const claudeLink = (prompt: string) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;
const PLAN_PROMPT = "Plan 3 LinkedIn posts for this week (a story, a how-to and an opinion) based on what I’m working on: [one line]. Show them to me, then schedule them in Cadence at 9am on open days.";

const TABS = [
  { key: "drafts", label: "Drafts", hint: "Ideas in progress" },
  { key: "scheduled", label: "Scheduled", hint: "Queued to go live" },
  { key: "live", label: "Live", hint: "Published on LinkedIn" },
] as const;

function greeting(tz: string) {
  const h = Number(new Date().toLocaleString("en-US", { timeZone: tz, hour: "numeric", hour12: false }));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Row({ p, tz, context }: { p: Post; tz: string; context: RetentionContext | null }) {
  const firstLine = p.body.split("\n").find((l) => l.trim()) ?? "";
  const when = p.status === "scheduled" ? p.scheduled_at : p.status === "posted" ? p.posted_at : p.updated_at;
  const live = p.status === "posted" ? postUrl(p.linkedin_urn) : null;
  return (
    <div className="group flex items-center gap-4 rounded-2xl px-4 py-4 transition hover:bg-canvas">
      <Link href={`/app/posts/${p.id}`} className="flex min-w-0 flex-1 items-center gap-4">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${p.status === "posted" ? "bg-[#e3f6ee] text-[#0c7a5e]" : p.status === "scheduled" ? "bg-[#eeebfd] text-[#4c3fbf]" : "bg-[#fdf0e1] text-[#a85a1e]"}`}>{p.status === "posted" ? <Radio className="h-4 w-4" /> : p.status === "scheduled" ? <CalendarClock className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-ink">{p.title || "Untitled post"}</span>
            {p.status === "failed" && <span className="chip h-5 bg-danger-soft text-danger"><CircleAlert className="h-3 w-3" />Failed</span>}
            {p.simulated && <span className="chip h-5 bg-hover text-muted">Demo</span>}
          </div>
          <p className="mt-0.5 truncate text-[13px] text-muted">{firstLine || "Empty draft. Start writing"}</p>
        </div>
        {p.status !== "scheduled" && (
          <div className="hidden shrink-0 text-right sm:block">
            <div className="text-[13px] font-semibold text-ink-2">{relative(when)}</div>
            <div className="text-xs text-faint">{p.status === "posted" ? "went live" : "last edited"}</div>
          </div>
        )}
      </Link>
      {p.status === "scheduled" && p.scheduled_at && (
        <ScheduleTimeButton id={p.id} scheduledAt={new Date(p.scheduled_at).toISOString()} label={fmtWhen(p.scheduled_at, tz)} sub={relative(p.scheduled_at)} />
      )}
      {(p.status === "draft" || p.status === "failed") && <RowMenu id={p.id} title={p.title} hasContent={p.body.trim().length > 0} fromClaude={p.source === "claude"} context={context} />}
      {live ? (
        <a href={live} target="_blank" rel="noreferrer" title="View on LinkedIn" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-hover text-muted transition hover:bg-linkedin hover:text-white"><ExternalLink className="h-3.5 w-3.5" /></a>
      ) : (
        <Link href={`/app/posts/${p.id}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-hover text-muted transition group-hover:bg-brand group-hover:text-white"><ChevronRight className="h-4 w-4" /></Link>
      )}
    </div>
  );
}

function Card({ p, tz, context }: { p: Post; tz: string; context: RetentionContext | null }) {
  const when = p.status === "scheduled" ? p.scheduled_at : p.status === "posted" ? p.posted_at : p.updated_at;
  const live = p.status === "posted" ? postUrl(p.linkedin_urn) : null;
  return (
    <div className="group relative flex flex-col rounded-2xl border border-line bg-surface p-4 transition hover:z-10 focus-within:z-20 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-lift)]">
      <Link href={`/app/posts/${p.id}`} className="flex flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className={`chip h-6 text-[11px] font-semibold ${p.status === "posted" ? "bg-[#e3f6ee] text-[#0c7a5e]" : p.status === "scheduled" ? "bg-[#eeebfd] text-[#4c3fbf]" : p.status === "failed" ? "bg-danger-soft text-danger" : "bg-[#fdf0e1] text-[#a85a1e]"}`}>
            {p.status === "posted" ? <Radio className="h-3 w-3" /> : p.status === "scheduled" ? <CalendarClock className="h-3 w-3" /> : p.status === "failed" ? <CircleAlert className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            {p.status === "posted" ? "Live" : p.status === "scheduled" ? "Scheduled" : p.status === "failed" ? "Failed" : "Draft"}
          </span>
          {p.simulated && <span className="chip h-6 bg-hover text-[11px] text-muted">Demo</span>}
          {p.source === "claude" && <ClaudeMark className="ml-auto h-3.5 w-3.5 text-claude" />}
        </div>
        <div className="mt-3 line-clamp-2 font-display text-[16px] leading-snug font-bold text-ink">{p.title || "Untitled post"}</div>
        <p className="mt-2 line-clamp-5 flex-1 text-[13px] leading-relaxed whitespace-pre-line text-muted">{p.body.trim() || "Empty draft. Start writing"}</p>
      </Link>
      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
        {p.status === "scheduled" && p.scheduled_at ? (
          <div className="-ml-2.5 mr-auto">
            <ScheduleTimeButton id={p.id} scheduledAt={new Date(p.scheduled_at).toISOString()} label={fmtWhen(p.scheduled_at, tz)} sub={relative(p.scheduled_at)} align="left" />
          </div>
        ) : (
          <div className="mr-auto text-[12px] text-faint">{p.status === "posted" ? "Went live" : "Edited"} {relative(when)}</div>
        )}
        {(p.status === "draft" || p.status === "failed") && <RowMenu id={p.id} title={p.title} hasContent={p.body.trim().length > 0} fromClaude={p.source === "claude"} context={context} />}
        {live ? (
          <a href={live} target="_blank" rel="noreferrer" title="View on LinkedIn" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-hover text-muted transition hover:bg-linkedin hover:text-white"><ExternalLink className="h-3.5 w-3.5" /></a>
        ) : (
          <Link href={`/app/posts/${p.id}`} aria-label="Open post" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-hover text-muted transition group-hover:bg-brand group-hover:text-white"><ChevronRight className="h-4 w-4" /></Link>
        )}
      </div>
    </div>
  );
}

function Empty({ tab, drafts, scheduled }: { tab: TabKey; drafts: number; scheduled: number }) {
  if (tab === "live")
    return (
      <div className="grid items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="eyebrow">Nothing live yet</div>
          <h3 className="mt-2 font-display text-[30px] leading-tight font-bold">Your first post is one prompt away.</h3>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
            Accounts that post 2–5 times a week get <b className="text-ink-2">1,182 more impressions per post</b> than once-a-week posters (Buffer, 2M+ posts). The hardest post is the first one, so let Claude draft it with you.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={claudeLink(FIRST_PROMPT)} target="_blank" rel="noreferrer" className="btn-primary h-11 px-5"><ClaudeMark className="h-4 w-4" /> Write it with Claude <ArrowUpRight className="h-4 w-4" /></a>
            <NewPostButton className="btn-secondary h-11 px-5" label="Write it myself" />
          </div>
          {(drafts > 0 || scheduled > 0) && (
            <p className="mt-4 text-[13px] text-muted">
              {scheduled > 0 ? <>You have <b className="text-ink-2">{scheduled} scheduled</b>. They’ll appear here once they go live. </> : null}
              {drafts > 0 && <Link href="/app?tab=drafts" className="font-semibold text-brand hover:underline">Or publish one of your {drafts} draft{drafts > 1 ? "s" : ""} →</Link>}
            </p>
          )}
        </div>
        <ol className="space-y-3">
          {[
            ["Tell Claude what happened this week", "A win, a lesson, an opinion. Rough is fine."],
            ["Say “save it to Cadence”", "It lands in Drafts with a live LinkedIn preview."],
            ["Publish or schedule", "It goes live on your profile and shows up here."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3 rounded-2xl bg-canvas p-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-vivid text-[12px] font-bold text-white">{i + 1}</span>
              <div><div className="text-[14px] font-semibold">{t}</div><div className="text-[13px] text-muted">{d}</div></div>
            </li>
          ))}
        </ol>
      </div>
    );
  if (tab === "scheduled")
    return (
      <div className="px-6 py-12 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-hover text-ink-2"><CalendarClock className="h-6 w-6" /></div>
        <h3 className="mt-4 font-display text-2xl font-bold">Nothing queued yet</h3>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">Line up a few posts and Cadence publishes them on time, even when you’re offline. Three a week is a great rhythm.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={claudeLink(PLAN_PROMPT)} target="_blank" rel="noreferrer" className="btn-primary h-11 px-5"><ClaudeMark className="h-4 w-4" /> Plan my week with Claude <ArrowUpRight className="h-4 w-4" /></a>
          {drafts > 0 ? (
            <Link href="/app?tab=drafts" className="btn-secondary h-11 px-5">Schedule a draft <ArrowRight className="h-4 w-4" /></Link>
          ) : (
            <Link href="/app/calendar" className="btn-secondary h-11 px-5">Open calendar</Link>
          )}
        </div>
      </div>
    );
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-hover text-ink-2"><FileText className="h-6 w-6" /></div>
      <h3 className="mt-4 font-display text-2xl font-bold">Your ideas start here</h3>
      <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">Tell Claude what’s on your mind and say <b className="text-ink-2">“save it to Cadence”</b>. It lands here as a draft, ready to polish and schedule.</p>
      <div className="mx-auto mt-6 max-w-lg"><CopyPrompt text={FIRST_PROMPT} /></div>
    </div>
  );
}

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ tab?: string; view?: string }> }) {
  const user = await requireUser("/app");
  const [posts, onboarding, acct, journey, sp] = await Promise.all([listPosts(user.id), getOnboarding(user.id), getAccount(user.id), getMilestones(user.id, user.timezone), searchParams]);
  const groups: Record<TabKey, Post[]> = {
    drafts: posts.filter((p) => p.status === "draft" || p.status === "failed"),
    scheduled: posts.filter((p) => p.status === "scheduled" || p.status === "publishing").sort((a, b) => +new Date(a.scheduled_at!) - +new Date(b.scheduled_at!)),
    live: posts.filter((p) => p.status === "posted"),
  };
  const requested = sp.tab as TabKey | undefined;
  const layout = sp.view === "grid" ? "grid" : "list";
  const tab: TabKey = requested && requested in groups ? requested : groups.drafts.length ? "drafts" : groups.scheduled.length ? "scheduled" : "live";
  // Stage-aware retention copy for the delete dialog (drafts only), reusing the milestones already loaded
  const context = groups.drafts.length ? await getRetentionContext(user.id, posts, user.timezone, user.weekly_goal, journey) : null;
  const postedDays = new Set(posts.filter((p) => p.status === "posted" && !p.simulated && p.posted_at).map((p) => new Date(p.posted_at!).toISOString().slice(0, 10)));
  const scheduledDays = new Set(
    groups.scheduled.filter((p) => p.scheduled_at).map((p) => new Date(p.scheduled_at!).toISOString().slice(0, 10)).filter((d) => !postedDays.has(d)),
  ).size;
  const today = new Date().toLocaleDateString("en-US", { timeZone: user.timezone, weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">{today}</div>
          <h1 className="mt-1 font-display text-[34px] font-bold">{greeting(user.timezone)}, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-muted">{!onboarding.complete ? "Finish setup below and your first post is minutes away." : "Everything you’re working on, from first draft to live post."}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/dashboard" className="btn-secondary hidden md:inline-flex">Dashboard</Link>
          <NewPostButton className="btn-primary hidden md:inline-flex" />
        </div>
      </header>

      <div className="mt-8 space-y-6">
        {!onboarding.complete && (
          <SetupHero
            firstName={user.name.split(" ")[0]}
            linkedin={{ done: onboarding.linkedin, name: acct?.name ?? null, picture: acct?.picture ?? null }}
            claude={onboarding.claude}
            firstPost={onboarding.firstPost}
            isDemo={onboarding.isDemo}
            mcpUrl={MCP_URL()}
          />
        )}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <PostsBoard
            initialTab={tab}
            initialLayout={layout}
            tabs={TABS.map(({ key, label, hint }) => ({
              key,
              label,
              hint,
              count: groups[key].length,
              rows: groups[key].map((p) => <Row key={p.id} p={p} tz={user.timezone} context={context} />),
              cards: groups[key].map((p) => <Card key={p.id} p={p} tz={user.timezone} context={context} />),
              empty: <Empty tab={key} drafts={groups.drafts.length} scheduled={groups.scheduled.length} />,
            }))}
          />
        </section>
          <JourneyRail list={journey.list} next={journey.next} days={journey.days} dailyStreak={journey.dailyStreak} scheduledDays={scheduledDays} />
        </div>
      </div>
    </div>
  );
}
