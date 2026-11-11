"use client";

import { Gift, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "./ui/Toast";

export function ClaimButton({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();
  return (
    <button
      className="btn-primary h-9 w-full"
      disabled={busy || pending}
      onClick={async () => {
        setBusy(true);
        const res = await fetch("/api/milestones/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
        setBusy(false);
        if (!res.ok) return toast({ tone: "error", title: "Couldn’t claim this reward" });
        toast({ tone: "success", title: "Reward claimed 🎉", body: "Saved to your account. It’s applied when you upgrade." });
        start(() => router.refresh());
      }}
    >
      {busy || pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />} Claim reward
    </button>
  );
}
