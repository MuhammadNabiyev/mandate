import type { AppState, Mandate } from "./types";

/** Two ready-made envelopes so the demo works with zero setup. */
export function sampleState(now: Date): AppState {
  const in30 = new Date(now.getTime() + 30 * 86_400_000).toISOString();
  const mandates: Mandate[] = [
    {
      id: "mnd_office",
      name: "Studio supplies",
      agent: "Claude",
      perPurchaseCents: 5000,
      periodCents: 15000,
      period: "week",
      approvalAboveCents: 2500,
      categories: ["office", "electronics", "household"],
      blockedMerchants: [],
      expiresAt: in30,
      status: "active",
      createdAt: now.toISOString(),
    },
    {
      id: "mnd_pantry",
      name: "Weekly pantry",
      agent: "Home assistant",
      perPurchaseCents: 6000,
      periodCents: 12000,
      period: "week",
      approvalAboveCents: 4000,
      categories: ["groceries", "household", "health"],
      blockedMerchants: ["Cellar & Co"],
      expiresAt: in30,
      status: "active",
      createdAt: now.toISOString(),
    },
  ];
  return { mandates, ledger: [] };
}
