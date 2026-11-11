import { NextResponse } from "next/server";
import { PostError } from "@/lib/posts";
import { getUser } from "@/lib/auth";
import type { User } from "@/lib/types";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export async function withUser(fn: (user: User) => Promise<Response>) {
  const user = await getUser();
  if (!user) return json({ error: "Not signed in" }, 401);
  try {
    return await fn(user);
  } catch (e) {
    if (e instanceof PostError) return json({ error: e.message }, 400);
    console.error(e);
    return json({ error: "Server error" }, 500);
  }
}
