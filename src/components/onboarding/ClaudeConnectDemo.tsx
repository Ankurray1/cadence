"use client";

import { Check, MousePointer2, Pause, Play, Plug, Plus, Settings2, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { ClaudeMark, LogoMark } from "../Logo";

/**
 * A looping, GIF-style walkthrough of connecting Cadence inside Claude.
 * Pure React + CSS. No video, so it stays crisp and loads instantly.
 */
const FRAMES = [
  { caption: "Open Claude → Customize → Connectors", ms: 2600 },
  { caption: "Click + Add → “Add custom connector”", ms: 2200 },
  { caption: "Name it Cadence, paste the link, click Add", ms: 3600 },
  { caption: "Click Connect, then confirm your Cadence account", ms: 3000 },
  { caption: "Done! Cadence is ready in every chat", ms: 2800 },
];

function Cursor({ x, y, click }: { x: string; y: string; click?: boolean }) {
  return (
    <div className="pointer-events-none absolute z-20 transition-all duration-700 ease-out" style={{ left: x, top: y }}>
      <MousePointer2 className="h-5 w-5 fill-ink text-white drop-shadow" />
      {click && <span className="absolute -top-1 -left-1 h-7 w-7 animate-ping rounded-full bg-brand/40" />}
    </div>
  );
}

export function ClaudeConnectDemo({ mcpUrl, firstName }: { mcpUrl: string; firstName: string }) {
  const [frame, setFrame] = useState(0);
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => { setFrame((f) => (f + 1) % FRAMES.length); setTick(0); }, FRAMES[frame].ms);
    return () => clearTimeout(t);
  }, [frame, playing]);

  useEffect(() => {
    if (!playing) return;
    const i = setInterval(() => setTick((n) => n + 1), 45);
    return () => clearInterval(i);
  }, [playing, frame]);

  const typed = (text: string, start: number) => text.slice(0, Math.max(0, Math.min(text.length, tick - start)));
  const shortUrl = mcpUrl.replace(/^https?:\/\//, "");

  return (
    <div className="relative">
      {/* Browser window */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-pop)]">
        <div className="flex items-center gap-2 border-b border-line bg-canvas px-3 py-2">
          <span className="flex gap-1.5">{["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />)}</span>
          <span className="mx-auto rounded-md bg-surface px-3 py-0.5 text-[11px] text-muted">claude.ai{frame <= 2 ? "/settings/connectors" : frame === 3 ? " · Cadence sign-in" : ""}</span>
        </div>

        <div className="relative h-[260px] overflow-hidden bg-[#faf9f5] text-[12px] text-ink">
          {/* Frame 0-2: Claude settings */}
          {frame <= 2 && (
            <div className="flex h-full">
              <div className="w-[34%] border-r border-black/5 bg-[#f5f4ee] p-3">
                <div className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold"><Settings2 className="h-3.5 w-3.5" /> Settings</div>
                {["Account", "Appearance", "Capabilities", "Connectors", "Privacy"].map((s) => (
                  <div key={s} className={`mb-1 rounded-md px-2 py-1.5 transition ${s === "Connectors" && frame >= 0 ? "bg-white font-semibold shadow-sm" : "text-ink/60"}`}>{s}</div>
                ))}
              </div>
              <div className="flex-1 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-[14px] font-semibold">Connectors</div>
                  <div className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-white transition ${frame >= 1 ? "bg-vivid ring-4 ring-brand/30" : "bg-brand/70"}`}>
                    <Plus className="h-3 w-3" /> Add custom connector
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {["Google Drive", "Gmail"].map((c) => (
                    <div key={c} className="flex items-center justify-between rounded-lg border border-black/5 bg-white px-3 py-2 text-ink/70"><span>{c}</span><span className="text-[10px]">Connected</span></div>
                  ))}
                </div>
              </div>
              {frame === 2 && (
                <div className="animate-pop absolute inset-x-[18%] top-[14%] rounded-xl border border-black/10 bg-white p-4 shadow-2xl">
                  <div className="text-[13px] font-semibold">Add custom connector</div>
                  <div className="mt-3 text-[10px] text-ink/50">Name</div>
                  <div className="mt-0.5 rounded-md border border-black/10 px-2 py-1.5">{typed("Cadence", 0)}<span className="animate-pulse">|</span></div>
                  <div className="mt-2 text-[10px] text-ink/50">Remote MCP server URL</div>
                  <div className="mt-0.5 truncate rounded-md border border-brand/50 bg-brand-soft/40 px-2 py-1.5 font-mono text-[10px]">{tick > 10 ? shortUrl : ""}</div>
                  <div className="mt-3 flex justify-end gap-2">
                    <span className="rounded-md px-2 py-1 text-ink/50">Cancel</span>
                    <span className={`rounded-md px-3 py-1 font-medium text-white ${tick > 40 ? "bg-vivid ring-4 ring-brand/30" : "bg-brand/60"}`}>Add</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Frame 3: Cadence account confirmation */}
          {frame === 3 && (
            <div className="animate-fade-up flex h-full items-center justify-center bg-surface p-4">
              <div className="w-[78%]">
                <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-claude-soft text-claude"><ClaudeMark className="h-3.5 w-3.5" /></span><span className="text-faint">···</span><LogoMark className="h-7 w-7" /></div>
                <div className="mt-2 text-[13px] font-semibold">Connect Claude to this Cadence account?</div>
                <div className="mt-2 rounded-xl border-2 border-brand/30 bg-brand-soft/40 p-2.5">
                  <div className="text-[9px] font-semibold tracking-wide text-muted uppercase">Claude will save to</div>
                  <div className="mt-1 font-semibold">{firstName}’s workspace</div>
                </div>
                <div className={`mt-3 rounded-full py-1.5 text-center font-semibold text-white transition ${tick > 25 ? "bg-brand ring-4 ring-brand/30" : "bg-brand/80"}`}>Connect {firstName}’s account</div>
              </div>
            </div>
          )}

          {/* Frame 4: success */}
          {frame === 4 && (
            <div className="animate-fade-up flex h-full flex-col justify-center gap-3 bg-[#faf9f5] p-5">
              <div className="flex items-center justify-between rounded-lg border border-success/30 bg-white px-3 py-2">
                <span className="flex items-center gap-2 font-semibold"><LogoMark className="h-5 w-5" /> Cadence</span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-success"><Check className="h-3.5 w-3.5" /> Connected</span>
              </div>
              <div className="rounded-xl border border-black/10 bg-white p-3">
                <div className="text-ink/40">Ask Claude to write and save a post…</div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-md border border-black/10"><SlidersHorizontal className="h-3 w-3" /></span>
                  <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand-ink"><Plug className="h-3 w-3" /> Cadence on</span>
                </div>
              </div>
            </div>
          )}

          {/* Animated cursor */}
          {frame === 0 && <Cursor x={tick > 12 ? "16%" : "45%"} y={tick > 12 ? "52%" : "80%"} click={tick > 30} />}
          {frame === 1 && <Cursor x={tick > 8 ? "84%" : "60%"} y={tick > 8 ? "10%" : "60%"} click={tick > 22} />}
          {frame === 2 && <Cursor x={tick > 35 ? "72%" : "52%"} y={tick > 35 ? "74%" : "56%"} click={tick > 48} />}
          {frame === 3 && <Cursor x={tick > 15 ? "50%" : "70%"} y={tick > 15 ? "79%" : "92%"} click={tick > 28} />}
        </div>
      </div>

      {/* Caption + controls */}
      <div className="mt-3 flex items-center gap-3">
        <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause walkthrough" : "Play walkthrough"} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-vivid text-white hover:brightness-110">
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{frame + 1}. {FRAMES[frame].caption}</div>
          <div className="mt-1.5 flex gap-1">
            {FRAMES.map((_, i) => (
              <button key={i} onClick={() => { setFrame(i); setTick(0); }} aria-label={`Show step ${i + 1}`} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <span className={`block h-full rounded-full bg-brand ${i < frame ? "w-full" : i === frame ? "w-full origin-left animate-[grow_var(--d)_linear]" : "w-0"}`} style={{ ["--d" as string]: `${FRAMES[frame].ms}ms` }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
