"use client";

import { BarChart3, CalendarDays, Inbox, LogOut, Plus, Rocket, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ClaudeMark, LinkedInMark, Logo } from "./Logo";
import { useToast } from "./ui/Toast";

const NAV = [
  { href: "/app", label: "Posts", icon: Inbox },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/app/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/app/settings", label: "Settings", icon: Settings2 },
];

export function Avatar({ name, src, size = 32 }: { name: string; src: string | null; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#e0dcff] to-[#f3e8ff] font-semibold text-brand-ink" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </span>
  );
}

export function NewPostButton({ className = "btn-brand", label = "New post" }: { className?: string; label?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: "", title: "Untitled post" }) });
        if (!res.ok) { setBusy(false); return toast({ tone: "error", title: "Couldn't create a post" }); }
        const p = await res.json();
        router.push(`/app/posts/${p.id}`);
      }}
    >
      <Plus className="h-4 w-4" /> {label}
    </button>
  );
}

export function Sidebar({
  user,
  linkedin,
  claude,
  setup,
}: {
  user: { name: string; email: string; avatar: string | null };
  linkedin: boolean;
  claude: boolean;
  setup: { done: number; total: number };
}) {
  const path = usePathname();
  const setupDone = setup.done >= setup.total;
  return (
    <aside className="z-20 flex md:sticky md:top-0 shrink-0 flex-col border-b border-line bg-surface/90 backdrop-blur md:h-screen md:w-[232px] md:border-r md:border-b-0 md:bg-surface">
      <div className="flex items-center justify-between px-4 py-3 md:px-5 md:pt-5 md:pb-4">
        <Link href="/app"><Logo /></Link>
        <NewPostButton className="btn-brand h-8 px-3 md:hidden" label="New" />
      </div>
      <div className="hidden px-4 pb-4 md:block">
        <NewPostButton className="btn-brand w-full" />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:flex-col md:px-3 md:pb-0">
        {!setupDone && (
          <Link
            href="/app/welcome"
            className={`group flex h-10 items-center gap-2.5 rounded-full px-3 text-sm font-medium whitespace-nowrap transition ${
              path.startsWith("/app/welcome") ? "bg-vivid text-white" : "border border-line-strong text-ink hover:bg-hover"
            }`}
          >
            <Rocket className="h-[18px] w-[18px]" />
            <span className="flex-1">Get started</span>
            <span className={`rounded-full px-2 text-[11px] font-semibold ${path.startsWith("/app/welcome") ? "bg-white/20" : "bg-surface text-ink-2"}`}>
              {setup.done}/{setup.total}
            </span>
          </Link>
        )}
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/app" ? path === "/app" || path.startsWith("/app/posts") : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex h-10 items-center gap-2.5 rounded-full px-3 text-sm font-medium whitespace-nowrap transition ${
                active ? "bg-brand-soft text-brand-ink" : "text-muted hover:bg-hover hover:text-ink"
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${active ? "text-brand" : ""}`} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden space-y-1 px-3 pb-3 md:block">
        <div className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-faint uppercase">Connections</div>
        <Link href="/app/settings#claude" className="flex h-9 items-center gap-2.5 rounded-lg px-2 text-[13px] text-ink-2 hover:bg-hover">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-claude-soft text-claude"><ClaudeMark className="h-3.5 w-3.5" /></span>
          <span className="flex-1">Claude</span>
          <span className={`h-2 w-2 rounded-full ${claude ? "bg-success" : "bg-line-strong"}`} />
        </Link>
        <Link href="/app/settings#linkedin" className="flex h-9 items-center gap-2.5 rounded-lg px-2 text-[13px] text-ink-2 hover:bg-hover">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-linkedin-soft text-linkedin"><LinkedInMark className="h-3.5 w-3.5" /></span>
          <span className="flex-1">LinkedIn</span>
          {linkedin ? <span className="h-2 w-2 rounded-full bg-success" /> : <span className="chip h-5 bg-warn-soft px-2 text-[11px] text-warn">Demo</span>}
        </Link>
        <div className="mt-2 flex items-center gap-2.5 border-t border-line px-2 pt-3">
          <Avatar name={user.name} src={user.avatar} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">{user.name}</div>
            <div className="truncate text-xs text-muted">{user.email}</div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button aria-label="Log out" title="Log out" className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:bg-hover hover:text-ink">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
