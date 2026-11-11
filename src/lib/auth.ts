import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { sql } from "./db";
import type { User } from "./types";

const COOKIE = "cadence_session";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

export function newMcpToken() {
  return "cdn_" + randomBytes(20).toString("hex");
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export const getUser = cache(async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const [user] = await sql<User[]>`
      select id, email::text, name, headline, mcp_token, weekly_goal, timezone, is_demo
      from users where id = ${payload.uid as string}`;
    return user ?? null;
  } catch {
    return null;
  }
});

export async function requireUser(returnTo?: string): Promise<User> {
  const user = await getUser();
  if (!user) redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login");
  return user;
}

export async function userByMcpToken(token: string): Promise<User | null> {
  if (!token || !token.startsWith("cdn_")) return null;
  const [user] = await sql<User[]>`
    select id, email::text, name, headline, mcp_token, weekly_goal, timezone, is_demo
    from users where mcp_token = ${token}`;
  return user ?? null;
}
