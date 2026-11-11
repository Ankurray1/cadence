"use client";

import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LinkedInMark } from "./Logo";
import { useToast } from "./ui/Toast";

/** Runs an action, then refreshes server data — and keeps the button busy until BOTH finish. */
function useBusyAction() {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const run = async (fn: () => Promise<void>, after?: () => void) => {
    setWorking(true);
    try {
      await fn();
      startTransition(() => router.refresh());
      after?.();
    } finally {
      setWorking(false);
    }
  };
  return { busy: working || refreshing, run };
}

export function DisconnectApp({ clientId }: { clientId: string }) {
  const { confirm, toast } = useToast();
  const { busy, run } = useBusyAction();
  return (
    <button
      className="btn-ghost h-8 text-[13px] text-muted"
      disabled={busy}
      onClick={async () => {
        if (!(await confirm({ title: "Disconnect Claude?", body: "Claude will need to sign in to Cadence again before it can save posts.", confirm: "Disconnect", tone: "danger" }))) return;
        await run(
          async () => {
            await fetch("/api/oauth/connections", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: clientId }) });
          },
          () => toast({ tone: "info", title: "Claude disconnected" }),
        );
      }}
    >
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {busy ? "Disconnecting…" : "Disconnect"}
    </button>
  );
}

const LINKEDIN_LOGOUT = "https://www.linkedin.com/m/logout/";

/**
 * Switch to a different LinkedIn account. LinkedIn has no "choose account" option, so we
 * sign the browser out of linkedin.com in a small window first; LinkedIn then shows its
 * normal login (password / Google / Apple). The account you log in with becomes your
 * Cadence workspace — an existing one, or a brand-new one.
 */
export function SwitchLinkedIn({ className = "btn-secondary", label = "Switch account" }: { className?: string; label?: string }) {
  const { confirm } = useToast();
  const [step, setStep] = useState<null | "signout" | "redirect">(null);
  return (
    <button
      className={className}
      disabled={step !== null}
      onClick={async () => {
        const ok = await confirm({
          title: "Use a different LinkedIn account?",
          body: "We’ll sign this browser out of LinkedIn, then LinkedIn will ask you to log in. Cadence opens the workspace for whichever account you log in with (or creates a new one).",
          confirm: "Continue",
        });
        if (!ok) return;
        setStep("signout");
        const w = window.open(LINKEDIN_LOGOUT, "li_logout", "width=480,height=560,left=120,top=120");
        await new Promise((r) => setTimeout(r, w ? 2500 : 0));
        try { w?.close(); } catch {}
        setStep("redirect");
        window.location.href = "/api/auth/linkedin?mode=switch&next=/app";
      }}
    >
      {step ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
      {step === "signout" ? "Signing out of LinkedIn…" : step === "redirect" ? "Opening LinkedIn…" : label}
    </button>
  );
}

export function LinkedInActions({ connected, configured }: { connected: boolean; configured: boolean }) {
  const { confirm, toast } = useToast();
  const { busy, run } = useBusyAction();
  const [going, setGoing] = useState(false);
  if (!configured) return <p className="text-[13px] text-muted">LinkedIn publishing isn’t enabled on this server yet.</p>;

  if (!connected)
    return (
      <a href="/api/auth/linkedin?next=/app/settings%23linkedin" onClick={() => setGoing(true)} className="btn-linkedin">
        {going ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkedInMark className="h-4 w-4" />}
        {going ? "Opening LinkedIn…" : "Connect LinkedIn"}
      </a>
    );

  return (
    <div className="flex flex-wrap gap-2">
      <SwitchLinkedIn />
      <button
        className="btn-ghost text-muted"
        disabled={busy}
        onClick={async () => {
          if (!(await confirm({ title: "Disconnect LinkedIn?", body: "Scheduled posts will publish in demo mode until you connect again.", confirm: "Disconnect", tone: "danger" }))) return;
          await run(
            async () => {
              const res = await fetch("/api/linkedin/disconnect", { method: "POST" });
              if (!res.ok) throw new Error("failed");
            },
            () => toast({ tone: "success", title: "LinkedIn disconnected" }),
          ).catch(() => toast({ tone: "error", title: "Couldn’t disconnect. Try again." }));
        }}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {busy ? "Disconnecting…" : "Disconnect"}
      </button>
    </div>
  );
}

export function ProfileForm({ user }: { user: { name: string; headline: string; weekly_goal: number; timezone: string } }) {
  const { toast } = useToast();
  const { busy, run } = useBusyAction();
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        let error = "";
        await run(
          async () => {
            const res = await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
            if (!res.ok) error = (await res.json()).error || "Couldn’t save";
          },
          () => toast(error ? { tone: "error", title: error } : { tone: "success", title: "Profile saved" }),
        );
      }}
    >
      <div>
        <label className="label" htmlFor="name">Name</label>
        <input id="name" name="name" className="input" defaultValue={user.name} />
      </div>
      <div>
        <label className="label" htmlFor="headline">LinkedIn headline</label>
        <input id="headline" name="headline" className="input" defaultValue={user.headline} placeholder="Product Manager · Fintech" />
      </div>
      <div>
        <label className="label" htmlFor="weekly_goal">Weekly goal (posts)</label>
        <input id="weekly_goal" name="weekly_goal" type="number" min={1} max={14} className="input" defaultValue={user.weekly_goal} />
      </div>
      <div>
        <label className="label" htmlFor="timezone">Timezone</label>
        <input id="timezone" name="timezone" className="input" defaultValue={user.timezone} placeholder="Asia/Kolkata" />
      </div>
      <div className="sm:col-span-2">
        <button className="btn-primary" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? "Saving…" : "Save changes"}</button>
      </div>
    </form>
  );
}
