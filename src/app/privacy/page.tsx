import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy policy · Cadence" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="November 11, 2026">
      <section>
        <p>
          Cadence is a LinkedIn post studio and scheduler. Your own Claude writes your posts; Cadence stores, previews, schedules and publishes
          them. Cadence contains no AI and never sends your content to an AI provider. This policy explains what we collect and why.
        </p>
      </section>
      <section>
        <h2>What we collect</h2>
        <ul>
          <li><b>Account details:</b> your name, email address and, if you sign in with Google or LinkedIn, your profile photo and an account identifier from that provider.</li>
          <li><b>Your posts:</b> the drafts, images, schedules and publishing history you create in Cadence, including posts saved by your Claude through the Cadence connector.</li>
          <li><b>LinkedIn connection:</b> if you connect LinkedIn, an access token that lets Cadence publish posts you approve or schedule. We request only sign-in and “post on your behalf” permissions. We cannot read your feed, messages or connections.</li>
          <li><b>Claude connection:</b> a token that lets your Claude call Cadence’s tools (save, update, schedule, publish posts) for your account only.</li>
          <li><b>Basic settings:</b> timezone, headline and weekly posting goal.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To sign you in and keep your workspace private to you.</li>
          <li>To show, edit and schedule your posts, and to publish them to LinkedIn at the time you choose.</li>
          <li>To show your streaks, goals and calendar.</li>
        </ul>
        <p className="mt-2">We do not sell your data, use it for advertising, or share it with third parties except the services needed to run Cadence (hosting on Vercel, database on Supabase) and LinkedIn when you publish.</p>
      </section>
      <section>
        <h2>Google user data</h2>
        <p>
          If you sign in with Google, Cadence receives only your name, email address and profile photo (scopes: openid, email, profile). We use
          them solely to create and identify your Cadence account. We do not access any other Google data. Cadence’s use of information
          received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.
        </p>
      </section>
      <section>
        <h2>Your choices</h2>
        <ul>
          <li>Disconnect LinkedIn or Claude at any time in Settings. Their tokens are revoked immediately.</li>
          <li>You can also remove Cadence from your LinkedIn or Google account settings.</li>
          <li>To delete your account and all your data, message us (see Contact below) and we will delete it within 30 days.</li>
        </ul>
      </section>
      <section>
        <h2>Security</h2>
        <p>Data is stored in a managed Postgres database and served over HTTPS. Passwords are hashed with bcrypt. OAuth tokens issued to Claude are stored only as hashes.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Questions or deletion requests: message us on the <a className="font-medium text-brand underline" href="https://www.linkedin.com/company/145439441/" target="_blank" rel="noreferrer">Cadence Studio LinkedIn page</a>.</p>
      </section>
    </LegalPage>
  );
}
