"use client";

import { ArrowUpRight, CalendarClock, Flame, Gift, Loader2, Sparkles, TrendingUp, UserRound, X } from "lucide-react";
import type { RetentionContext } from "@/lib/retention";
import { useEffect, useState } from "react";
import { ClaudeMark } from "./Logo";

export type DeleteTarget = { id: string; title: string; hasContent: boolean; fromClaude?: boolean };

/** Renders "**bold**" markers from the server-built copy. */
function Rich({ text }: { text: string }) {
  return <>{text.split("**").map((part, i) => (i % 2 ? <b key={i} className="text-ink">{part}</b> : <span key={i}>{part}</span>))}</>;
}

/**
 * Deleting a draft is the moment someone is about to give up on posting.
 * For drafts with content we show sourced proof that consistency pays off, the
 * user's own next reward, and better alternatives than deleting. "Delete anyway"
 * stays clearly available (no dark patterns). Empty drafts get a plain, quick confirm.
 */
export function DeleteDraftDialog({
  target,
  context,
  onClose,
  onDeleted,
  onScheduled,
}: {
  target: DeleteTarget | null;
  /** Stage-aware copy computed from the user's real activity (see lib/retention.ts). */
  context?: RetentionContext | null;
  onClose: () => void;
  onDeleted: () => void;
  onScheduled: (when: Date) => void;
}) {
  const [busy, setBusy] = useState<null | "delete" | "schedule">(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setBusy(null);
    setError("");
    if (!target) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target, onClose]);

  if (!target) return null;
  const title = target.title || "Untitled post";

  async function del() {
    setBusy("delete");
    const res = await fetch(`/api/posts/${target!.id}`, { method: "DELETE" });
    if (!res.ok) { setBusy(null); return setError("Couldn’t delete the draft. Try again."); }
    onDeleted();
  }

  async function scheduleTomorrow() {
    setBusy("schedule");
    const d = new Date();
    if (context?.stage === "streak_at_risk" && d.getDay() === 0) {
      // Sunday: tomorrow is already next week, so schedule within this week to save the streak.
      d.setMinutes(d.getMinutes() + 60, 0, 0);
    } else {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    }
    const res = await fetch(`/api/posts/${target!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduled_at: d.toISOString() }) });
    if (!res.ok) { setBusy(null); return setError((await res.json().catch(() => ({}))).error || "Couldn’t schedule it."); }
    onScheduled(d);
  }

  const reworkPrompt = `Help me improve my Cadence draft "${title}". Read it with get_post, suggest a sharper hook and tighter structure, then update it in Cadence.`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-plum-deep/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="animate-pop relative w-full max-w-lg rounded-3xl bg-surface shadow-[var(--shadow-pop)]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="del-title">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-hover hover:text-ink"><X className="h-4 w-4" /></button>

        {!target.hasContent ? (
          <div className="p-6">
            <h3 id="del-title" className="font-display text-xl font-bold">Delete this empty draft?</h3>
            <p className="mt-2 text-[14px] text-muted">“{title}” has no text yet.</p>
            {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn bg-danger text-white hover:brightness-110" disabled={busy !== null} onClick={del}>
                {busy === "delete" && <Loader2 className="h-4 w-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 pb-4">
              <div className="eyebrow">Before you delete</div>
              <h3 id="del-title" className="mt-1 pr-8 font-display text-[22px] leading-tight font-bold">{context?.headline ?? "This draft could be the post that gets you seen."}</h3>
              <p className="mt-2 text-[14px] text-muted">“{title}” is already written. Most of the work is done.</p>

              <div className="mt-5 space-y-2.5">
                {/* Personal, data-backed lines for this user's stage */}
                {context?.lines.map((l) => (
                  <div key={l} className="flex gap-3 rounded-2xl bg-canvas p-3.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-ink shadow-[var(--shadow-soft)]">
                      {context.stage === "streak_at_risk" ? <Flame className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                    </span>
                    <span className="self-center text-[13px] leading-snug text-ink-2"><Rich text={l} /></span>
                  </div>
                ))}
                {target.fromClaude && (
                  <div className="flex gap-3 rounded-2xl bg-canvas p-3.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-claude shadow-[var(--shadow-soft)]"><ClaudeMark className="h-4 w-4" /></span>
                    <span className="self-center text-[13px] leading-snug text-ink-2"><b className="text-ink">Claude already wrote this.</b> It just needs your OK.</span>
                  </div>
                )}

                {/* Industry proof, only for people without a track record yet */}
                {(context?.showProof ?? true) && (
                  <>
                    <a href="https://buffer.com/resources/how-often-to-post-on-linkedin/" target="_blank" rel="noreferrer" className="flex gap-3 rounded-2xl bg-canvas p-3.5 transition hover:bg-hover">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-ink shadow-[var(--shadow-soft)]"><TrendingUp className="h-4 w-4" /></span>
                      <span className="text-[13px] leading-snug text-ink-2">
                        Accounts posting <b className="text-ink">2–5× a week</b> get <b className="text-ink">+1,182 impressions per post</b> vs. once a week.
                        <span className="mt-0.5 block text-[11px] text-faint">Buffer · 2M+ LinkedIn posts, 2025 ↗</span>
                      </span>
                    </a>
                    {context?.stage === "new" && (
                      <a href="https://www.linkedin.com/business/marketing/blog/linkedin-ads/why-you-should-be-marketing-on-linkedin-right-now" target="_blank" rel="noreferrer" className="flex gap-3 rounded-2xl bg-canvas p-3.5 transition hover:bg-hover">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-ink shadow-[var(--shadow-soft)]"><Sparkles className="h-4 w-4" /></span>
                        <span className="text-[13px] leading-snug text-ink-2">
                          LinkedIn Pages that post <b className="text-ink">weekly</b> see <b className="text-ink">5.6× more follower growth</b>.
                          <span className="mt-0.5 block text-[11px] text-faint">LinkedIn Marketing ↗</span>
                        </span>
                      </a>
                    )}
                  </>
                )}

                {context?.reward && (
                  <div className="flex gap-3 rounded-2xl border border-brand/25 bg-brand-soft/50 p-3.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-brand shadow-[var(--shadow-soft)]"><Gift className="h-4 w-4" /></span>
                    <span className="self-center text-[13px] leading-snug text-ink-2"><Rich text={context.reward} /></span>
                  </div>
                )}
              </div>
            </div>

            {/* Better alternatives */}
            <div className="space-y-2 border-t border-line p-6 pt-5">
              <button className="btn-primary h-11 w-full" disabled={busy !== null} onClick={scheduleTomorrow}>
                {busy === "schedule" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
                {context?.stage === "streak_at_risk" ? "Schedule it and keep my streak" : "Schedule it for tomorrow, 9 AM"}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <a href={`https://claude.ai/new?q=${encodeURIComponent(reworkPrompt)}`} target="_blank" rel="noreferrer" className="btn-secondary h-11" onClick={onClose}>
                  <ClaudeMark className="h-4 w-4 text-claude" /> Polish with Claude <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
                <button className="btn-secondary h-11" onClick={onClose}>Keep as draft</button>
              </div>
              {error && <p className="text-center text-[13px] text-danger">{error}</p>}
              <button className="mx-auto mt-1 flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-danger" disabled={busy !== null} onClick={del}>
                {busy === "delete" && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Delete anyway
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
