"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { buildProposal, pickOffline } from "@/lib/agent";
import { usd } from "@/lib/format";
import { evaluate } from "@/lib/policy";
import type { Mandate } from "@/lib/types";
import { VerdictStamp } from "./brand";
import { Envelope } from "./envelope";

const REQUESTS = ["a pack of gel pens", "a desk lamp under $40", "a bottle of single malt whisky"];

const noopSubscribe = () => () => {};
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The real policy engine running on the landing page, so the claim is proven rather than described. */
export function LandingDemo() {
  const [i, setI] = useState(0);
  const [touched, setTouched] = useState(false);
  const reduce = useSyncExternalStore(noopSubscribe, reducedMotion, () => true);

  const now = useMemo(() => new Date(), []);
  const mandate: Mandate = useMemo(
    () => ({
      id: "demo",
      name: "Studio supplies",
      agent: "Claude",
      perPurchaseCents: 5000,
      periodCents: 15000,
      period: "week",
      approvalAboveCents: 2500,
      categories: ["office", "electronics", "household"],
      blockedMerchants: [],
      expiresAt: new Date(now.getTime() + 21 * 86_400_000).toISOString(),
      status: "active",
      createdAt: now.toISOString(),
    }),
    [now],
  );

  const result = useMemo(() => {
    const request = REQUESTS[i];
    const picked = pickOffline(request);
    const proposal = buildProposal({ mandate, request, picks: picked.picks, rationale: picked.rationale, source: "offline", now });
    return { proposal, verdict: evaluate(mandate, proposal, [], now) };
  }, [i, mandate, now]);

  useEffect(() => {
    if (touched || reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % REQUESTS.length), 5200);
    return () => clearInterval(t);
  }, [touched, reduce]);

  const item = result.proposal.items[0];

  return (
    <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]" data-testid="landing-demo">
      <div className="relative">
        <Envelope mandate={mandate} remainingCents={mandate.periodCents} now={now} stamp={<VerdictStamp key={i} decision={result.verdict.decision} size="md" />} />
      </div>

      <div className="mt-6 md:mt-0">
        <p className="text-sm font-semibold text-ink-soft">The agent asks</p>
        <p className="mt-1 text-[1.35rem] leading-snug font-semibold" key={`r-${i}`}>
          “{REQUESTS[i]}”
        </p>
        {item && (
          <p className="mt-2 text-ink-soft">
            {item.title}, {item.merchant}: <span className="num font-semibold text-ink">{usd(result.verdict.totalCents)}</span>
          </p>
        )}
        <ul className="mt-4 min-h-[5.5rem] space-y-1.5 font-mono text-[0.8rem] leading-snug" key={`v-${i}`}>
          {result.verdict.decision === "allow" ? (
            <li className="franked text-ink-soft" style={{ ["--i" as string]: 0 }}>
              every rule passed: category, merchant, limit, budget
            </li>
          ) : (
            result.verdict.reasons.map((r, n) => (
              <li key={`${r.code}-${n}`} className="franked flex gap-2" style={{ ["--i" as string]: n }}>
                <span className="shrink-0 font-bold">{r.code.toLowerCase().replaceAll("_", "-")}</span>
                <span className="text-ink-soft">{r.message}</span>
              </li>
            ))
          )}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Try a request">
          {REQUESTS.map((r, n) => (
            <button
              key={r}
              type="button"
              className="chip"
              aria-pressed={i === n}
              onClick={() => {
                setTouched(true);
                setI(n);
              }}
            >
              {r.replace(" under $40", "")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
