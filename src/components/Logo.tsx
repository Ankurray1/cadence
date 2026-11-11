export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-[9px] bg-gradient-to-br from-brand to-[#8b5cf6] text-white ${className}`} style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.25), 0 1px 2px rgba(70,54,230,.35)" }}>
      <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 16.5 8 11l4 3.5L17 8l4 4" />
      </svg>
    </span>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-[17px] font-bold text-ink ${className}`}>
      <LogoMark />
      Cadence
    </span>
  );
}

export function ClaudeMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.5l1.6 6.1 6.1-3.4-3.4 6.1 6.1 1.6-6.1 1.6 3.4 6.1-6.1-3.4L12 23.2l-1.6-6.1-6.1 3.4 3.4-6.1L1.6 12.8l6.1-1.6-3.4-6.1 6.1 3.4z" />
    </svg>
  );
}

export function LinkedInMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}
