import { requireUser } from "@/lib/auth";
import { getOnboarding } from "@/lib/onboarding";
import { GuidePage } from "@/components/onboarding/Guide";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const user = await requireUser();
  const state = await getOnboarding(user.id);
  return <GuidePage state={state} />;
}
