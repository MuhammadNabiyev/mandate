"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usd, whenLabel } from "@/lib/format";
import { spentInWindow } from "@/lib/policy";
import { commit, useApp } from "@/lib/store";
import type { EntryStatus, LedgerEntry } from "@/lib/types";
import { VerdictStamp } from "./brand";

const STATUS_WORD: Record<EntryStatus, string> = {
  paid: "Paid",
  awaiting: "Waiting for payment",
  denied: "Refused, nothing ordered",
  declined: "PayPal declined",
  cancelled: "Cancelled by owner",
};

export function LedgerView() {
  const { mandates, ledger } = useApp();
  const now = new Date();
  const [filter, setFilter] = useState<string>("all");
  const rows = useMemo(() => ledger.filter((e) => filter === "all" || e.mandateId === filter), [ledger, filter]);
  const nameOf = (id: string) => mandates.find((m) => m.id === id)?.name ?? "Deleted envelope";
  const paidTotal = rows.filter((e) => e.status === "paid").reduce((s, e) => s + e.totalCents, 0);
  const refused = rows.filter((e) => e.status === "denied").length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="rise">
          <h1 className="text-[clamp(1.9rem,3.6vw,2.6rem)]">Ledger</h1>
          <p className="mt-3 max-w-[52ch] text-ink-soft">Every request the agent made, what the mandate decided, and the PayPal order behind each payment.</p>
        </div>
        {ledger.length > 0 && (
          <button type="button" className="btn btn-quiet no-print" onClick={() => commit((s) => ({ ...s, ledger: [] }))}>
            Clear ledger
          </button>
        )}
      </div>

      {ledger.length === 0 ? (
        <div className="mt-12 max-w-xl" data-testid="ledger-empty">
          <p className="text-lg text-ink-soft">Nothing here yet. Ask the agent for something and the slip will land in this roll.</p>
          <Link href="/desk" className="btn btn-primary mt-5">
            Go to the agent desk
          </Link>
        </div>
      ) : (
        <>
          <dl className="mt-9 flex flex-wrap gap-x-12 gap-y-5">
            <div>
              <dt className="text-sm text-ink-soft">Paid</dt>
              <dd className="num text-[1.9rem] leading-tight font-semibold" data-testid="ledger-paid">{usd(paidTotal)}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-soft">Refused by a mandate</dt>
              <dd className="num text-[1.9rem] leading-tight font-semibold" data-testid="ledger-refused">{refused}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-soft">Requests</dt>
              <dd className="num text-[1.9rem] leading-tight font-semibold">{rows.length}</dd>
            </div>
          </dl>

          <div className="no-print mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by envelope">
            <button type="button" className="chip" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              All envelopes
            </button>
            {mandates.map((m) => (
              <button key={m.id} type="button" className="chip" aria-pressed={filter === m.id} onClick={() => setFilter(m.id)}>
                {m.name} · {usd(spentInWindow(m, ledger, now))} spent
              </button>
            ))}
          </div>

          <ol className="mt-8 space-y-6" data-testid="ledger-list">
            {rows.map((e, i) => (
              <Slip key={e.id} e={e} envelope={nameOf(e.mandateId)} index={i} />
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

function Slip({ e, envelope, index }: { e: LedgerEntry; envelope: string; index: number }) {
  const when = new Date(e.at);
  return (
    <li className="slip rise px-5 pt-7 pb-5 sm:px-7" style={{ ["--d" as string]: Math.min(index, 6) }} data-testid="ledger-slip" data-status={e.status}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-ink-soft">
            <time dateTime={e.at} title={when.toLocaleString("en-US")}>{whenLabel(e.at)}</time> · {envelope}
          </p>
          <p className="mt-1 text-lg font-semibold">“{e.proposal.request}”</p>
          <p className="mt-1 text-ink-soft">
            {e.proposal.items.length ? e.proposal.items.map((i) => `${i.qty > 1 ? `${i.qty}× ` : ""}${i.title}`).join(", ") : "No product found"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <span className="num text-xl font-semibold">{usd(e.totalCents)}</span>
          <VerdictStamp decision={e.verdict.decision} size="sm" land={false} />
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold">{STATUS_WORD[e.status]}</p>
      {e.verdict.reasons.length > 0 && (
        <ul className="mt-2 space-y-1 font-mono text-[0.78rem] leading-snug text-ink-soft">
          {e.verdict.reasons.map((r, i) => (
            <li key={`${r.code}-${i}`}>
              <span className="font-bold text-ink">{r.code.toLowerCase().replaceAll("_", "-")}</span> {r.message}
            </li>
          ))}
        </ul>
      )}
      {e.paypalOrderId && (
        <p className="num mt-3 text-xs text-ink-soft">
          {e.mode === "sandbox" ? "PayPal sandbox" : "simulated"} order {e.paypalOrderId}
          {e.paypalCaptureId ? ` · capture ${e.paypalCaptureId}` : ""}
        </p>
      )}
    </li>
  );
}
