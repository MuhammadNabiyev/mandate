"use client";

import { useSyncExternalStore } from "react";
import { newId } from "./agent";
import { evaluate } from "./policy";
import type { AppState, LedgerEntry, Mandate, MandateStatus, Proposal, Verdict } from "./types";

const KEY = "mandate.state.v1";
const EVENT = "mandate:change";
export const EMPTY_STATE: AppState = { mandates: [], ledger: [] };

let cacheRaw: string | null = null;
let cacheValue: AppState = EMPTY_STATE;

function parse(raw: string): AppState {
  const v = JSON.parse(raw) as Partial<AppState>;
  return { mandates: Array.isArray(v.mandates) ? v.mandates : [], ledger: Array.isArray(v.ledger) ? v.ledger : [] };
}

function read(): AppState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) return cacheRaw === null ? cacheValue : EMPTY_STATE;
    if (raw !== cacheRaw) {
      cacheRaw = raw;
      cacheValue = parse(raw);
    }
    return cacheValue;
  } catch {
    return cacheValue; // storage blocked or corrupt: keep working in memory
  }
}

export const getState = (): AppState => read();

export function setState(next: AppState) {
  cacheValue = next;
  try {
    cacheRaw = JSON.stringify(next);
    window.localStorage.setItem(KEY, cacheRaw);
  } catch {
    cacheRaw = null;
  }
  window.dispatchEvent(new Event(EVENT));
}

export const commit = (fn: (s: AppState) => AppState) => setState(fn(read()));
export const resetAll = () => setState(EMPTY_STATE);

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** The saved state, always an object on the client. Render it only inside <ClientOnly>. */
export const useApp = (): AppState => useSyncExternalStore(subscribe, read, () => EMPTY_STATE);

export const addMandate = (m: Mandate) => commit((s) => ({ ...s, mandates: [m, ...s.mandates] }));
export const updateMandate = (id: string, patch: Partial<Mandate>) =>
  commit((s) => ({ ...s, mandates: s.mandates.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
export const setMandateStatus = (id: string, status: MandateStatus) => updateMandate(id, { status });
export const removeMandate = (id: string) =>
  commit((s) => ({ mandates: s.mandates.filter((m) => m.id !== id), ledger: s.ledger.filter((e) => e.mandateId !== id) }));

export function recordEntry(args: {
  mandate: Mandate;
  proposal: Proposal;
  verdict: Verdict;
  status: LedgerEntry["status"];
  mode: LedgerEntry["mode"];
  paypalOrderId?: string;
  paypalCaptureId?: string;
}): LedgerEntry {
  const entry: LedgerEntry = {
    id: newId("led"),
    mandateId: args.mandate.id,
    proposal: args.proposal,
    verdict: args.verdict,
    status: args.status,
    totalCents: args.verdict.totalCents,
    mode: args.mode,
    paypalOrderId: args.paypalOrderId,
    paypalCaptureId: args.paypalCaptureId,
    at: new Date().toISOString(),
  };
  commit((s) => ({ ...s, ledger: [entry, ...s.ledger] }));
  return entry;
}

export const patchEntry = (id: string, patch: Partial<LedgerEntry>) =>
  commit((s) => ({ ...s, ledger: s.ledger.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

/** Re-run the judge against the live ledger, for showing a verdict in the browser. */
export const judge = (mandate: Mandate, proposal: Proposal): Verdict => evaluate(mandate, proposal, read().ledger, new Date());
