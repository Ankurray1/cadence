import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { authorizeUrl, linkedinConfigured } from "@/lib/linkedin";

/**
 * Start "Continue with LinkedIn".
 *  - mode=signin (default): sign in / sign up; if already signed in, connect LinkedIn to this workspace.
 *  - mode=switch: the LinkedIn account becomes the identity — open (or create) THAT account's workspace.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/app";
  const mode = url.searchParams.get("mode") === "switch" ? "switch" : "signin";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/app";
  if (!linkedinConfigured()) {
    const back = new URL(safeNext, req.url);
    back.searchParams.set("li_error", "not_configured");
    return Response.redirect(back);
  }
  const state = randomBytes(16).toString("hex");
  (await cookies()).set("li_state", JSON.stringify({ state, next: safeNext, mode }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  return Response.redirect(authorizeUrl(state));
}
