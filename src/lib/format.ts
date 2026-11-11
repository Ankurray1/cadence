export function fmtWhen(d: string | Date | null | undefined, timeZone: string) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-US", { timeZone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function fmtTime(d: string | Date, timeZone: string) {
  return new Date(d).toLocaleTimeString("en-US", { timeZone, hour: "numeric", minute: "2-digit" });
}

/** "in 3h", "2d ago", etc. */
export function relative(d: string | Date | null | undefined) {
  if (!d) return "";
  const diff = new Date(d).getTime() - Date.now();
  const abs = Math.abs(diff);
  const m = Math.round(abs / 60000);
  const h = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  const v = m < 1 ? "just now" : m < 60 ? `${m}m` : h < 24 ? `${h}h` : `${days}d`;
  if (v === "just now") return v;
  return diff > 0 ? `in ${v}` : `${v} ago`;
}

/** YYYY-MM-DD of a date in a timezone */
export function dayKey(d: string | Date, timeZone: string) {
  return new Date(d).toLocaleDateString("en-CA", { timeZone });
}

const PILLARS: Record<string, { dot: string; chip: string; bar: string }> = {
  "Thought leadership": { dot: "bg-[#5b4bff]", chip: "bg-hover text-ink-2", bar: "#5b4bff" },
  Story: { dot: "bg-[#f59e0b]", chip: "bg-hover text-ink-2", bar: "#f59e0b" },
  "How-to": { dot: "bg-[#10b981]", chip: "bg-hover text-ink-2", bar: "#10b981" },
  Announcement: { dot: "bg-[#0ea5e9]", chip: "bg-hover text-ink-2", bar: "#0ea5e9" },
  Opinion: { dot: "bg-[#f43f5e]", chip: "bg-hover text-ink-2", bar: "#f43f5e" },
};
const FALLBACK = { dot: "bg-faint", chip: "bg-hover text-ink-2", bar: "#a1a1aa" };
export const pillarStyle = (p: string) => PILLARS[p] ?? FALLBACK;
