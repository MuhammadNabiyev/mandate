import { buildProposal } from "./agent";
import { CATEGORIES, type Category, type LedgerEntry, type Mandate, type Proposal } from "./types";

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const cents = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 100_000_000;

/** Request bodies come from a browser, so every field is checked before the judge sees it. */
export function parseMandate(v: unknown): Mandate | null {
  if (!isObj(v)) return null;
  if (typeof v.id !== "string" || typeof v.name !== "string" || typeof v.agent !== "string") return null;
  if (!cents(v.perPurchaseCents) || !cents(v.periodCents) || !cents(v.approvalAboveCents)) return null;
  if (v.period !== "day" && v.period !== "week" && v.period !== "month") return null;
  if (v.status !== "active" && v.status !== "paused" && v.status !== "revoked") return null;
  if (typeof v.expiresAt !== "string" || Number.isNaN(Date.parse(v.expiresAt))) return null;
  if (typeof v.createdAt !== "string") return null;
  if (!Array.isArray(v.categories) || !Array.isArray(v.blockedMerchants)) return null;
  return {
    id: v.id,
    name: v.name.slice(0, 60),
    agent: v.agent.slice(0, 40),
    perPurchaseCents: v.perPurchaseCents,
    periodCents: v.periodCents,
    period: v.period,
    approvalAboveCents: v.approvalAboveCents,
    categories: v.categories.filter((c): c is Category => (CATEGORIES as readonly string[]).includes(c as string)),
    blockedMerchants: v.blockedMerchants.filter((m): m is string => typeof m === "string").slice(0, 20),
    expiresAt: v.expiresAt,
    status: v.status,
    createdAt: v.createdAt,
  };
}

/** Only the fields the judge reads. Everything else a client sends is dropped. */
export function parseLedger(v: unknown): LedgerEntry[] {
  if (!Array.isArray(v)) return [];
  const out: LedgerEntry[] = [];
  for (const e of v.slice(0, 500)) {
    if (!isObj(e) || typeof e.id !== "string" || typeof e.mandateId !== "string" || typeof e.at !== "string") continue;
    if (e.status !== "paid" && e.status !== "awaiting" && e.status !== "denied" && e.status !== "declined" && e.status !== "cancelled") continue;
    if (!cents(e.totalCents) || Number.isNaN(Date.parse(e.at))) continue;
    out.push({ ...(e as unknown as LedgerEntry) });
  }
  return out;
}

/** Never trust a client's prices: rebuild the proposal from the catalog using only sku and qty. */
export function parseProposal(v: unknown, mandate: Mandate): Proposal | null {
  if (!isObj(v) || !Array.isArray(v.items) || typeof v.request !== "string") return null;
  const picks = v.items.flatMap((i) => (isObj(i) && typeof i.sku === "string" && typeof i.qty === "number" ? [{ sku: i.sku, qty: i.qty }] : []));
  const p = buildProposal({
    mandate,
    request: v.request.slice(0, 300),
    picks,
    rationale: typeof v.rationale === "string" ? v.rationale.slice(0, 300) : "",
    source: v.source === "ai" ? "ai" : "offline",
  });
  if (typeof v.id === "string") p.id = v.id;
  return p;
}
