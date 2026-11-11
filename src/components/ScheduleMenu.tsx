"use client";

import { CalendarClock, Check, Loader2, Send, X } from "lucide-react";
import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");
export const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
export function at(daysAhead: number, hour: number, weekday?: number) {
  const d = new Date();
  if (weekday !== undefined) d.setDate(d.getDate() + ((weekday + 7 - d.getDay()) % 7 || 7));
  else d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/**
 * The one scheduling flow used everywhere (editor + post list):
 * pick a slot or time → "Confirm · <time>" → "You're all set" with Done / Publish now / Change time.
 * Nothing is scheduled until Confirm.
 */
export function ScheduleMenu({
  isScheduled,
  canSchedule,
  initialWhen,
  initialPicked = null,
  onSchedule,
  onPublishNow,
  onClose,
  placement = "above",
  anchor = "right",
}: {
  isScheduled: boolean;
  canSchedule: boolean;
  initialWhen: string;
  initialPicked?: Date | null;
  onSchedule: (d: Date | null) => Promise<boolean>;
  onPublishNow?: () => void;
  onClose: () => void;
  placement?: "above" | "below";
  anchor?: "left" | "right";
}) {
  const [when, setWhen] = useState(initialWhen);
  const [picked, setPicked] = useState<Date | null>(initialPicked);
  const [confirmed, setConfirmed] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [tz, setTz] = useState("");
  useEffect(() => setTz(Intl.DateTimeFormat().resolvedOptions().timeZone), []);

  async function confirm(d: Date | null) {
    setBusy(true);
    const ok = await onSchedule(d);
    setBusy(false);
    if (ok && d) setConfirmed(d);
  }

  const quick = [
    { l: "Tomorrow, 9 AM", d: at(1, 9) },
    { l: "Tomorrow, 1 PM", d: at(1, 13) },
    { l: "Monday, 9 AM", d: at(0, 9, 1) },
    { l: "Tuesday, 9 AM", d: at(0, 9, 2) },
  ];

  return (
    <div
      className={`animate-pop absolute ${anchor === "left" ? "left-0" : "right-0"} z-30 w-[320px] rounded-2xl border border-line bg-surface p-4 text-left ${placement === "above" ? "bottom-full mb-2" : "top-full mt-2"}`}
      style={{ boxShadow: "var(--shadow-pop)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {confirmed ? (
        <div className="text-center">
          <span className="animate-pop mx-auto grid h-12 w-12 place-items-center rounded-full bg-success-soft text-success"><Check className="h-6 w-6" strokeWidth={3} /></span>
          <div className="mt-3 font-display text-lg font-bold">You’re all set.</div>
          <p className="mt-1 text-[14px] text-ink-2">
            Scheduled for <b className="text-ink">{confirmed.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short" })} at {confirmed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</b>
          </p>
          <p className="mt-1 text-[12px] text-muted">
            {(() => {
              const days = Math.round((new Date(confirmed).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
              return days <= 0 ? "Goes live later today." : days === 1 ? "Goes live tomorrow." : `Goes live in ${days} days.`;
            })()}{" "}
            Cadence publishes it for you, even if you’re offline.
          </p>
          <button className="btn-primary mt-4 w-full" onClick={onClose}>Done</button>
          {onPublishNow && (
            <button className="btn mt-2 w-full bg-brand-soft text-brand-ink hover:bg-brand-soft/70" onClick={() => { onClose(); onPublishNow(); }}>
              <Send className="h-4 w-4" /> Can’t wait? Publish now
            </button>
          )}
          <button className="mt-2 text-[12px] font-medium text-muted hover:text-ink" onClick={() => { setConfirmed(null); setPicked(null); }}>Change time</button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-[14px] font-semibold"><CalendarClock className="h-4 w-4 text-muted" /> {isScheduled ? "Change the schedule" : "Schedule for later"}</div>
          <p className="mt-0.5 text-[12px] text-muted">Pick a time and Cadence posts it for you, even when you’re offline.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {quick.map((q) => {
              const on = picked?.getTime() === q.d.getTime();
              return (
                <button
                  key={q.l}
                  aria-pressed={on}
                  className={`rounded-xl border px-3 py-2 text-left text-[12px] font-medium transition ${on ? "border-brand bg-brand-soft text-brand-ink ring-2 ring-brand/15" : "border-line hover:border-brand/40 hover:bg-brand-soft/40"}`}
                  onClick={() => { setPicked(q.d); setWhen(toLocalInput(q.d)); }}
                >
                  {q.l}
                </button>
              );
            })}
          </div>
          <label className="label mt-4">Or pick a time {tz && <span className="font-normal text-faint">· {tz}</span>}</label>
          <input
            type="datetime-local"
            className="input"
            value={when}
            onChange={(e) => { setWhen(e.target.value); setPicked(e.target.value ? new Date(e.target.value) : null); }}
          />
          {!canSchedule && <p className="mt-3 rounded-xl bg-hover px-3 py-2 text-[12px] text-ink-2">Write your post first. This time is kept for when you’re ready.</p>}
          {picked && picked.getTime() < Date.now() && (
            <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-[12px] text-danger">That time has already passed. Pick a future time.</p>
          )}
          <button
            className="btn-primary mt-3 w-full"
            disabled={busy || !canSchedule || !picked || picked.getTime() < Date.now()}
            onClick={() => picked && confirm(picked)}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
            {picked
              ? `Confirm · ${picked.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}, ${picked.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
              : "Pick a time above"}
          </button>
          {isScheduled && (
            <button className="btn-ghost mt-1 w-full text-muted" disabled={busy} onClick={() => confirm(null)}>
              <X className="h-4 w-4" /> Unschedule, keep as draft
            </button>
          )}
        </>
      )}
    </div>
  );
}
