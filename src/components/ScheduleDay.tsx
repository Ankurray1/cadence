"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "./ui/Toast";

/** Creates a draft and opens it with the schedule picker pre-set to 9:00 AM on `day` (YYYY-MM-DD). */
export function ScheduleDay({ day, time = "09:00", label, className }: { day: string; time?: string; label?: string; className?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className={className}
      disabled={busy}
      aria-label={`Schedule a post on ${day}`}
      onClick={async () => {
        setBusy(true);
        const res = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: "", title: "Untitled post" }) });
        if (!res.ok) { setBusy(false); return toast({ tone: "error", title: "Couldn’t create a post" }); }
        const p = await res.json();
        router.push(`/app/posts/${p.id}?when=${day}T${time}`);
      }}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      {label}
    </button>
  );
}
