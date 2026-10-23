"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { newId } from "@/lib/agent";
import { draftToMandate, type MandateDraft } from "@/lib/ai";
import { CATEGORIES, type Category, type Mandate, type Period } from "@/lib/types";

const PERIODS: Period[] = ["day", "week", "month"];
const RISKY: Category[] = ["alcohol", "gambling"];

const toDollars = (cents: number) => (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
const toCents = (s: string) => Math.round(parseFloat(s.replace(/[^0-9.]/g, "")) * 100);

interface Props {
  initial?: Mandate;
  onSave: (m: Mandate) => void;
  onCancel: () => void;
}

/** One form for new and existing envelopes. A plain-English description fills it in; every field stays editable. */
export function MandateForm({ initial, onSave, onCancel }: Props) {
  const [description, setDescription] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draftNote, setDraftNote] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [agent, setAgent] = useState(initial?.agent ?? "Claude");
  const [perPurchase, setPerPurchase] = useState(initial ? toDollars(initial.perPurchaseCents) : "50");
  const [budget, setBudget] = useState(initial ? toDollars(initial.periodCents) : "150");
  const [period, setPeriod] = useState<Period>(initial?.period ?? "week");
  const [askAbove, setAskAbove] = useState(initial ? toDollars(initial.approvalAboveCents) : "25");
  const [cats, setCats] = useState<Category[]>(initial?.categories ?? ["groceries", "household"]);
  const [blocked, setBlocked] = useState(initial?.blockedMerchants.join(", ") ?? "");
  const [days, setDays] = useState(initial ? String(Math.max(1, Math.round((new Date(initial.expiresAt).getTime() - new Date(initial.createdAt).getTime()) / 86_400_000))) : "30");
  const [error, setError] = useState<string | null>(null);

  async function draft() {
    if (!description.trim()) return;
    setDrafting(true);
    setDraftNote(null);
    try {
      const res = await fetch("/api/draft", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ description }) });
      const data = (await res.json()) as { draft?: MandateDraft; source?: string; error?: string };
      if (!res.ok || !data.draft) throw new Error(data.error ?? "Could not draft that.");
      const d = data.draft;
      setName(d.name);
      setPerPurchase(toDollars(d.perPurchaseCents));
      setBudget(toDollars(d.periodCents));
      setPeriod(d.period);
      setAskAbove(toDollars(d.approvalAboveCents));
      setCats(d.categories);
      setBlocked(d.blockedMerchants.join(", "));
      setDays(String(d.days));
      setDraftNote(data.source === "ai" ? "Drafted by the AI model. Check every field before you save." : "Drafted by the built-in reader (no AI key on this server). Check every field before you save.");
    } catch (e) {
      setDraftNote(e instanceof Error ? e.message : "Could not draft that.");
    } finally {
      setDrafting(false);
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const per = toCents(perPurchase);
    const bud = toCents(budget);
    const ask = toCents(askAbove);
    const d = parseInt(days, 10);
    if (!name.trim()) return setError("Give the envelope a name.");
    if (![per, bud, ask].every((n) => Number.isFinite(n) && n > 0)) return setError("Limits must be amounts above zero.");
    if (per > bud) return setError("The per-purchase limit cannot be higher than the budget.");
    if (ask > per) return setError("“Ask me above” cannot be higher than the per-purchase limit.");
    if (!Number.isFinite(d) || d < 1 || d > 365) return setError("Validity must be between 1 and 365 days.");
    if (cats.length === 0) return setError("Allow at least one category.");
    setError(null);
    const now = new Date();
    const base = initial ?? draftToMandate({ name, perPurchaseCents: per, periodCents: bud, period, approvalAboveCents: ask, categories: cats, blockedMerchants: [], days: d }, agent, newId("mnd"), now);
    onSave({
      ...base,
      name: name.trim().slice(0, 60),
      agent: agent.trim().slice(0, 40) || "Agent",
      perPurchaseCents: per,
      periodCents: bud,
      period,
      approvalAboveCents: ask,
      categories: cats,
      blockedMerchants: blocked.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20),
      expiresAt: new Date(now.getTime() + d * 86_400_000).toISOString(),
    });
  }

  return (
    <form onSubmit={save} className="slip px-5 pt-8 pb-6 sm:px-8" data-testid="mandate-form">
      <h2 className="text-[1.4rem]">{initial ? "Edit envelope" : "New envelope"}</h2>

      {!initial && (
        <div className="mt-5">
          <label className="label" htmlFor="describe">
            Describe it in plain English
          </label>
          <div className="flex items-end gap-3">
            <input id="describe" className="field flex-1" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Groceries and cleaning for my parents, $60 a time, $150 a week, no alcohol" maxLength={500} data-testid="describe-input" />
            <button type="button" className="btn" onClick={draft} disabled={drafting || !description.trim()} data-testid="draft-button">
              {drafting ? "Reading…" : "Fill the form"}
            </button>
          </div>
          {draftNote && <p className="mt-2 text-sm text-ink-soft" data-testid="draft-note">{draftNote}</p>}
        </div>
      )}

      <div className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="m-name">Envelope name</label>
          <input id="m-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} data-testid="m-name" />
        </div>
        <div>
          <label className="label" htmlFor="m-agent">Agent</label>
          <input id="m-agent" className="field" value={agent} onChange={(e) => setAgent(e.target.value)} maxLength={40} />
        </div>
        <div>
          <label className="label" htmlFor="m-per">One purchase, at most ($)</label>
          <input id="m-per" className="field num" inputMode="decimal" value={perPurchase} onChange={(e) => setPerPurchase(e.target.value)} data-testid="m-per" />
        </div>
        <div>
          <label className="label" htmlFor="m-ask">Ask me first above ($)</label>
          <input id="m-ask" className="field num" inputMode="decimal" value={askAbove} onChange={(e) => setAskAbove(e.target.value)} data-testid="m-ask" />
        </div>
        <div>
          <label className="label" htmlFor="m-budget">Budget ($)</label>
          <input id="m-budget" className="field num" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} data-testid="m-budget" />
        </div>
        <div>
          <span className="label" id="m-period-l">Per</span>
          <Select.Root value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <Select.Trigger className="field flex items-center justify-between text-left" aria-labelledby="m-period-l" data-testid="m-period">
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="size-4" aria-hidden />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content position="popper" sideOffset={6} className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-ink/30 bg-paper p-1 shadow-[var(--shadow)]">
                <Select.Viewport>
                  {PERIODS.map((p) => (
                    <Select.Item key={p} value={p} className="flex cursor-pointer items-center justify-between gap-6 rounded px-3 py-2 text-sm outline-none data-[highlighted]:bg-ink data-[highlighted]:text-paper">
                      <Select.ItemText>{p}</Select.ItemText>
                      <Select.ItemIndicator>
                        <Check className="size-4" aria-hidden />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
        <div>
          <label className="label" htmlFor="m-days">Valid for (days)</label>
          <input id="m-days" className="field num" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="m-blocked">Never buy from (comma separated)</label>
          <input id="m-blocked" className="field" value={blocked} onChange={(e) => setBlocked(e.target.value)} placeholder="Cellar & Co" />
        </div>
      </div>

      <fieldset className="mt-7">
        <legend className="label">The agent may buy</legend>
        <div className="mt-2 flex flex-wrap gap-2" data-testid="m-categories">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={cats.includes(c)} onClick={() => setCats((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]))}>
              {c}
              {RISKY.includes(c) && <span className="sr-only"> (sensitive)</span>}
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <p className="mt-5 text-refuse" role="alert" data-testid="form-error">
          {error}
        </p>
      )}
      <div className="mt-7 flex flex-wrap gap-3">
        <button type="submit" className="btn btn-primary" data-testid="save-mandate">
          {initial ? "Save changes" : "Seal envelope"}
        </button>
        <button type="button" className="btn btn-quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
