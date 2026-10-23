import { describe, expect, it } from "vitest";
import { draftMandateOffline, draftToMandate, sanitizeDraft } from "./ai";
import { captureOrder, createOrder } from "./paypal";
import { parseLedger, parseMandate, parseProposal } from "./validate";

describe("draftMandateOffline", () => {
  it("reads amounts by the words around them", () => {
    const d = draftMandateOffline("Books and gifts for my sister, $40 a time, $100 a month, ask me above $20, never Giftery");
    expect(d.perPurchaseCents).toBe(4000);
    expect(d.periodCents).toBe(10000);
    expect(d.period).toBe("month");
    expect(d.approvalAboveCents).toBe(2000);
    expect(d.blockedMerchants).toEqual(["Giftery"]);
    expect(d.categories).toEqual(expect.arrayContaining(["books", "gifts"]));
  });

  it("never opens alcohol or gambling on its own and honours negations", () => {
    const d = draftMandateOffline("Groceries and cleaning for my parents, $60 a time, $150 a week, no alcohol");
    expect(d.categories).toEqual(expect.arrayContaining(["groceries", "household"]));
    expect(d.categories).not.toContain("alcohol");
    expect(d.perPurchaseCents).toBe(6000);
    expect(d.periodCents).toBe(15000);
  });
});

describe("sanitizeDraft", () => {
  it("falls back on junk and keeps the ask threshold under the per-purchase limit", () => {
    const d = sanitizeDraft({ perPurchaseCents: -5, periodCents: "lots", categories: ["office", "weapons"], approvalAboveCents: 99_999_999, days: 9999 });
    expect(d.perPurchaseCents).toBe(5000);
    expect(d.categories).toEqual(["office"]);
    expect(d.approvalAboveCents).toBeLessThanOrEqual(d.perPurchaseCents);
    expect(d.days).toBe(30);
  });

  it("never lets the budget sit below one purchase", () => {
    const d = sanitizeDraft({ perPurchaseCents: 8000, periodCents: 3000 });
    expect(d.periodCents).toBeGreaterThanOrEqual(d.perPurchaseCents);
  });

  it("turns a draft into an active mandate that expires", () => {
    const now = new Date("2026-11-01T00:00:00Z");
    const m = draftToMandate(sanitizeDraft({ days: 10, categories: ["books"] }), "Claude", "m1", now);
    expect(m.status).toBe("active");
    expect(new Date(m.expiresAt).getTime() - now.getTime()).toBe(10 * 86_400_000);
  });
});

describe("request validation", () => {
  const good = {
    id: "m1", name: "x", agent: "a", perPurchaseCents: 5000, periodCents: 10000, period: "week", approvalAboveCents: 2000,
    categories: ["office", "nonsense"], blockedMerchants: ["A", 3], expiresAt: "2026-12-01T00:00:00Z", status: "active", createdAt: "2026-11-01T00:00:00Z",
  };

  it("accepts a well-formed mandate and trims unknown categories", () => {
    const m = parseMandate(good);
    expect(m?.categories).toEqual(["office"]);
    expect(m?.blockedMerchants).toEqual(["A"]);
  });

  it("rejects fractional cents, negative money, bad status and bad dates", () => {
    expect(parseMandate({ ...good, perPurchaseCents: 10.5 })).toBeNull();
    expect(parseMandate({ ...good, periodCents: -1 })).toBeNull();
    expect(parseMandate({ ...good, status: "god" })).toBeNull();
    expect(parseMandate({ ...good, expiresAt: "tomorrow" })).toBeNull();
    expect(parseMandate(null)).toBeNull();
  });

  it("re-prices a tampered proposal from the catalog", () => {
    const m = parseMandate(good)!;
    const p = parseProposal({ id: "p1", request: "r", items: [{ sku: "al-whisky", qty: 1, unitCents: 1, title: "free" }] }, m)!;
    expect(p.items[0].unitCents).toBe(6400);
    expect(p.items[0].title).toBe("Single malt whisky, 700 ml");
  });

  it("drops malformed ledger rows", () => {
    expect(parseLedger([{ id: "a", mandateId: "m", at: "2026-11-01T00:00:00Z", status: "paid", totalCents: 100 }, { id: "b" }, "x", null])).toHaveLength(1);
  });
});

describe("paypal simulator", () => {
  it("creates and captures a simulated order when no credentials are set", async () => {
    const order = await createOrder({ mandateId: "m", mandateName: "n", items: [], totalCents: 100, requestId: "req_abcdef123456" });
    expect(order.mode).toBe("simulated");
    expect(order.orderId.startsWith("SIM-")).toBe(true);
    const cap = await captureOrder(order.orderId);
    expect(cap.status).toBe("paid");
    expect(cap.captureId).toMatch(/^SIMCAP-/);
  });
});
