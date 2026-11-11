import Link from "next/link";
import { Logo } from "./Logo";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <div className="bar-gradient h-1.5" />
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <div className="flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <Link href="/" className="text-[13px] font-medium text-muted hover:text-ink">← Back to Cadence</Link>
        </div>
        <h1 className="mt-12 font-display text-[44px] font-bold">{title}</h1>
        <p className="mt-2 text-muted">Last updated {updated}</p>
        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-ink-2 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
          {children}
        </div>
        <div className="mt-16 flex gap-4 border-t border-line pt-6 text-[13px] text-muted">
          <Link href="/privacy" className="hover:text-ink">Privacy policy</Link>
          <Link href="/terms" className="hover:text-ink">Terms of service</Link>
        </div>
      </div>
    </div>
  );
}
