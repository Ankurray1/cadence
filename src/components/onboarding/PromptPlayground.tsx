"use client";

import { ArrowUpRight, Check, Copy, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { ClaudeMark } from "../Logo";

const PROMPTS = [
  {
    label: "Lesson learned",
    emoji: "💡",
    text: "Help me write a LinkedIn post about the biggest lesson from my last project. Ask me 2 quick questions first, show me the final post, then save it to Cadence as a draft.",
  },
  {
    label: "Launch story",
    emoji: "🚀",
    text: "Write a LinkedIn post announcing something I just shipped: [what you shipped]. Lead with the result, keep the hook under 12 words, and save it to Cadence for tomorrow 9am.",
  },
  {
    label: "Hot take",
    emoji: "🔥",
    text: "Turn this opinion into a punchy LinkedIn post that invites debate: [your opinion]. End with a question. Save it to Cadence as a draft.",
  },
  {
    label: "Plan my week",
    emoji: "🗓️",
    text: "Plan 3 LinkedIn posts for this week (a story, a how-to and an opinion) based on what I’m working on: [one line]. Show them to me, then schedule them in Cadence at 9am on open days.",
  },
];

const claudeLink = (p: string) => `https://claude.ai/new?q=${encodeURIComponent(p)}`;

export function PromptPlayground({ compact = false }: { compact?: boolean }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const [copied, setCopied] = useState(false);
  const text = PROMPTS[i].text;

  // Typewriter effect whenever the prompt changes
  useEffect(() => {
    setShown(0);
    const t = setInterval(() => setShown((n) => (n >= text.length ? (clearInterval(t), n) : n + 2)), 14);
    return () => clearInterval(t);
  }, [text]);

  return (
    <div className="glow-border rounded-[26px] p-5 text-white sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10"><ClaudeMark className="h-4 w-4 text-white/80" /></span>
          <span className="text-[13px] font-semibold text-white/80">Prompt for your Claude</span>
        </div>
        <span className="chip h-6 bg-white/10 text-[11px] text-white/70"><Sparkles className="h-3 w-3" /> Works with Cadence connected</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PROMPTS.map((p, idx) => (
          <button
            key={p.label}
            onClick={() => { setI(idx); setCopied(false); }}
            className={`chip h-8 px-3 text-[12px] transition ${idx === i ? "bg-white text-ink" : "bg-white/10 text-white/75 hover:bg-white/20"}`}
          >
            <span>{p.emoji}</span> {p.label}
          </button>
        ))}
      </div>

      <div className={`mt-4 rounded-2xl bg-white/12 p-4 font-mono backdrop-blur-sm text-[13.5px] leading-relaxed text-white/90 ring-1 ring-white/10 ${compact ? "min-h-[96px]" : "min-h-[112px]"}`}>
        {text.slice(0, shown)}
        <span className="ml-0.5 inline-block h-4 w-[7px] translate-y-0.5 animate-pulse bg-white/70" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          className={`btn h-11 px-5 ${copied ? "bg-success text-white" : "bg-white text-ink hover:bg-white/90"}`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied. Paste it in Claude" : "Copy prompt"}
        </button>
        <a href={claudeLink(text)} target="_blank" rel="noreferrer" className="btn-apricot h-11 px-5">
          Open in Claude <ArrowUpRight className="h-4 w-4" />
        </a>
        <span className="text-[12px] text-white/50">Replace the [brackets] with your details</span>
      </div>
    </div>
  );
}
