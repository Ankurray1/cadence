"use client";

import { ArrowUpRight, Check, ChevronDown, Copy } from "lucide-react";
import { useState } from "react";

const claudeLink = (prompt: string) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;

/** One ready-to-run prompt for the user's own Claude. Personalised server-side from their real data. */
export function PromptCard({ title, why, prompt, featured }: { title: string; why: string; prompt: string; featured?: boolean }) {
  const [open, setOpen] = useState(!!featured);
  const [copied, setCopied] = useState(false);

  return (
    <div className={`rounded-2xl border p-4 transition ${featured ? "border-claude/30 bg-claude-soft/40" : "border-line bg-surface hover:border-line-strong"}`}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 text-left" aria-expanded={open}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-ink">{title}</span>
            {featured && <span className="chip h-5 bg-claude text-[10px] font-semibold tracking-wide text-white uppercase">Start here</span>}
          </div>
          <div className="mt-0.5 text-[12px] leading-snug text-muted">{why}</div>
        </div>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-faint transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="animate-fade-up">
          <div className="relative mt-3 max-h-56 overflow-y-auto rounded-xl bg-canvas p-3 text-[12.5px] leading-relaxed whitespace-pre-line text-ink-2">{prompt}</div>
          <div className="mt-3 flex items-center gap-2">
            <a
              href={claudeLink(prompt)}
              target="_blank"
              rel="noreferrer"
              className="relative inline-flex h-9 flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-full bg-claude px-4 text-[13px] font-semibold text-white transition hover:brightness-110"
            >
              <span aria-hidden className="animate-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              Run in Claude <ArrowUpRight className="h-4 w-4" />
            </a>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(prompt);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition ${copied ? "border-success/30 bg-success-soft text-success" : "border-line-strong bg-surface text-ink-2 hover:bg-hover"}`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
