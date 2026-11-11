"use client";

import { CalendarX2, FileText, Loader2, MoreHorizontal, PenLine, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { DeleteDraftDialog, type DeleteTarget } from "./DeleteDraftDialog";
import type { RetentionContext } from "@/lib/retention";
import { useToast } from "./ui/Toast";

/**
 * Quiet "⋯" menu on a post row or card.
 *  - drafts: open, or delete through the retention dialog
 *  - scheduled: open, or delete with a plain confirm that offers "move to drafts" as the softer option
 */
export function RowMenu({
  id,
  title,
  hasContent,
  fromClaude,
  context,
  kind = "draft",
  whenLabel,
}: {
  id: string;
  title: string;
  hasContent: boolean;
  fromClaude: boolean;
  context: RetentionContext | null;
  kind?: "draft" | "scheduled";
  whenLabel?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<DeleteTarget | null>(null);
  const [confirmScheduled, setConfirmScheduled] = useState(false);
  const [busy, setBusy] = useState<null | "delete" | "unschedule">(null);
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (!confirmScheduled) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && busy === null && setConfirmScheduled(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmScheduled, busy]);

  async function deleteScheduled() {
    setBusy("delete");
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok || data.ok === false) return toast({ tone: "error", title: "Couldn’t delete it", body: "It may be publishing right now. Try again in a minute." });
    setConfirmScheduled(false);
    toast({ tone: "info", title: "Scheduled post deleted", body: "It won’t go live." });
    start(() => router.refresh());
  }

  async function moveToDrafts() {
    setBusy("unschedule");
    const res = await fetch(`/api/posts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduled_at: null }) });
    setBusy(null);
    if (!res.ok) return toast({ tone: "error", title: "Couldn’t move it to drafts" });
    setConfirmScheduled(false);
    toast({ tone: "info", title: "Moved back to drafts", body: "It won’t go live until you schedule it again." });
    start(() => router.refresh());
  }

  const scheduled = kind === "scheduled";

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        aria-label="More actions"
        onClick={() => setOpen((o) => !o)}
        className={`grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-hover hover:text-ink ${open ? "bg-hover" : "md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"}`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="animate-pop absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-2xl border border-line bg-surface py-1 text-[13px]" style={{ boxShadow: "var(--shadow-pop)" }}>
          <Link href={`/app/posts/${id}`} className="flex items-center gap-2 px-3 py-2 hover:bg-hover"><PenLine className="h-4 w-4 text-muted" /> {scheduled ? "Open post" : "Open draft"}</Link>
          <button
            onClick={() => {
              setOpen(false);
              if (scheduled) setConfirmScheduled(true);
              else setTarget({ id, title, hasContent, fromClaude });
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-danger hover:bg-danger-soft"
          >
            <Trash2 className="h-4 w-4" /> {scheduled ? "Delete post" : "Delete draft"}
          </button>
        </div>
      )}

      {/* Dialogs render on <body>: a transformed ancestor (card hover lift) would otherwise trap position:fixed */}
      {!scheduled && target && createPortal(
        <DeleteDraftDialog
          target={target}
          context={context}
          onClose={() => setTarget(null)}
          onDeleted={() => { setTarget(null); toast({ tone: "info", title: "Draft deleted" }); start(() => router.refresh()); }}
          onScheduled={(d) => {
            setTarget(null);
            toast({ tone: "success", title: "Scheduled. Nice!", body: `It goes live ${d.toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" })}.` });
            start(() => router.refresh());
          }}
        />,
        document.body,
      )}

      {confirmScheduled && createPortal(
        <div className="fixed inset-0 z-50 grid place-items-center bg-plum-deep/30 p-4 backdrop-blur-[2px]" onClick={() => busy === null && setConfirmScheduled(false)}>
          <div className="animate-pop relative w-full max-w-md rounded-3xl bg-surface p-6 text-left shadow-[var(--shadow-pop)]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby={`del-s-${id}`}>
            <button onClick={() => setConfirmScheduled(false)} aria-label="Close" className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-hover hover:text-ink"><X className="h-4 w-4" /></button>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-danger-soft text-danger"><CalendarX2 className="h-5 w-5" /></span>
            <h3 id={`del-s-${id}`} className="mt-4 pr-8 font-display text-xl font-bold">Delete this scheduled post?</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              “{title || "Untitled post"}” {whenLabel ? <>is set to go live <b className="text-ink-2">{whenLabel}</b>. </> : null}Deleting removes it for good, and it won’t be published.
            </p>
            <p className="mt-2 text-[13px] text-muted">Not ready yet? Move it back to drafts and keep the writing.</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button className="btn-secondary" disabled={busy !== null} onClick={moveToDrafts}>
                {busy === "unschedule" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Move to drafts
              </button>
              <button className="btn bg-danger text-white hover:brightness-110" disabled={busy !== null} onClick={deleteScheduled}>
                {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete post
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
