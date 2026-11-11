"use client";

import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** First-visit welcome pop-up. Shows until the user closes it (remembered server-side). */
export function WelcomeModal({ name, done, total, children }: { name: string; done: number; total: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const path = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function close() {
    setOpen(false);
    fetch("/api/me/onboarding", { method: "POST" }).catch(() => {});
  }

  if (!open || path.startsWith("/app/welcome")) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-plum-deep/45 p-4 backdrop-blur-sm" onClick={close}>
      <div className="animate-pop relative w-full max-w-xl overflow-hidden rounded-[28px] bg-surface" style={{ boxShadow: "var(--shadow-pop)" }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="welcome-title">
        <div className="bar-gradient h-1.5" />
        <div className="surface-plum relative px-7 pt-7 pb-8 text-white">
          <button onClick={close} aria-label="Close" className="absolute top-5 right-5 grid h-8 w-8 place-items-center rounded-full bg-white/15 hover:bg-white/25"><X className="h-4 w-4" /></button>
          <div className="text-[12px] font-semibold tracking-[0.14em] text-white/70 uppercase">Welcome to Cadence</div>
          <h2 id="welcome-title" className="mt-2 font-display text-[30px] leading-tight font-bold">Hi {name.split(" ")[0]}, let’s get your first post live.</h2>
          <p className="mt-2 text-white/75">Three quick steps. About two minutes.</p>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-apricot transition-all" style={{ width: `${(done / total) * 100}%` }} />
            </div>
            <span className="text-[13px] font-semibold">{done}/{total}</span>
          </div>
        </div>
        <div className="p-6">{children}</div>
        <div className="flex items-center justify-between border-t border-line px-6 py-4">
          <button onClick={close} className="text-[13px] font-medium text-muted hover:text-ink">I’ll do this later</button>
          <Link href="/app/welcome" onClick={close} className="btn-primary h-10">Open the full guide <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  );
}
