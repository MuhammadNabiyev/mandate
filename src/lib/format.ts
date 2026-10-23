import type { Mandate, Period } from "./types";

export const usd = (cents: number): string => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** Whole dollars when there are no cents, for headline figures. */
export const usdShort = (cents: number): string => (cents % 100 === 0 ? `$${(cents / 100).toLocaleString("en-US")}` : usd(cents));

export const PERIOD_LABEL: Record<Period, string> = { day: "today", week: "this week", month: "this month" };
export const PERIOD_NOUN: Record<Period, string> = { day: "day", week: "week", month: "month" };

export function whenLabel(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const mins = Math.round((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const daysLeft = (m: Mandate, now: Date = new Date()): number => Math.max(0, Math.ceil((new Date(m.expiresAt).getTime() - now.getTime()) / 86_400_000));
