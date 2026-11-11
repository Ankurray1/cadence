import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { googleAuthorizeUrl, googleConfigured } from "@/lib/google";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/app";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/app";
  if (!googleConfigured()) {
    const back = new URL("/login", req.url);
    back.searchParams.set("next", safeNext);
    back.searchParams.set("auth_error", "google_not_configured");
    return Response.redirect(back);
  }
  const state = randomBytes(16).toString("hex");
  (await cookies()).set("g_state", JSON.stringify({ state, next: safeNext }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  return Response.redirect(googleAuthorizeUrl(state));
}
