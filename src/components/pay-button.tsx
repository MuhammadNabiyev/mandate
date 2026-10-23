"use client";

import { useEffect, useRef, useState } from "react";
import { keyHeaders } from "@/lib/paypal-keys";
import { getState } from "@/lib/store";
import type { Mandate, Proposal } from "@/lib/types";

declare global {
  interface Window {
    paypal?: {
      Buttons: (o: {
        style?: Record<string, string | number>;
        createOrder: () => Promise<string>;
        onApprove: (d: { orderID: string }) => Promise<void>;
        onCancel?: () => void;
        onError?: (e: unknown) => void;
      }) => { render: (el: HTMLElement) => Promise<void>; close?: () => void };
    };
  }
}

export interface PaidInfo {
  orderId: string;
  captureId?: string;
  mode: "sandbox" | "simulated";
}

interface Props {
  mandate: Mandate;
  proposal: Proposal;
  approved: boolean;
  paypalClientId: string | null;
  onPaid: (info: PaidInfo) => void;
  onProblem: (message: string) => void;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...keyHeaders() }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Something went wrong.");
  return data as T;
}

const createOrder = (p: Props) =>
  post<{ orderId: string; mode: "sandbox" | "simulated" }>("/api/checkout/create", {
    mandate: p.mandate,
    ledger: getState().ledger,
    proposal: p.proposal,
    approved: p.approved,
  });

const SDK_ID = "paypal-sdk";

function loadSdk(clientId: string): Promise<void> {
  const existing = document.getElementById(SDK_ID) as HTMLScriptElement | null;
  if (existing && existing.dataset.clientId !== clientId) {
    existing.remove();
    delete window.paypal;
  } else if (window.paypal) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const pending = document.getElementById(SDK_ID);
    if (pending) {
      pending.addEventListener("load", () => resolve());
      pending.addEventListener("error", () => reject(new Error("The PayPal button could not load.")));
      return;
    }
    const s = document.createElement("script");
    s.id = SDK_ID;
    s.dataset.clientId = clientId;
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&disable-funding=card,credit,paylater`;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("The PayPal button could not load. Check that the Client ID belongs to a sandbox app."));
    document.head.appendChild(s);
  });
}

/**
 * Real PayPal sandbox buttons when a client id is configured; otherwise one clearly labelled button
 * that runs the same create + capture calls against the local simulator.
 */
export function PayButton(props: Props) {
  const { paypalClientId } = props;
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  const [busy, setBusy] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  useEffect(() => {
    latest.current = props;
  });

  useEffect(() => {
    if (!paypalClientId || !ref.current) return;
    let cancelled = false;
    const el = ref.current;
    loadSdk(paypalClientId)
      .then(() => {
        if (cancelled || !window.paypal) return;
        el.innerHTML = "";
        return window.paypal
          .Buttons({
            style: { layout: "vertical", color: "gold", shape: "rect", label: "pay", height: 44 },
            createOrder: async () => (await createOrder(latest.current)).orderId,
            onApprove: async ({ orderID }) => {
              try {
                const cap = await post<{ status: "paid" | "declined"; captureId?: string; mode: "sandbox" }>("/api/checkout/capture", { orderId: orderID });
                if (cap.status === "paid") latest.current.onPaid({ orderId: orderID, captureId: cap.captureId, mode: "sandbox" });
                else latest.current.onProblem("PayPal declined the payment.");
              } catch (e) {
                latest.current.onProblem(e instanceof Error ? e.message : "Payment failed.");
              }
            },
            onCancel: () => latest.current.onProblem("Payment cancelled. Nothing was charged."),
            onError: () => latest.current.onProblem("PayPal reported an error. Nothing was charged."),
          })
          .render(el);
      })
      .catch((e: unknown) => !cancelled && setSdkError(e instanceof Error ? e.message : "PayPal failed to load."));
    return () => {
      cancelled = true;
      el.innerHTML = "";
    };
  }, [paypalClientId, props.proposal.id]);

  if (paypalClientId) {
    return (
      <div>
        <div ref={ref} data-testid="paypal-buttons" className="min-h-[2.75rem] max-w-sm" />
        {sdkError && <p className="mt-2 text-sm text-refuse">{sdkError}</p>}
      </div>
    );
  }

  const simulate = async () => {
    setBusy(true);
    try {
      const order = await createOrder(props);
      const cap = await post<{ status: "paid" | "declined"; captureId?: string }>("/api/checkout/capture", { orderId: order.orderId });
      if (cap.status === "paid") props.onPaid({ orderId: order.orderId, captureId: cap.captureId, mode: "simulated" });
      else props.onProblem("The simulated payment was declined.");
    } catch (e) {
      props.onProblem(e instanceof Error ? e.message : "Payment failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button type="button" className="btn btn-primary w-full max-w-sm" onClick={simulate} disabled={busy} data-testid="pay-simulated">
        {busy ? "Paying…" : "Pay with PayPal (simulated)"}
      </button>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">No PayPal sandbox keys are configured on this server, so this runs the full order flow against a local simulator. No money moves either way.</p>
    </div>
  );
}
