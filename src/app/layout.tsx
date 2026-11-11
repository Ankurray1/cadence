import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

const DESCRIPTION =
  "The LinkedIn workspace for your Claude. Claude writes the post; Cadence previews it the way LinkedIn shows it, schedules it and publishes on time. No AI fees.";

export const metadata: Metadata = {
  metadataBase: new URL("https://cadence-for-claude.vercel.app"),
  title: "Cadence: LinkedIn studio for Claude",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Cadence",
    title: "Cadence: Your Claude writes it. Cadence ships it.",
    description: DESCRIPTION,
    url: "/",
    images: [{ url: "/cadence-logo.png", alt: "Cadence" }],
  },
  twitter: {
    card: "summary",
    title: "Cadence: Your Claude writes it. Cadence ships it.",
    description: DESCRIPTION,
    images: ["/cadence-logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-[14px]">
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
