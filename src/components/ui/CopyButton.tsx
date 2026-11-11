"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyField({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-1 rounded-xl border border-line-strong bg-canvas p-1 pl-3">
      <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink-2">{value}</code>
      <button
        className={copied ? "btn h-8 bg-success-soft text-success" : "btn-primary h-8"}
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : label}
      </button>
    </div>
  );
}

export function CopyPrompt({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className="group flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-3 text-left text-[13px] leading-relaxed text-ink-2 transition hover:border-brand/40 hover:shadow-[var(--shadow-lift)]"
    >
      <span className="flex-1">“{text}”</span>
      <span className="mt-0.5 text-faint group-hover:text-brand">{copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}</span>
    </button>
  );
}
