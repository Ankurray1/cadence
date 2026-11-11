import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { SignInPanel } from "@/components/AuthForm";
import { getUser } from "@/lib/auth";
import { googleConfigured } from "@/lib/google";
import { linkedinConfigured } from "@/lib/linkedin";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; li_error?: string; auth_error?: string }> }) {
  const sp = await searchParams;
  const next = sp.next?.startsWith("/") ? sp.next : "/app";
  if (await getUser()) redirect(next);
  return (
    <AuthShell>
      <SignInPanel next={next} linkedinEnabled={linkedinConfigured()} googleEnabled={googleConfigured()} liError={sp.li_error ?? sp.auth_error} />
    </AuthShell>
  );
}
