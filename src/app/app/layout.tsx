import { getUser } from "@/lib/auth";
import { getAccount } from "@/lib/linkedin";
import { getOnboarding } from "@/lib/onboarding";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Signed-out visitors: let the page redirect to /login (pages pass their own return path).
  const user = await getUser();
  if (!user) return <>{children}</>;
  const [acct, onboarding] = await Promise.all([getAccount(user.id), getOnboarding(user.id)]);
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        user={{ name: user.name, email: user.email, avatar: acct?.picture ?? null }}
        linkedin={Boolean(acct)}
        claude={onboarding.claude}
        setup={{ done: onboarding.done, total: onboarding.total }}
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
