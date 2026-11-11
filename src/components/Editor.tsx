"use client";

import {
  ArrowLeft, Bold, CalendarClock, Check, ChevronDown, Copy, ExternalLink, ImagePlus, Italic, List,
  ListChecks, Loader2, MoveRight, RemoveFormatting, Send, Trash2, X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LinkedInPreview } from "./LinkedInPreview";
import { ScheduleMenu, at, toLocalInput } from "./ScheduleMenu";
import { DeleteDraftDialog, type DeleteTarget } from "./DeleteDraftDialog";
import type { RetentionContext } from "@/lib/retention";
import { useToast } from "./ui/Toast";
import { toggleStyle, toPlain } from "@/lib/unicode";
import { MAX_CHARS, type Post } from "@/lib/types";

type Author = { name: string; headline: string; picture: string | null };


export function Editor({ initial, author, linkedinConnected, linkedinUrl, initialWhen, retention }: { initial: Post; author: Author; linkedinConnected: boolean; linkedinUrl: string | null; initialWhen?: string; retention?: RetentionContext | null }) {
  const router = useRouter();
  const { toast, confirm } = useToast();
  const [post, setPost] = useState(initial);
  const [body, setBody] = useState(initial.body);
  const [title, setTitle] = useState(initial.title);
  const [pillar, setPillar] = useState(initial.pillar);
  const [save, setSave] = useState<"saved" | "saving" | "dirty" | "error">("saved");
  const [busy, setBusy] = useState<null | "schedule" | "publish" | "image">(null);
  const presetWhen = initialWhen && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(initialWhen) ? initialWhen : null;
  const [scheduleOpen, setScheduleOpen] = useState(Boolean(presetWhen));
  const [when, setWhen] = useState(presetWhen ?? (initial.scheduled_at ? toLocalInput(new Date(initial.scheduled_at)) : toLocalInput(at(1, 9))));
  const [tz, setTz] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const ta = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => setTz(Intl.DateTimeFormat().resolvedOptions().timeZone), []);
  useEffect(() => {
    if (!scheduleOpen) return;
    const close = (e: MouseEvent) => { if (popRef.current && !popRef.current.contains(e.target as Node)) setScheduleOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [scheduleOpen]);


  const locked = post.status === "posted" || post.status === "publishing";
  const count = body.length;

  // Debounced autosave
  useEffect(() => {
    if (locked || (body === post.body && title === post.title && pillar === post.pillar)) return;
    setSave("dirty");
    const t = setTimeout(async () => {
      setSave("saving");
      const res = await fetch(`/api/posts/${post.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, title, pillar }) });
      const data = await res.json();
      if (res.ok) { setPost(data); setSave("saved"); }
      else { setSave("error"); toast({ tone: "error", title: "Couldn’t save", body: data.error }); }
    }, 700);
    return () => clearTimeout(t);
  }, [body, title, pillar, post, locked, toast]);

  async function patch(extra: Record<string, unknown>) {
    const res = await fetch(`/api/posts/${post.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, title, pillar, ...extra }) });
    const data = await res.json();
    if (!res.ok) { toast({ tone: "error", title: "Something went wrong", body: data.error }); return null; }
    setPost(data);
    setSave("saved");
    router.refresh();
    return data as Post;
  }

  async function schedule(d: Date | null): Promise<boolean> {
    setBusy("schedule");
    const p = await patch({ scheduled_at: d ? d.toISOString() : null });
    setBusy(null);
    if (!p) return false;
    if (d) setWhen(toLocalInput(d));
    else {
      setScheduleOpen(false);
      toast({ tone: "info", title: "Moved back to drafts" });
    }
    return true;
  }

  async function publishNow() {
    const ok = await confirm(
      linkedinConnected
        ? { title: "Publish to LinkedIn now?", body: "This post will go live on your LinkedIn profile immediately.", confirm: "Publish now" }
        : { title: "Publish in demo mode?", body: "LinkedIn isn’t connected, so nothing will be sent to LinkedIn. The post will be marked as published so you can see the full flow.", confirm: "Publish (demo)" },
    );
    if (!ok) return;
    setBusy("publish");
    if (save !== "saved") await patch({});
    const res = await fetch(`/api/posts/${post.id}/publish`, { method: "POST" });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) return toast({ tone: "error", title: "Couldn’t publish", body: data.error });
    setPost(data);
    router.refresh();
    if (data.status === "failed") toast({ tone: "error", title: "LinkedIn rejected the post", body: data.error });
    else toast({ tone: "success", title: data.simulated ? "Published (demo)" : "Live on LinkedIn 🎉" });
  }

  function remove() {
    setDeleteTarget({ id: post.id, title, hasContent: body.trim().length > 0, fromClaude: post.source === "claude" });
  }


  function applyStyle(style: "bold" | "italic" | "plain") {
    const el = ta.current;
    if (!el || locked) return;
    const { selectionStart: s, selectionEnd: e } = el;
    if (s === e) return toast({ tone: "info", title: "Select some text first" });
    const sel = body.slice(s, e);
    const next = style === "plain" ? toPlain(sel) : toggleStyle(sel, style);
    setBody(body.slice(0, s) + next + body.slice(e));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s, s + next.length); });
  }

  function prefixLines(prefix: string) {
    const el = ta.current;
    if (!el || locked) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const start = body.lastIndexOf("\n", s - 1) + 1;
    const chunk = body.slice(start, e).split("\n").map((l) => (l.startsWith(prefix) ? l.slice(prefix.length) : prefix + l)).join("\n");
    setBody(body.slice(0, start) + chunk + body.slice(e));
  }

  async function uploadImage(file: File) {
    setBusy("image");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/images", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) { setBusy(null); return toast({ tone: "error", title: "Upload failed", body: data.error }); }
    await patch({ image_id: data.id });
    setBusy(null);
  }

  const status = {
    draft: { label: "Draft", cls: "bg-hover text-ink-2" },
    scheduled: { label: "Scheduled", cls: "bg-brand-soft text-brand-ink" },
    publishing: { label: "Publishing…", cls: "bg-warn-soft text-warn" },
    posted: { label: post.simulated ? "Published · demo" : "Published", cls: "bg-success-soft text-success" },
    failed: { label: "Failed", cls: "bg-danger-soft text-danger" },
  }[post.status];


  return (
    <div className="min-h-screen">
      {/* Top action bar */}
      <div className="sticky top-0 z-10 border-b border-line bg-surface/85 backdrop-blur-md md:top-0">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2 px-4 py-2.5 sm:px-6">
          <Link href="/app" className="btn-ghost h-8 px-2" aria-label="Back to posts"><ArrowLeft className="h-4 w-4" /></Link>
          <input
            value={title}
            disabled={locked}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1 font-display text-[15px] font-semibold outline-none hover:bg-hover focus:bg-hover sm:max-w-sm"
            aria-label="Post title"
          />
          <span className={`chip ${status.cls}`}>{status.label}</span>
          <span className="hidden items-center gap-1 text-xs text-faint sm:flex">
            {save === "saving" ? <><Loader2 className="h-3 w-3 animate-spin" />Saving</> : save === "dirty" ? "Editing…" : save === "error" ? <span className="text-danger">Not saved</span> : !locked && <><Check className="h-3 w-3" />Saved</>}
          </span>
          {post.status === "posted" && linkedinUrl && (
            <a href={linkedinUrl} target="_blank" rel="noreferrer" className="btn-secondary ml-auto h-8">View on LinkedIn <ExternalLink className="h-3.5 w-3.5" /></a>
          )}
        </div>
      </div>

      {(post.status === "failed" && post.error) || (post.status === "posted" && post.simulated) ? (
        <div className="mx-auto max-w-[1400px] px-4 pt-5 sm:px-6">
          {post.status === "failed" && post.error && (
            <div className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-[13px] text-danger">{post.error}</div>
          )}
          {post.status === "posted" && post.simulated && (
            <div className="rounded-2xl border border-warn/20 bg-warn-soft px-4 py-3 text-[13px] text-warn">
              Published in demo mode, so nothing was sent to LinkedIn. <Link href="/app/settings#linkedin" className="font-medium underline">Connect LinkedIn</Link> to post for real.
            </div>
          )}
        </div>
      ) : null}

      {/* Composer + Preview: two equal panels, same size */}
      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 sm:px-6 lg:h-[calc(100vh-64px)] lg:min-h-[620px] lg:grid-cols-2 lg:py-6">
        {/* Composer: styled like LinkedIn's own "Create post" box */}
        <section className="flex min-h-[520px] min-w-0 flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-3 px-6 pt-5 pb-3">
            {author.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={author.picture} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#dbe7f3] text-sm font-semibold text-[#0a66c2]">
                {author.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[16px] font-semibold">{author.name}</div>
              <div className="truncate text-[13px] text-muted">{author.headline || "Posting to your LinkedIn profile"}</div>
            </div>
          </div>

          <textarea
            ref={ta}
            value={body}
            disabled={locked}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What do you want to talk about?"
            className="min-h-[220px] w-full flex-1 resize-none bg-transparent px-6 py-2 text-[16px] leading-7 text-ink outline-none placeholder:text-[18px] placeholder:text-faint disabled:text-ink-2"
          />

          {post.image_id && (
            <div className="mx-6 mb-3 flex items-center gap-3 rounded-2xl border border-line p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/images/${post.image_id}`} alt="" className="h-14 w-14 rounded-xl object-cover" />
              <span className="flex-1 text-[13px] text-muted">Image attached</span>
              {!locked && <button className="btn-ghost h-8 text-muted" onClick={() => patch({ image_id: null })}><X className="h-4 w-4" />Remove</button>}
            </div>
          )}

          {/* Bottom toolbar, LinkedIn-style round icon buttons */}
          <div className="flex flex-wrap items-center gap-1 px-5 pb-3">
            {[
              { t: "Bold (select text)", f: () => applyStyle("bold"), i: <Bold className="h-[18px] w-[18px]" /> },
              { t: "Italic (select text)", f: () => applyStyle("italic"), i: <Italic className="h-[18px] w-[18px]" /> },
              { t: "Clear formatting", f: () => applyStyle("plain"), i: <RemoveFormatting className="h-[18px] w-[18px]" /> },
              { t: "Bullet list", f: () => prefixLines("• "), i: <List className="h-[18px] w-[18px]" /> },
              { t: "Arrow list", f: () => prefixLines("→ "), i: <MoveRight className="h-[18px] w-[18px]" /> },
              { t: "Checklist", f: () => prefixLines("✅ "), i: <ListChecks className="h-[18px] w-[18px]" /> },
            ].map((b) => (
              <button key={b.t} title={b.t} aria-label={b.t} disabled={locked} onMouseDown={(e) => e.preventDefault()} onClick={b.f}
                className="grid h-10 w-10 place-items-center rounded-full text-ink-2 transition hover:bg-hover hover:text-ink disabled:opacity-40">
                {b.i}
              </button>
            ))}
            <button title="Add image" aria-label="Add image" disabled={locked || busy === "image"} onClick={() => fileRef.current?.click()}
              className="grid h-10 w-10 place-items-center rounded-full text-ink-2 transition hover:bg-hover hover:text-ink disabled:opacity-40">
              {busy === "image" ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <ImagePlus className="h-[18px] w-[18px]" />}
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
            <span className={`ml-auto pr-1 text-[12px] ${count > MAX_CHARS ? "font-semibold text-danger" : count > MAX_CHARS * 0.9 ? "text-warn" : "text-faint"}`}>
              {count.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          </div>

          {/* Action footer: secondary actions left, one confident primary action right */}
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3">
            <button
              className="btn-secondary h-10 px-4"
              disabled={!body.trim()}
              onClick={async () => { await navigator.clipboard.writeText(body); toast({ tone: "success", title: "Copied to clipboard" }); }}
            >
              <Copy className="h-4 w-4" /> Copy
            </button>
            {!locked && (
              <button className="grid h-10 w-10 place-items-center rounded-full text-muted transition hover:bg-danger-soft hover:text-danger" title="Delete" aria-label="Delete post" onClick={remove}>
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            {!locked ? (
              <div className="ml-auto flex items-center gap-2">
                {post.status === "scheduled" && post.scheduled_at && (
                  <button onClick={() => setScheduleOpen(true)} className="chip h-8 bg-brand-soft px-3 text-[12px] text-brand-ink hover:ring-1 hover:ring-brand/30" title="Change schedule">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Goes live {tz ? new Date(post.scheduled_at).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" }) : "…"}
                  </button>
                )}
                <div className="relative flex" ref={popRef}>
                  <button
                    className="btn-brand h-10 rounded-r-none pr-4 pl-5"
                    disabled={!body.trim() || count > MAX_CHARS || busy === "publish"}
                    onClick={publishNow}
                    title="Post to your LinkedIn right now"
                  >
                    {busy === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Publish now
                  </button>
                  <button
                    className="btn-brand h-10 rounded-l-none border-l border-white/20 px-3"
                    aria-label="More publishing options"
                    aria-expanded={scheduleOpen}
                    onClick={() => setScheduleOpen((v) => !v)}
                  >
                    <ChevronDown className={`h-4 w-4 transition ${scheduleOpen ? "rotate-180" : ""}`} />
                  </button>

                  {scheduleOpen && (
                    <ScheduleMenu
                      isScheduled={post.status === "scheduled"}
                      canSchedule={Boolean(body.trim())}
                      initialWhen={when}
                      initialPicked={presetWhen ? new Date(presetWhen) : null}
                      onSchedule={schedule}
                      onPublishNow={publishNow}
                      onClose={() => setScheduleOpen(false)}
                    />
                  )}
                </div>
              </div>
            ) : post.status === "posted" && linkedinUrl ? (
              <a href={linkedinUrl} target="_blank" rel="noreferrer" className="btn-linkedin ml-auto h-10">View on LinkedIn <ExternalLink className="h-3.5 w-3.5" /></a>
            ) : null}
          </div>
        </section>

        {/* Preview: the hero */}
        <LinkedInPreview author={author} body={body} imageUrl={post.image_id ? `/api/images/${post.image_id}` : null} />
      </div>
      <DeleteDraftDialog
        target={deleteTarget}
        context={retention}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => { setDeleteTarget(null); toast({ tone: "info", title: "Post deleted" }); router.push("/app"); router.refresh(); }}
        onScheduled={(d) => {
          setDeleteTarget(null);
          setPost((p) => ({ ...p, status: "scheduled", scheduled_at: d.toISOString() }));
          setWhen(toLocalInput(d));
          toast({ tone: "success", title: "Scheduled. Nice!", body: `It goes live ${d.toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" })}.` });
          router.refresh();
        }}
      />
    </div>
  );
}
