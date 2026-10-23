"use client";

import Link from "next/link";
import { useState } from "react";
import { useConfig } from "@/lib/config-client";
import { PERIOD_LABEL, usd } from "@/lib/format";
import { useSandboxKeys } from "@/lib/paypal-keys";
import { remainingBudget } from "@/lib/policy";
import { sampleState } from "@/lib/sample";
import { commit, patchEntry, recordEntry, useApp } from "@/lib/store";
import type { Mandate, Proposal, Verdict } from "@/lib/types";
import { VerdictStamp } from "./brand";
import { Envelope } from "./envelope";
import { PayButton, type PaidInfo } from "./pay-button";
import { SandboxKeysPanel } from "./sandbox-keys-panel";

const EXAMPLES = ["a desk lamp under $40", "two packs of printer paper", "a bottle of single malt whisky", "a laptop"];

interface Outcome {
  proposal: Proposal;
  verdict: Verdict;
  entryId: string;
  note?: string;
}

export function DeskView() {
  const { mandates, ledger } = useApp();
  const cfg = useConfig();
  const mine = useSandboxKeys();
  const clientId = mine?.clientId ?? cfg?.paypalClientId ?? null;
  const now = new Date();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [request, setRequest] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [approved, setApproved] = useState(false);
  const [paid, setPaid] = useState<PaidInfo | null>(null);

  const mandate: Mandate | undefined = mandates.find((m) => m.id === pickedId) ?? mandates.find((m) => m.status === "active") ?? mandates[0];
  const remaining = mandate ? remainingBudget(mandate, ledger, now) : 0;

  if (mandates.length === 0) {
    return (
      <section className="mx-auto max-w-xl py-10 text-center" data-testid="desk-empty">
        <h1 className="text-[2.2rem]">No envelopes yet.</h1>
        <p className="mx-auto mt-4 max-w-[44ch] text-lg text-ink-soft">
          A mandate is the envelope an agent works from: what it may buy, how much, and for how long. Start with two ready-made ones, or write your own.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn btn-primary" data-testid="load-sample" onClick={() => commit((s) => ({ ...s, mandates: sampleState(new Date()).mandates }))}>
            Load two sample envelopes
          </button>
          <Link href="/mandates" className="btn">
            Write my own
          </Link>
        </div>
      </section>
    );
  }
  if (!mandate) return null;

  const resetTask = () => {
    setOutcome(null);
    setPaid(null);
    setApproved(false);
    setError(null);
  };

  async function send(text: string) {
    if (!mandate || !text.trim() || busy) return;
    setBusy(true);
    resetTask();
    try {
      const res = await fetch("/api/propose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mandate, ledger, request: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "The agent could not answer.");
      const proposal = data.proposal as Proposal;
      const verdict = data.verdict as Verdict;
      const entry = recordEntry({ mandate, proposal, verdict, status: verdict.decision === "deny" ? "denied" : "awaiting", mode: clientId ? "sandbox" : "simulated" });
      setOutcome({ proposal, verdict, entryId: entry.id, note: data.note });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const onPaid = (info: PaidInfo) => {
    if (!outcome) return;
    patchEntry(outcome.entryId, { status: "paid", mode: info.mode, paypalOrderId: info.orderId, paypalCaptureId: info.captureId });
    setPaid(info);
  };

  const cancel = () => {
    if (outcome) patchEntry(outcome.entryId, { status: "cancelled" });
    resetTask();
  };

  const needsOk = outcome?.verdict.decision === "approve" && !approved;
  const canPay = outcome && !paid && (outcome.verdict.decision === "allow" || (outcome.verdict.decision === "approve" && approved));

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
      <section aria-labelledby="env-h" className="rise">
        <h1 id="env-h" className="text-[clamp(1.9rem,3.6vw,2.6rem)]">
          Agent desk
        </h1>
        <p className="mt-3 max-w-[46ch] text-ink-soft">Pick the envelope the agent works from, then ask it to buy something. The agent only proposes. The mandate decides.</p>

        <div className="mt-7" role="radiogroup" aria-label="Envelope" data-testid="envelope-picker">
          <div className="flex flex-wrap gap-2">
            {mandates.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={m.id === mandate.id}
                className="chip"
                data-testid={`pick-${m.id}`}
                onClick={() => {
                  setPickedId(m.id);
                  resetTask();
                }}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 max-w-md">
          <Envelope mandate={mandate} remainingCents={remaining} now={now} stamp={outcome ? <VerdictStamp key={outcome.proposal.id} decision={outcome.verdict.decision} size="sm" /> : undefined} />
        </div>
        <p className="mt-4 max-w-md text-sm text-ink-soft">
          May buy: {mandate.categories.length ? mandate.categories.join(", ") : "nothing yet"}.
          {mandate.blockedMerchants.length > 0 && ` Blocked: ${mandate.blockedMerchants.join(", ")}.`} Budget resets on a rolling {mandate.period}.
        </p>
      </section>

      <section aria-labelledby="ask-h" className="rise" style={{ ["--d" as string]: 1 }}>
        <h2 id="ask-h" className="text-[1.35rem]">
          Ask the agent
        </h2>
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            void send(request);
          }}
        >
          <label className="label" htmlFor="request">
            What should it buy?
          </label>
          <div className="flex items-end gap-3">
            <input id="request" className="field flex-1 text-lg" value={request} onChange={(e) => setRequest(e.target.value)} placeholder="a desk lamp under $40" maxLength={300} autoComplete="off" data-testid="request-input" />
            <button className="btn btn-primary" disabled={busy || !request.trim()} data-testid="send-request" type="submit">
              {busy ? "Asking…" : "Send"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Examples">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" className="chip" onClick={() => { setRequest(ex); void send(ex); }} disabled={busy}>
                {ex}
              </button>
            ))}
          </div>
        </form>

        <div aria-live="polite" className="mt-8">
          {error && (
            <p className="text-refuse" role="alert" data-testid="desk-error">
              {error}
            </p>
          )}

          {outcome && (
            <article key={outcome.proposal.id} className="slip px-5 pt-7 pb-6 sm:px-7" data-testid="verdict-card" data-decision={outcome.verdict.decision}>
              <div className="flex flex-col-reverse items-start justify-between gap-4 sm:flex-row">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-soft">
                    “{outcome.proposal.request}” · {outcome.proposal.source === "ai" ? "chosen by the AI agent" : "chosen by the built-in matcher"}
                  </p>
                  {outcome.proposal.items.length === 0 ? (
                    <p className="mt-2 text-lg font-semibold">The agent found nothing to buy.</p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {outcome.proposal.items.map((i) => (
                        <li key={i.sku} className="flex items-baseline justify-between gap-6">
                          <span className="font-semibold">
                            {i.qty > 1 && <span className="num mr-1.5 font-medium text-ink-soft">{i.qty}×</span>}
                            {i.title}
                            <span className="ml-2 text-sm font-normal text-ink-soft">{i.merchant} · {i.category}</span>
                          </span>
                          <span className="num">{usd(i.unitCents * i.qty)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 text-sm text-ink-soft">{outcome.proposal.rationale}</p>
                  {outcome.note && <p className="mt-1 text-sm text-hold">{outcome.note}</p>}
                </div>
                <div className="shrink-0 pt-1">
                  <VerdictStamp decision={outcome.verdict.decision} size="md" />
                </div>
              </div>

              <div className="mt-5 flex items-baseline justify-between border-t border-ink/20 pt-4">
                <span className="text-sm font-semibold text-ink-soft">Total</span>
                <span className="num text-2xl font-semibold" data-testid="verdict-total">{usd(outcome.verdict.totalCents)}</span>
              </div>
              <p className="mt-1 text-right text-sm text-ink-soft">
                {usd(outcome.verdict.remainingCents)} was left {PERIOD_LABEL[mandate.period]}
              </p>

              {outcome.verdict.reasons.length > 0 && (
                <ul className="mt-4 space-y-1.5 font-mono text-[0.82rem] leading-snug" aria-label="Rules that fired" data-testid="verdict-reasons">
                  {outcome.verdict.reasons.map((r, i) => (
                    <li key={`${r.code}-${r.sku ?? i}`} className="franked flex gap-2" style={{ ["--i" as string]: i }}>
                      <span className="shrink-0 font-bold">{r.code.toLowerCase().replaceAll("_", "-")}</span>
                      <span className="text-ink-soft">{r.message}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6">
                {outcome.verdict.decision === "deny" && (
                  <div>
                    <p className="font-semibold">Nothing was ordered. The refusal is in the ledger.</p>
                    <button type="button" className="btn mt-3" onClick={resetTask}>
                      Try another request
                    </button>
                  </div>
                )}
                {needsOk && (
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className="btn btn-primary" data-testid="approve" onClick={() => setApproved(true)}>
                      Approve {usd(outcome.verdict.totalCents)}
                    </button>
                    <button type="button" className="btn btn-quiet" onClick={cancel}>
                      Decline
                    </button>
                  </div>
                )}
                {canPay && (
                  <div>
                    <PayButton mandate={mandate} proposal={outcome.proposal} approved={approved} paypalClientId={clientId} onPaid={onPaid} onProblem={setError} />
                    <button type="button" className="btn btn-quiet mt-3" onClick={cancel}>
                      Cancel
                    </button>
                  </div>
                )}
                {paid && (
                  <div data-testid="paid-receipt">
                    <p className="font-semibold">
                      Paid {usd(outcome.verdict.totalCents)} · {paid.mode === "sandbox" ? "PayPal sandbox" : "simulated PayPal"}
                    </p>
                    <p className="num mt-1 text-sm text-ink-soft">order {paid.orderId}{paid.captureId ? ` · capture ${paid.captureId}` : ""}</p>
                    <div className="mt-3 flex gap-3">
                      <button type="button" className="btn" onClick={resetTask}>
                        Another request
                      </button>
                      <Link href="/ledger" className="btn btn-quiet">
                        Open ledger
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </article>
          )}

          {!outcome && !error && !busy && <p className="text-ink-soft">Try the whisky: it is a perfectly good request that this mandate will refuse.</p>}
          <SandboxKeysPanel serverHasKeys={Boolean(cfg?.paypalClientId)} />
        </div>
      </section>
    </div>
  );
}
