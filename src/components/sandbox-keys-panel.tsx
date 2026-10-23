"use client";

import { useState } from "react";
import { clearKeys, saveKeys, useSandboxKeys } from "@/lib/paypal-keys";

/** Lets anyone plug in their own PayPal sandbox app, so the real sandbox flow can be tried on this deployment. */
export function SandboxKeysPanel({ serverHasKeys }: { serverHasKeys: boolean }) {
  const mine = useSandboxKeys();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);

  const status = mine ? "Using your PayPal sandbox app" : serverHasKeys ? "Using this app's PayPal sandbox" : "Using the built-in simulator";

  return (
    <section className="no-print mt-10 max-w-md border-t border-ink/15 pt-5" aria-labelledby="sbx-h" data-testid="sandbox-panel">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <h3 id="sbx-h" className="text-[0.95rem] font-bold tracking-normal">
            PayPal connection
          </h3>
          <p className="text-sm text-ink-soft" data-testid="sandbox-status">
            {status}
          </p>
        </div>
        <button type="button" className="btn btn-quiet min-h-10" aria-expanded={open} onClick={() => setOpen((o) => !o)} data-testid="sandbox-toggle">
          {open ? "Close" : mine ? "Change keys" : "Use my own sandbox keys"}
        </button>
      </div>

      {open && (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (saveKeys({ clientId, secret })) {
              setError(null);
              setSecret("");
              setOpen(false);
            } else setError("Those do not look like PayPal sandbox keys. Paste the Client ID and Secret exactly as shown in the PayPal dashboard.");
          }}
        >
          <p className="text-sm text-ink-soft">
            Create a free sandbox app at developer.paypal.com (Apps &amp; Credentials, Sandbox) and paste its keys. They stay in this browser tab only, are sent to PayPal&apos;s sandbox and nowhere else, and vanish when you close the tab.
          </p>
          <div className="mt-4">
            <label className="label" htmlFor="sbx-id">
              Sandbox Client ID
            </label>
            <input id="sbx-id" className="field num text-sm" value={clientId} onChange={(e) => setClientId(e.target.value)} autoComplete="off" spellCheck={false} data-testid="sandbox-client-id" />
          </div>
          <div className="mt-4">
            <label className="label" htmlFor="sbx-secret">
              Sandbox Secret
            </label>
            <input id="sbx-secret" type="password" className="field num text-sm" value={secret} onChange={(e) => setSecret(e.target.value)} autoComplete="off" spellCheck={false} data-testid="sandbox-secret" />
          </div>
          {error && (
            <p className="mt-3 text-sm text-refuse" role="alert">
              {error}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" className="btn btn-primary min-h-10" disabled={!clientId.trim() || !secret.trim()} data-testid="sandbox-save">
              Connect
            </button>
            {mine && (
              <button
                type="button"
                className="btn btn-quiet min-h-10"
                onClick={() => {
                  clearKeys();
                  setOpen(false);
                }}
              >
                Disconnect
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
