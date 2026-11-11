"use client";

import { CalendarClock, FileText, LayoutGrid, List, Radio } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export type TabKey = "drafts" | "scheduled" | "live";
export type Layout = "list" | "grid";

const ICONS = { drafts: FileText, scheduled: CalendarClock, live: Radio } as const;

export type BoardTab = {
  key: TabKey;
  label: string;
  hint: string;
  count: number;
  rows: ReactNode[]; // list rows
  cards: ReactNode[]; // grid cards
  empty: ReactNode;
};

/**
 * Tabs + list/grid switch, entirely client-side: every tab is already loaded, so switching is instant
 * (no server round trip). The URL is kept in sync so links, refresh and back still land on the same view.
 */
export function PostsBoard({ tabs, initialTab, initialLayout }: { tabs: BoardTab[]; initialTab: TabKey; initialLayout: Layout }) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [layout, setLayout] = useState<Layout>(initialLayout);
  const current = tabs.find((t) => t.key === tab) ?? tabs[0];

  const sync = useCallback((t: TabKey, l: Layout) => {
    const url = `/app?tab=${t}${l === "grid" ? "&view=grid" : ""}`;
    window.history.replaceState(window.history.state, "", url);
  }, []);
  const pickTab = (t: TabKey) => { if (t !== tab) { setTab(t); sync(t, layout); } };
  const pickLayout = (l: Layout) => { if (l !== layout) { setLayout(l); sync(tab, l); } };

  // Sliding highlight behind the active tab.
  const wrap = useRef<HTMLDivElement>(null);
  const refs = useRef<Partial<Record<TabKey, HTMLButtonElement | null>>>({});
  const [pill, setPill] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [animate, setAnimate] = useState(false);
  const measure = useCallback(() => {
    const el = refs.current[tab];
    if (el) setPill({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
  }, [tab]);
  useLayoutEffect(measure, [measure]);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true)); // no slide on first paint
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current);
    return () => { cancelAnimationFrame(id); ro.disconnect(); };
  }, [measure]);

  // Arrow keys move between tabs.
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = tabs.findIndex((t) => t.key === tab);
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length].key;
    pickTab(next);
    refs.current[next]?.focus();
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div ref={wrap} role="tablist" aria-label="Posts" onKeyDown={onKey} className="relative flex flex-1 flex-wrap gap-2 rounded-full border border-line bg-surface p-1.5 sm:inline-flex sm:flex-none">
          {pill && (
            <span
              aria-hidden
              className={`bg-vivid pointer-events-none absolute top-0 left-0 rounded-full ${animate ? "transition-[transform,width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" : ""}`}
              style={{ width: pill.w, height: pill.h, transform: `translate(${pill.x}px, ${pill.y}px)` }}
            />
          )}
          {tabs.map(({ key, label, count }) => {
            const active = tab === key;
            const Icon = ICONS[key];
            return (
              <button
                key={key}
                ref={(el) => { refs.current[key] = el; }}
                role="tab"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => pickTab(key)}
                className={`relative z-10 flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-200 sm:flex-none ${active ? "text-white" : "text-muted hover:bg-hover hover:text-ink"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
                <span className={`rounded-full px-2 text-[11px] font-semibold transition-colors duration-200 ${active ? "bg-white/20 text-white" : "bg-hover text-ink-2"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative flex items-center gap-1 rounded-full border border-line bg-surface p-1" role="group" aria-label="Layout">
          <span
            aria-hidden
            className="pointer-events-none absolute top-1 left-1 h-9 w-9 rounded-full bg-brand-soft transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateX(${layout === "grid" ? 40 : 0}px)` }}
          />
          {([["list", List, "List view"], ["grid", LayoutGrid, "Grid view"]] as const).map(([v, Icon, label]) => (
            <button
              key={v}
              onClick={() => pickLayout(v)}
              aria-label={label}
              title={label}
              aria-pressed={layout === v}
              className={`relative z-10 grid h-9 w-9 place-items-center rounded-full transition-colors duration-200 ${layout === v ? "text-brand-ink" : "text-muted hover:text-ink"}`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 px-2 text-[13px] text-muted">{current.hint}</p>

      <div key={`${tab}-${layout}`} className="animate-swap">
        {current.count === 0 ? (
          <div className="card mt-3 p-2 sm:p-3">{current.empty}</div>
        ) : layout === "grid" ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{current.cards}</div>
        ) : (
          <div className="card mt-3 p-2 sm:p-3">{current.rows}</div>
        )}
      </div>
    </>
  );
}
