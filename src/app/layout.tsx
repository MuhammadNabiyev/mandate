import type { Metadata, Viewport } from "next";
import { Azeret_Mono, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const sans = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"] });
const mono = Azeret_Mono({ variable: "--font-azeret", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mandate: spending limits for AI shopping agents",
  description:
    "Give an AI agent a spending mandate. A model proposes the purchase, plain code decides, PayPal pays. Per-purchase limits, rolling budgets, allowed categories and a one-click revoke.",
};

export const viewport: Viewport = { themeColor: "#f7f8fb" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
