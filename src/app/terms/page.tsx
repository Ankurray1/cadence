import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of service · Cadence" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="November 11, 2026">
      <section>
        <p>By using Cadence you agree to these terms. If you don’t agree, please don’t use Cadence.</p>
      </section>
      <section>
        <h2>The service</h2>
        <p>
          Cadence lets you save, edit, preview, schedule and publish LinkedIn posts, and connects to your own Claude account through the Model
          Context Protocol. Cadence is an early product and may change, and it is provided “as is” without warranties.
        </p>
      </section>
      <section>
        <h2>Your content and your accounts</h2>
        <ul>
          <li>You own the posts you create. You give Cadence permission to store and process them only to provide the service.</li>
          <li>You are responsible for what you publish and for following LinkedIn’s User Agreement and Professional Community Policies.</li>
          <li>Cadence publishes only posts you publish or schedule yourself, or that you explicitly ask your Claude to publish.</li>
        </ul>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <p>Don’t use Cadence to spam, impersonate others, post unlawful content, or try to access other people’s accounts or data.</p>
      </section>
      <section id="rewards">
        <h2>Consistency rewards</h2>
        <ul>
          <li>A streak counts consecutive calendar days, in your timezone, on which a post went live on LinkedIn through Cadence. Demo or simulated posts don’t count, and only one post per day counts.</li>
          <li>Milestones: your first post (a celebration, no reward), a 21-day streak (unlocks your first offer), a 29-day streak (Cadence covers 50% of one month of LinkedIn Premium), a 60-day streak (Cadence pays for one month of LinkedIn Premium) and a 90-day streak (Cadence pays for one more month of LinkedIn Premium).</li>
          <li>LinkedIn Premium rewards are funded by Cadence, either as a reimbursement of a paid month or as a Premium gift. They are not a LinkedIn discount, and LinkedIn does not sponsor or endorse them.</li>
          <li>Claim a reward from your Dashboard. We confirm eligibility and reach out within 14 days. Each reward can be claimed once per person.</li>
          <li>Rewards have no cash value beyond the stated reimbursement and can’t be transferred. We may withhold rewards for posts that break these terms, such as spam or posts deleted to game a streak, and we may change or end the program for future milestones at any time.</li>
        </ul>
      </section>
      <section>
        <h2>Availability and liability</h2>
        <p>
          We work to publish scheduled posts on time, but we can’t guarantee it. For example, LinkedIn requires reconnecting every 60 days. To the
          extent allowed by law, Cadence is not liable for indirect or consequential losses arising from use of the service.
        </p>
      </section>
      <section>
        <h2>Ending your use</h2>
        <p>You can stop using Cadence and disconnect LinkedIn and Claude at any time. We may suspend accounts that break these terms.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Message us on the <a className="font-medium text-brand underline" href="https://www.linkedin.com/company/145439441/" target="_blank" rel="noreferrer">Cadence Studio LinkedIn page</a>.</p>
      </section>
    </LegalPage>
  );
}
