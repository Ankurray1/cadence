"use client";

import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { LinkedInMark } from "./Logo";

const ERRORS: Record<string, string> = {
  denied: "LinkedIn sign-in was cancelled.",
  expired: "Sign-in took too long. Please try again.",
  failed: "Couldn’t sign in with LinkedIn. Please try again.",
  not_configured: "LinkedIn sign-in isn’t available right now. Use email below.",
  google_not_configured: "Google sign-in isn’t available yet. Use LinkedIn or email.",
  google_denied: "Google sign-in was cancelled.",
  google_email: "Your Google account needs a verified email.",
  google_failed: "Couldn’t sign in with Google. Please try again.",
  demo: "That’s the shared demo account. Sign in with email instead.",
};

function GoogleMark({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function SignInPanel({
  next,
  linkedinEnabled,
  googleEnabled = false,
  initialMode = "login",
  liError,
  title,
  subtitle,
  linkedinMode = "signin",
}: {
  next: string;
  linkedinEnabled: boolean;
  googleEnabled?: boolean;
  initialMode?: "login" | "signup";
  liError?: string;
  title?: string;
  subtitle?: string;
  /** "switch" = use whichever LinkedIn account they log in with, ignoring any current Cadence session. */
  linkedinMode?: "signin" | "switch";
}) {
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState(liError ? ERRORS[liError] ?? "" : "");
  const [busy, setBusy] = useState<null | "email" | "linkedin" | "google">(null);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    document.cookie = `tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}; path=/; max-age=600; samesite=lax`;
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("email");
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || "Something went wrong");
      setBusy(null);
      return;
    }
    window.location.href = next;
  }

  const isSignup = mode === "signup";
  return (
    <div>
      <h1 className="font-display text-[32px] leading-tight font-bold">{title ?? (isSignup ? "Create your studio" : "Welcome back")}</h1>
      <p className="mt-1.5 text-[15px] text-muted">{subtitle ?? (isSignup ? "Free to start. Set up in under two minutes." : "Sign in to keep your posting streak alive.")}</p>

      {/* Mode switch */}
      <div className="mt-6 grid grid-cols-2 rounded-full bg-hover p-1 text-[14px] font-medium">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(""); }}
            className={`h-9 rounded-full transition ${mode === m ? "bg-surface text-ink shadow-[var(--shadow-soft)]" : "text-muted hover:text-ink"}`}
          >
            {m === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      {/* One-click options */}
      <div className="mt-6 space-y-3">
        {linkedinEnabled && (
          <div className="relative">
            <a
              href={`/api/auth/linkedin?next=${encodeURIComponent(next)}${linkedinMode === "switch" ? "&mode=switch" : ""}`}
              onClick={() => setBusy("linkedin")}
              className="btn-linkedin h-12 w-full text-[15px]"
            >
              {busy === "linkedin" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkedInMark className="h-[18px] w-[18px]" />}
              Continue with LinkedIn
            </a>
            <span className="absolute -top-2.5 right-4 chip h-5 bg-apricot px-2 text-[11px] font-semibold text-ink shadow-sm">
              <Sparkles className="h-3 w-3" /> Recommended
            </span>
            <p className="mt-1.5 text-center text-[12px] text-muted">One click signs you in <b className="font-medium text-ink-2">and</b> connects publishing.</p>
          </div>
        )}
        {googleEnabled && (
          <a
            href={`/api/auth/google?next=${encodeURIComponent(next)}`}
            onClick={() => setBusy("google")}
            className="btn-secondary h-12 w-full text-[15px]"
          >
            {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
            Continue with Google
          </a>
        )}
      </div>

      {(linkedinEnabled || googleEnabled) ? (
        <div className="my-6 flex items-center gap-3 text-[12px] text-faint">
          <span className="h-px flex-1 bg-line" /> or use your email <span className="h-px flex-1 bg-line" />
        </div>
      ) : (
        <div className="h-2" />
      )}

      <form onSubmit={submit} className="space-y-3.5">
        {isSignup && (
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" name="name" className="input h-12" placeholder="Your full name" required autoComplete="name" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input h-12" placeholder="you@company.com" required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              className="input h-12 pr-12"
              placeholder={isSignup ? "At least 8 characters" : "Your password"}
              required
              minLength={isSignup ? 8 : undefined}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
            <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute top-1/2 right-3 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-faint hover:bg-hover hover:text-ink">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {error && <p className="rounded-2xl bg-danger-soft px-4 py-3 text-[13px] text-danger" role="alert">{error}</p>}
        <button className="btn-primary h-12 w-full text-[15px]" disabled={busy !== null}>
          {busy === "email" && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSignup ? "Create my studio" : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-muted">
        {isSignup ? "Already have an account?" : "New to Cadence?"}{" "}
        <button type="button" className="font-semibold text-brand hover:underline" onClick={() => { setMode(isSignup ? "login" : "signup"); setError(""); }}>
          {isSignup ? "Sign in" : "Create a free account"}
        </button>
      </p>
      {isSignup && <p className="mt-4 text-center text-[12px] leading-relaxed text-faint">By creating an account you agree to post responsibly. Cadence only publishes what you approve.</p>}
    </div>
  );
}
