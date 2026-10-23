"use client";

import Link from "next/link";
import { useState } from "react";
import { remainingBudget } from "@/lib/policy";
import { sampleState } from "@/lib/sample";
import { addMandate, commit, removeMandate, setMandateStatus, updateMandate, useApp } from "@/lib/store";
import type { Mandate } from "@/lib/types";
import { Envelope } from "./envelope";
import { MandateForm } from "./mandate-form";

export function MandatesView() {
  const { mandates, ledger } = useApp();
  const now = new Date();
  const [mode, setMode] = useState<"list" | "new" | { edit: string }>("list");
  const editing = typeof mode === "object" ? mandates.find((m) => m.id === mode.edit) : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="rise">
          <h1 className="text-[clamp(1.9rem,3.6vw,2.6rem)]">Envelopes</h1>
          <p className="mt-3 max-w-[52ch] text-ink-soft">Each envelope is one standing instruction for one agent. Pause it to stop spending for now. Revoke it to end the agent&apos;s authority for good.</p>
        </div>
        {mode === "list" && (
          <button type="button" className="btn btn-primary" onClick={() => setMode("new")} data-testid="new-mandate">
            New envelope
          </button>
        )}
      </div>

      {mode === "new" && (
        <div className="mt-8">
          <MandateForm
            onCancel={() => setMode("list")}
            onSave={(m) => {
              addMandate(m);
              setMode("list");
            }}
          />
        </div>
      )}
      {editing && (
        <div className="mt-8">
          <MandateForm
            initial={editing}
            onCancel={() => setMode("list")}
            onSave={(m) => {
              updateMandate(m.id, m);
              setMode("list");
            }}
          />
        </div>
      )}

      {mandates.length === 0 && mode === "list" && (
        <div className="mt-12 max-w-xl" data-testid="mandates-empty">
          <p className="text-lg text-ink-soft">The drawer is empty. Load two ready-made envelopes to see how the agent desk behaves, or write one from scratch.</p>
          <button type="button" className="btn mt-5" onClick={() => commit((s) => ({ ...s, mandates: sampleState(new Date()).mandates }))}>
            Load two sample envelopes
          </button>
        </div>
      )}

      <ul className="mt-10 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-2" data-testid="mandate-list">
        {mandates.map((m, i) => (
          <li key={m.id} className="rise" style={{ ["--d" as string]: i }}>
            <Envelope mandate={m} remainingCents={remainingBudget(m, ledger, now)} now={now} />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <p className="mr-auto min-w-0 truncate font-semibold">{m.name}</p>
              <Controls m={m} onEdit={() => setMode({ edit: m.id })} />
            </div>
            <p className="mt-1 text-sm text-ink-soft">{m.categories.join(" · ") || "no categories"}</p>
          </li>
        ))}
      </ul>
      {mandates.length > 0 && (
        <p className="mt-12">
          <Link href="/desk" className="btn">
            Go to the agent desk
          </Link>
        </p>
      )}
    </div>
  );
}

function Controls({ m, onEdit }: { m: Mandate; onEdit: () => void }) {
  const [confirm, setConfirm] = useState<"revoke" | "delete" | null>(null);
  if (confirm) {
    return (
      <span className="flex items-center gap-2" role="group" aria-label={`Confirm ${confirm}`}>
        <span className="text-sm font-semibold">{confirm === "revoke" ? "End this agent's authority?" : "Delete with its history?"}</span>
        <button
          type="button"
          className="btn btn-danger min-h-10"
          data-testid={`confirm-${confirm}`}
          onClick={() => {
            if (confirm === "revoke") setMandateStatus(m.id, "revoked");
            else removeMandate(m.id);
            setConfirm(null);
          }}
        >
          Yes, {confirm}
        </button>
        <button type="button" className="btn btn-quiet min-h-10" onClick={() => setConfirm(null)}>
          Keep
        </button>
      </span>
    );
  }
  const revoked = m.status === "revoked";
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {!revoked && (
        <button type="button" className="btn btn-quiet min-h-10" onClick={() => setMandateStatus(m.id, m.status === "paused" ? "active" : "paused")} data-testid={`pause-${m.id}`}>
          {m.status === "paused" ? "Resume" : "Pause"}
        </button>
      )}
      {!revoked && (
        <button type="button" className="btn btn-quiet min-h-10" onClick={onEdit}>
          Edit
        </button>
      )}
      {!revoked && (
        <button type="button" className="btn btn-danger min-h-10" onClick={() => setConfirm("revoke")} data-testid={`revoke-${m.id}`}>
          Revoke
        </button>
      )}
      {revoked && (
        <button type="button" className="btn btn-quiet min-h-10" onClick={() => setConfirm("delete")}>
          Delete
        </button>
      )}
    </span>
  );
}
