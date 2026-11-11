import { clearSession } from "@/lib/auth";

export async function POST(req: Request) {
  await clearSession();
  let next = "/";
  try {
    const form = await req.formData();
    const n = String(form.get("next") || "");
    if (n.startsWith("/") && !n.startsWith("//")) next = n;
  } catch {}
  return Response.redirect(new URL(next, req.url), 303);
}
