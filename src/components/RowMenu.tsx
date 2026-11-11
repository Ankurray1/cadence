"use client";

import { MoreHorizontal, PenLine, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { DeleteDraftDialog, type DeleteTarget } from "./DeleteDraftDialog";
import type { RetentionContext } from "@/lib/retention";
import { useToast } from "./ui/Toast";

/** Quiet "⋯" menu on a draft row: open, or delete (through the retention dialog). */
export function RowMenu({ id, title, hasContent, fromClaude, context }: { id: string; title: string; hasContent: boolean; fromClaude: boolean; context: RetentionContext | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<DeleteTarget | null>(null);
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        aria-label="More actions"
        onClick={() => setOpen((o) => !o)}
        className={`grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-hover hover:text-ink ${open ? "bg-hover" : "md:opacity-0 md:group-hover:opacity-100"}`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="animate-pop absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-2xl border border-line bg-surface py-1 text-[13px]" style={{ boxShadow: "var(--shadow-pop)" }}>
          <Link href={`/app/posts/${id}`} className="flex items-center gap-2 px-3 py-2 hover:bg-hover"><PenLine className="h-4 w-4 text-muted" /> Open draft</Link>
          <button onClick={() => { setOpen(false); setTarget({ id, title, hasContent, fromClaude }); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-danger hover:bg-danger-soft">
            <Trash2 className="h-4 w-4" /> Delete draft
          </button>
        </div>
      )}
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
      />
    </div>
  );
}
