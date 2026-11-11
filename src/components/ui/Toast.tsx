"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Tone = "success" | "error" | "info";
type ToastItem = { id: number; tone: Tone; title: string; body?: string };
type ConfirmOpts = { title: string; body?: string; confirm?: string; tone?: "danger" | "default" };

const Ctx = createContext<{
  toast: (t: Omit<ToastItem, "id">) => void;
  confirm: (o: ConfirmOpts) => Promise<boolean>;
} | null>(null);

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast outside Toaster");
  return c;
}

export function Toaster({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const seq = useRef(0);

  const toast = useCallback((t: Omit<ToastItem, "id">) => {
    const id = ++seq.current;
    setItems((xs) => [...xs, { ...t, id }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), t.tone === "error" ? 6000 : 3200);
  }, []);

  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setDialog({ ...o, resolve })), []);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { dialog.resolve(false); setDialog(null); }
      if (e.key === "Enter") { dialog.resolve(true); setDialog(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog]);

  const icon = { success: <CheckCircle2 className="h-4 w-4 text-success" />, error: <AlertTriangle className="h-4 w-4 text-danger" />, info: <Info className="h-4 w-4 text-brand" /> };

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6">
        {items.map((t) => (
          <div key={t.id} className="animate-pop pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3" style={{ boxShadow: "var(--shadow-pop)" }}>
            <span className="mt-0.5">{icon[t.tone]}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{t.title}</div>
              {t.body && <div className="mt-0.5 text-[13px] text-muted">{t.body}</div>}
            </div>
            <button aria-label="Dismiss" className="text-faint hover:text-ink" onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))}>
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      {dialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-plum-deep/30 p-4 backdrop-blur-[2px]" onClick={() => { dialog.resolve(false); setDialog(null); }}>
          <div className="animate-pop w-full max-w-md rounded-2xl bg-surface p-6" style={{ boxShadow: "var(--shadow-pop)" }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3 className="font-display text-lg font-bold">{dialog.title}</h3>
            {dialog.body && <p className="mt-2 text-sm leading-relaxed text-muted">{dialog.body}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => { dialog.resolve(false); setDialog(null); }}>Cancel</button>
              <button autoFocus className={dialog.tone === "danger" ? "btn bg-danger text-white hover:brightness-110" : "btn-primary"} onClick={() => { dialog.resolve(true); setDialog(null); }}>
                {dialog.confirm ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
