export const CATEGORIES = [
  "groceries",
  "household",
  "office",
  "electronics",
  "books",
  "gifts",
  "health",
  "subscriptions",
  "alcohol",
  "gambling",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type Period = "day" | "week" | "month";
export type MandateStatus = "active" | "paused" | "revoked";

/** The owner's standing instructions for one AI agent. Money is always integer cents. */
export interface Mandate {
  id: string;
  name: string;
  agent: string;
  perPurchaseCents: number;
  periodCents: number;
  period: Period;
  /** Purchases above this need the owner's explicit OK even though they are inside the limits. */
  approvalAboveCents: number;
  categories: Category[];
  blockedMerchants: string[];
  expiresAt: string;
  status: MandateStatus;
  createdAt: string;
}

export interface CatalogItem {
  sku: string;
  title: string;
  merchant: string;
  category: Category;
  priceCents: number;
  blurb: string;
}

export interface LineItem {
  sku: string;
  title: string;
  merchant: string;
  category: Category;
  unitCents: number;
  qty: number;
}

export interface Proposal {
  id: string;
  mandateId: string;
  request: string;
  items: LineItem[];
  rationale: string;
  /** "ai" when a language model chose the items, "offline" for the built-in matcher. */
  source: "ai" | "offline";
  createdAt: string;
}

export type ReasonCode =
  | "REVOKED"
  | "PAUSED"
  | "EXPIRED"
  | "EMPTY"
  | "CATEGORY"
  | "MERCHANT"
  | "PER_PURCHASE_LIMIT"
  | "PERIOD_LIMIT"
  | "NEEDS_APPROVAL";

export interface Reason {
  code: ReasonCode;
  message: string;
  sku?: string;
}

export type Decision = "allow" | "approve" | "deny";

export interface Verdict {
  decision: Decision;
  reasons: Reason[];
  totalCents: number;
  /** What is left of the period budget before this purchase. */
  remainingCents: number;
}

export type EntryStatus = "denied" | "awaiting" | "paid" | "declined" | "cancelled";

export interface LedgerEntry {
  id: string;
  mandateId: string;
  proposal: Proposal;
  verdict: Verdict;
  status: EntryStatus;
  totalCents: number;
  mode: "sandbox" | "simulated";
  paypalOrderId?: string;
  paypalCaptureId?: string;
  at: string;
}

export interface AppState {
  mandates: Mandate[];
  ledger: LedgerEntry[];
}
