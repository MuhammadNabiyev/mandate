import { CATALOG, catalogBySku } from "./catalog";
import type { CatalogItem, LineItem, Mandate, Proposal } from "./types";

export interface Pick {
  sku: string;
  qty: number;
}

const STOP = new Set(["a", "an", "the", "for", "to", "of", "and", "or", "me", "my", "some", "buy", "get", "order", "need", "want", "please", "under", "below", "than", "less", "with", "in", "on", "up", "at", "i", "it", "that", "this", "new"]);

const tokens = (s: string): string[] =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));

/** "under $40", "max 25 dollars", "$40 budget" -> cents. */
export function parseBudgetCents(request: string): number | null {
  const m =
    request.match(/(?:under|below|max(?:imum)?|up to|at most|within|budget(?: of)?|less than)\s*\$?\s*(\d+(?:\.\d{1,2})?)/i) ??
    request.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  return m ? Math.round(parseFloat(m[1]) * 100) : null;
}

/** "3 packs of pens", "two coffee" -> qty hint for the best match; defaults to 1. */
function parseQty(request: string): number {
  const words: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
  const m = request.toLowerCase().match(/\b(\d{1,2}|one|two|three|four|five|six)\b(?!\s*(?:dollars|usd|\$|%|l\b|kg\b|g\b))/);
  if (!m) return 1;
  const n = words[m[1]] ?? Number(m[1]);
  return n >= 1 && n <= 10 ? n : 1;
}

const score = (item: CatalogItem, want: string[]): number => {
  const title = new Set(tokens(item.title));
  const rest = new Set(tokens(`${item.blurb} ${item.category} ${item.merchant}`));
  let s = 0;
  for (const w of want) {
    if (title.has(w)) s += 4;
    else if (rest.has(w)) s += 2;
    else if ([...title, ...rest].some((h) => h.length > 3 && w.length > 3 && (h.startsWith(w) || w.startsWith(h)))) s += 1;
  }
  return s;
};

/**
 * The built-in matcher used when no language model is configured. Deliberately naive about policy:
 * it does not know about mandates, so it will happily propose a whisky. The judge decides.
 */
export function pickOffline(request: string, catalog: CatalogItem[] = CATALOG): { picks: Pick[]; rationale: string } {
  const want = tokens(request).filter((t) => !/^\d/.test(t));
  const budget = parseBudgetCents(request);
  const qty = parseQty(request);
  const ranked = catalog
    .map((item) => ({ item, s: score(item, want) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || a.item.priceCents - b.item.priceCents);

  if (ranked.length === 0) return { picks: [], rationale: "Nothing in the store matches that request." };

  const top = ranked[0].s;
  const best = ranked.filter((r) => r.s === top && (budget == null || r.item.priceCents * qty <= budget));
  const chosen = (best.length ? best : ranked.filter((r) => budget == null || r.item.priceCents <= budget)).at(0) ?? ranked[0];
  const q = chosen.item.priceCents * qty > (budget ?? Infinity) ? 1 : qty;
  return {
    picks: [{ sku: chosen.item.sku, qty: q }],
    rationale: `Closest match for “${request.trim()}”${budget ? ` within $${(budget / 100).toFixed(0)}` : ""}: ${chosen.item.title} from ${chosen.item.merchant}.`,
  };
}

let seq = 0;
export const newId = (prefix: string): string => `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Turn raw picks (from a model or the matcher) into a proposal, dropping anything not in the catalog. */
export function buildProposal(args: {
  mandate: Mandate;
  request: string;
  picks: Pick[];
  rationale: string;
  source: Proposal["source"];
  now?: Date;
}): Proposal {
  const items: LineItem[] = [];
  for (const p of args.picks) {
    const c = catalogBySku.get(p.sku);
    const qty = Math.trunc(p.qty);
    if (!c || !(qty >= 1) || qty > 20) continue;
    const existing = items.find((i) => i.sku === c.sku);
    if (existing) existing.qty = Math.min(20, existing.qty + qty);
    else items.push({ sku: c.sku, title: c.title, merchant: c.merchant, category: c.category, unitCents: c.priceCents, qty });
  }
  return {
    id: newId("prop"),
    mandateId: args.mandate.id,
    request: args.request,
    items,
    rationale: args.rationale,
    source: args.source,
    createdAt: (args.now ?? new Date()).toISOString(),
  };
}
