import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { SignInPanel } from "@/components/AuthForm";
import { getUser } from "@/lib/auth";
import { googleConfigured } from "@/lib/google";
import { linkedinConfigured } from "@/lib/linkedin";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ li_error?: string; auth_error?: string }> }) {
  const sp = await searchParams;
  if (await getUser()) redirect("/app");
  return (
    <AuthShell>
      <SignInPanel next="/app" linkedinEnabled={linkedinConfigured()} googleEnabled={googleConfigured()} initialMode="signup" liError={sp.li_error ?? sp.auth_error} />
    </AuthShell>
  );
}
