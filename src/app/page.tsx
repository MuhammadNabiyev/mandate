import Link from "next/link";
import { Logo } from "@/components/brand";
import { ClientOnly } from "@/components/client-only";
import { LandingDemo } from "@/components/landing-demo";
import { TryLink } from "@/components/try-link";

const RULES = [
  ["Limits", "A ceiling for one purchase, a rolling budget per day, week or month, and a threshold above which the agent must ask you first."],
  ["Scope", "Which categories it may buy and which merchants are off limits, with sensitive ones like alcohol and gambling closed unless you open them."],
  ["Time", "Every mandate expires. Pause it for a day, or revoke it and the agent has no spending power from that moment."],
  ["Proof", "Each decision names the rule that fired and the numbers behind it, and lands in a ledger next to the PayPal order id."],
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-1">
          <Link href="/ledger" className="btn btn-quiet hidden sm:inline-flex">
            Ledger
          </Link>
          <TryLink className="btn btn-primary min-h-10">Open the demo</TryLink>
        </nav>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 sm:px-6">
        <section className="pt-8 pb-16 sm:pt-14 sm:pb-24">
          <h1 className="max-w-[17ch] text-[clamp(2.6rem,7vw,5.2rem)] leading-[0.98] tracking-[-0.035em]">Give your AI agent a budget, not your card.</h1>
          <p className="mt-6 max-w-[54ch] text-[1.2rem] leading-snug text-ink-soft">
            Mandate sits between an AI shopping agent and PayPal. The model proposes a purchase. Plain code, never the model, decides whether it is allowed.
          </p>
          <div className="mt-10">
            <ClientOnly fallback={<div className="min-h-[22rem]" aria-hidden />}>
              <LandingDemo />
            </ClientOnly>
          </div>
          <div className="mt-14 flex flex-wrap items-center gap-4">
            <TryLink className="btn btn-primary min-h-12 px-6 text-lg">Try the agent desk</TryLink>
            <p className="text-sm text-ink-soft">No sign-up. Runs on PayPal&apos;s sandbox, so no real money moves.</p>
          </div>
        </section>

        <section aria-labelledby="how-h" className="border-t border-ink/20 pt-12">
          <h2 id="how-h" className="max-w-[22ch] text-[clamp(1.8rem,3.6vw,2.6rem)]">
            A prompt can be talked around. A rule cannot.
          </h2>
          <p className="mt-4 max-w-[62ch] text-ink-soft">
            If a model decides what it may spend, a clever product page or a confused agent can change its mind. Here the model sees only the catalog and the request. The mandate, the budget and the history live outside it, and the server checks every limit again before it creates a PayPal order.
          </p>
          <dl className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {RULES.map(([t, d]) => (
              <div key={t} className="border-t border-ink/15 pt-4">
                <dt className="text-lg font-bold">{t}</dt>
                <dd className="mt-1 max-w-[46ch] text-ink-soft">{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-20 grid gap-8 border-t border-ink/20 pt-12 md:grid-cols-[1fr_1.2fr]">
          <h2 className="max-w-[16ch] text-[clamp(1.6rem,3vw,2.2rem)]">How a purchase moves</h2>
          <ol className="space-y-6">
            <li>
              <p className="font-bold">The agent asks for something.</p>
              <p className="text-ink-soft">An AI model (or the built-in matcher) picks products from the catalog. It cannot invent a product or a price.</p>
            </li>
            <li>
              <p className="font-bold">The mandate stamps it.</p>
              <p className="text-ink-soft">Cleared, held for your approval, or refused, with every broken rule listed.</p>
            </li>
            <li>
              <p className="font-bold">PayPal pays.</p>
              <p className="text-ink-soft">Cleared purchases become a PayPal Orders v2 order, approved and captured in the sandbox, and written to the ledger.</p>
            </li>
          </ol>
        </section>
      </main>

      <footer className="border-t border-ink/10 px-4 py-6 text-center text-xs text-ink-soft">
        Built for the PayPal AI Hackathon. Open source under the MIT licence. Demo storefront and sandbox payments only.
      </footer>
    </div>
  );
}
