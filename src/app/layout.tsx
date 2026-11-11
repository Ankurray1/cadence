import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Cadence: LinkedIn studio for Claude",
  description: "Your Claude writes it. Cadence makes it look right and posts it on time.",
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
