"use client";

import { CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ScheduleMenu, toLocalInput } from "./ScheduleMenu";
import { useToast } from "./ui/Toast";

/** The scheduled time on a post row. Click it to reschedule with the same flow as the editor. */
export function ScheduleTimeButton({ id, scheduledAt, label, sub, align = "right" }: { id: string; scheduledAt: string; label: string; sub: string; align?: "left" | "right" }) {
  const router = useRouter();
  const { toast, confirm } = useToast();
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function onSchedule(d: Date | null) {
    const res = await fetch(`/api/posts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduled_at: d ? d.toISOString() : null }) });
    if (!res.ok) {
      toast({ tone: "error", title: "Couldn’t update the schedule", body: (await res.json().catch(() => ({}))).error });
      return false;
    }
    if (!d) {
      setOpen(false);
      toast({ tone: "info", title: "Moved back to drafts" });
    }
    start(() => router.refresh());
    return true;
  }

  async function publishNow() {
    const ok = await confirm({ title: "Publish to LinkedIn now?", body: "This post will go live on your LinkedIn profile immediately.", confirm: "Publish now" });
    if (!ok) return;
    const res = await fetch(`/api/posts/${id}/publish`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status === "failed") return toast({ tone: "error", title: "Couldn’t publish", body: data.error });
    toast({ tone: "success", title: data.simulated ? "Published (demo)" : "Live on LinkedIn 🎉" });
    start(() => router.refresh());
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Change schedule"
        className={`group/time flex flex-col rounded-xl px-2.5 py-1.5 transition ${align === "left" ? "items-start text-left" : "items-end text-right"} hover:bg-brand-soft/60 ${open ? "bg-brand-soft/60" : ""}`}
      >
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-brand">
          <CalendarClock className="h-3.5 w-3.5 opacity-0 transition group-hover/time:opacity-100" />
          {label}
        </span>
        <span className="text-xs text-faint group-hover/time:text-brand-ink">{open ? "Change schedule" : sub}</span>
      </button>
      {open && (
        <ScheduleMenu
          isScheduled
          canSchedule
          initialWhen={toLocalInput(new Date(scheduledAt))}
          onSchedule={onSchedule}
          onPublishNow={publishNow}
          onClose={() => setOpen(false)}
          placement="below"
          anchor={align === "left" ? "left" : "right"}
        />
      )}
    </div>
  );
}
