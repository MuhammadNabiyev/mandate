import type { LedgerEntry, Mandate, Period, Proposal, Reason, Verdict } from "./types";

const HOUR = 3_600_000;
export const PERIOD_MS: Record<Period, number> = {
  day: 24 * HOUR,
  week: 7 * 24 * HOUR,
  month: 30 * 24 * HOUR,
};

export const proposalTotal = (p: Pick<Proposal, "items">): number =>
  p.items.reduce((sum, i) => sum + i.unitCents * i.qty, 0);

/** Money the mandate has already spent inside its rolling window. Only paid entries count. */
export function spentInWindow(mandate: Mandate, ledger: LedgerEntry[], now: Date): number {
  const from = now.getTime() - PERIOD_MS[mandate.period];
  return ledger
    .filter((e) => e.mandateId === mandate.id && e.status === "paid" && new Date(e.at).getTime() > from)
    .reduce((sum, e) => sum + e.totalCents, 0);
}

export const remainingBudget = (mandate: Mandate, ledger: LedgerEntry[], now: Date): number =>
  Math.max(0, mandate.periodCents - spentInWindow(mandate, ledger, now));

const usd = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

/**
 * The whole point of the product: a pure, deterministic judge. No model is ever asked whether a
 * purchase is allowed. A model proposes, this function disposes.
 */
export function evaluate(mandate: Mandate, proposal: Proposal, ledger: LedgerEntry[], now: Date): Verdict {
  const totalCents = proposalTotal(proposal);
  const remainingCents = remainingBudget(mandate, ledger, now);
  const reasons: Reason[] = [];

  if (mandate.status === "revoked") reasons.push({ code: "REVOKED", message: "This mandate was revoked. The agent has no spending power." });
  if (mandate.status === "paused") reasons.push({ code: "PAUSED", message: "This mandate is paused. Resume it to let the agent buy." });
  if (now.getTime() > new Date(mandate.expiresAt).getTime()) reasons.push({ code: "EXPIRED", message: "This mandate has expired." });
  if (proposal.items.length === 0 || totalCents <= 0) reasons.push({ code: "EMPTY", message: "The cart is empty." });

  for (const item of proposal.items) {
    if (!mandate.categories.includes(item.category)) {
      reasons.push({ code: "CATEGORY", sku: item.sku, message: `${item.title} is in “${item.category}”, which this mandate does not cover.` });
    }
    if (mandate.blockedMerchants.some((m) => m.toLowerCase() === item.merchant.toLowerCase())) {
      reasons.push({ code: "MERCHANT", sku: item.sku, message: `${item.merchant} is on this mandate's blocked list.` });
    }
  }

  if (totalCents > mandate.perPurchaseCents) {
    reasons.push({ code: "PER_PURCHASE_LIMIT", message: `${usd(totalCents)} is over the ${usd(mandate.perPurchaseCents)} per-purchase limit.` });
  }
  if (totalCents > remainingCents) {
    reasons.push({ code: "PERIOD_LIMIT", message: `${usd(totalCents)} is more than the ${usd(remainingCents)} left this ${mandate.period}.` });
  }

  if (reasons.length > 0) return { decision: "deny", reasons, totalCents, remainingCents };

  if (totalCents > mandate.approvalAboveCents) {
    return {
      decision: "approve",
      reasons: [{ code: "NEEDS_APPROVAL", message: `Anything above ${usd(mandate.approvalAboveCents)} needs your OK first.` }],
      totalCents,
      remainingCents,
    };
  }
  return { decision: "allow", reasons: [], totalCents, remainingCents };
}
