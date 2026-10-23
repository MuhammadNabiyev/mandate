import { describe, expect, it } from "vitest";
import { buildProposal, parseBudgetCents, pickOffline } from "./agent";
import { evaluate, remainingBudget, spentInWindow } from "./policy";
import type { LedgerEntry, Mandate } from "./types";

const NOW = new Date("2026-11-01T12:00:00Z");

const mandate = (over: Partial<Mandate> = {}): Mandate => ({
  id: "m1",
  name: "Office supplies",
  agent: "Claude",
  perPurchaseCents: 5000,
  periodCents: 10000,
  period: "week",
  approvalAboveCents: 3000,
  categories: ["office", "groceries", "household"],
  blockedMerchants: [],
  expiresAt: "2026-12-01T00:00:00Z",
  status: "active",
  createdAt: "2026-10-25T00:00:00Z",
  ...over,
});

const propose = (m: Mandate, picks: { sku: string; qty: number }[]) =>
  buildProposal({ mandate: m, request: "test", picks, rationale: "", source: "offline", now: NOW });

const paid = (totalCents: number, at: string, mandateId = "m1"): LedgerEntry => ({
  id: `e_${at}`,
  mandateId,
  proposal: propose(mandate(), [{ sku: "of-pens", qty: 1 }]),
  verdict: { decision: "allow", reasons: [], totalCents, remainingCents: 0 },
  status: "paid",
  totalCents,
  mode: "simulated",
  at,
});

describe("evaluate", () => {
  it("allows a small in-scope purchase", () => {
    const v = evaluate(mandate(), propose(mandate(), [{ sku: "of-pens", qty: 1 }]), [], NOW);
    expect(v.decision).toBe("allow");
    expect(v.totalCents).toBe(890);
  });

  it("asks the owner above the approval threshold but inside the limits", () => {
    const v = evaluate(mandate(), propose(mandate(), [{ sku: "of-lamp", qty: 1 }]), [], NOW);
    expect(v.decision).toBe("approve");
    expect(v.reasons[0].code).toBe("NEEDS_APPROVAL");
  });

  it("denies a category the mandate does not cover", () => {
    const v = evaluate(mandate(), propose(mandate(), [{ sku: "al-wine", qty: 1 }]), [], NOW);
    expect(v.decision).toBe("deny");
    expect(v.reasons.map((r) => r.code)).toContain("CATEGORY");
  });

  it("denies a blocked merchant, case-insensitively", () => {
    const m = mandate({ blockedMerchants: ["lumen office"] });
    const v = evaluate(m, propose(m, [{ sku: "of-pens", qty: 1 }]), [], NOW);
    expect(v.reasons.map((r) => r.code)).toContain("MERCHANT");
  });

  it("denies over the per-purchase limit", () => {
    const v = evaluate(mandate(), propose(mandate(), [{ sku: "of-lamp", qty: 2 }]), [], NOW);
    expect(v.decision).toBe("deny");
    expect(v.reasons.map((r) => r.code)).toContain("PER_PURCHASE_LIMIT");
  });

  it("denies when the rolling period budget is used up", () => {
    const ledger = [paid(9500, "2026-10-30T12:00:00Z")];
    const v = evaluate(mandate(), propose(mandate(), [{ sku: "of-pens", qty: 1 }]), ledger, NOW);
    expect(v.decision).toBe("deny");
    expect(v.reasons.map((r) => r.code)).toContain("PERIOD_LIMIT");
    expect(v.remainingCents).toBe(500);
  });

  it("ignores spending outside the window, other mandates and unpaid entries", () => {
    const old = paid(9000, "2026-10-20T12:00:00Z");
    const other = paid(9000, "2026-10-31T12:00:00Z", "m2");
    const unpaid = { ...paid(9000, "2026-10-31T12:00:00Z"), status: "awaiting" as const };
    expect(spentInWindow(mandate(), [old, other, unpaid], NOW)).toBe(0);
    expect(remainingBudget(mandate(), [old, other, unpaid], NOW)).toBe(10000);
  });

  it("denies a revoked, paused or expired mandate and an empty cart", () => {
    const p = (m: Mandate) => propose(m, [{ sku: "of-pens", qty: 1 }]);
    expect(evaluate(mandate({ status: "revoked" }), p(mandate()), [], NOW).reasons[0].code).toBe("REVOKED");
    expect(evaluate(mandate({ status: "paused" }), p(mandate()), [], NOW).reasons[0].code).toBe("PAUSED");
    expect(evaluate(mandate({ expiresAt: "2026-10-01T00:00:00Z" }), p(mandate()), [], NOW).reasons[0].code).toBe("EXPIRED");
    expect(evaluate(mandate(), propose(mandate(), []), [], NOW).reasons[0].code).toBe("EMPTY");
  });

  it("reports every problem at once, not just the first", () => {
    const m = mandate();
    const v = evaluate(m, propose(m, [{ sku: "al-whisky", qty: 1 }]), [], NOW);
    expect(v.reasons.map((r) => r.code)).toEqual(expect.arrayContaining(["CATEGORY", "PER_PURCHASE_LIMIT"]));
  });
});

describe("agent", () => {
  it("drops products that are not in the catalog and clamps nonsense quantities", () => {
    const p = propose(mandate(), [
      { sku: "made-up", qty: 1 },
      { sku: "of-pens", qty: 0 },
      { sku: "of-pens", qty: 99 },
      { sku: "of-pens", qty: 2 },
    ]);
    expect(p.items).toHaveLength(1);
    expect(p.items[0].sku).toBe("of-pens");
    expect(p.items[0].qty).toBe(2);
  });

  it("parses budgets", () => {
    expect(parseBudgetCents("a desk lamp under $40")).toBe(4000);
    expect(parseBudgetCents("max 12.50 dollars")).toBe(1250);
    expect(parseBudgetCents("a lamp")).toBeNull();
  });

  it("matches the offline request to a sensible item inside the budget", () => {
    expect(pickOffline("a desk lamp under $40").picks[0].sku).toBe("of-lamp");
    expect(pickOffline("coffee beans").picks[0].sku).toBe("gr-coffee");
    expect(pickOffline("xyzzy plugh").picks).toHaveLength(0);
  });

  it("does not know about policy: it will propose the whisky", () => {
    expect(pickOffline("a bottle of whisky").picks[0].sku).toBe("al-whisky");
  });
});
