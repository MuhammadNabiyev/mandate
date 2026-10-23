"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConfig } from "@/lib/config-client";
import { Logo } from "./brand";

const NAV = [
  { href: "/desk", label: "Agent desk" },
  { href: "/mandates", label: "Envelopes" },
  { href: "/ledger", label: "Ledger" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const cfg = useConfig();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="no-print sticky top-0 z-30 border-b border-ink/15 bg-paper/92 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:gap-8 sm:px-6">
          <Link href="/" aria-label="Mandate home" className="shrink-0">
            <Logo iconOnlyOnMobile />
          </Link>
          <nav aria-label="Main" className="flex flex-1 items-center gap-1 sm:gap-2">
            {NAV.map((n) => {
              const active = path === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  data-testid={`nav-${n.href.slice(1)}`}
                  className="relative px-2.5 py-2 text-[0.95rem] font-semibold whitespace-nowrap text-ink-soft transition-colors hover:text-ink aria-[current=page]:text-ink sm:px-3"
                >
                  {n.label}
                  <span aria-hidden className="absolute inset-x-2.5 -bottom-[13px] h-[3px] origin-left rounded-t bg-ink transition-transform duration-300 sm:inset-x-3" style={{ transform: active ? "scaleX(1)" : "scaleX(0)", transitionTimingFunction: "var(--ease-out)" }} />
                </Link>
              );
            })}
          </nav>
          <p className="hidden text-xs text-ink-soft md:block" data-testid="mode-readout">
            {cfg === null ? "" : cfg.paypalClientId ? "PayPal sandbox connected" : "PayPal simulator"}
            {cfg === null ? "" : " · "}
            {cfg === null ? "" : cfg.ai ? "AI agent online" : "built-in matcher"}
          </p>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
      <footer className="no-print border-t border-ink/10 px-4 py-6 text-center text-xs text-ink-soft">
        Sandbox demo. No real money moves. A model proposes, plain code decides.
      </footer>
    </div>
  );
}
