import type { LineItem } from "./types";

/**
 * PayPal Orders v2 against the SANDBOX only. With no credentials configured everything runs in a
 * clearly labelled simulator so the product can still be tried end to end.
 */
const BASE = "https://api-m.sandbox.paypal.com";

export const paypalConfigured = (): boolean => Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
export const paypalClientId = (): string | null => (paypalConfigured() ? process.env.PAYPAL_CLIENT_ID! : null);

export interface Creds {
  clientId: string;
  secret: string;
}

const KEY_SHAPE = /^[A-Za-z0-9_-]{20,200}$/;

/**
 * Whose sandbox to use. A visitor (a judge, say) can bring their own sandbox keys in two request
 * headers; otherwise the server's environment keys apply; otherwise null means the simulator.
 * Keys are only ever sent to PayPal's sandbox host, never stored and never logged.
 */
export function credsFromRequest(req: Request): Creds | null {
  const clientId = req.headers.get("x-paypal-client-id")?.trim() ?? "";
  const secret = req.headers.get("x-paypal-client-secret")?.trim() ?? "";
  if (KEY_SHAPE.test(clientId) && KEY_SHAPE.test(secret)) return { clientId, secret };
  return paypalConfigured() ? { clientId: process.env.PAYPAL_CLIENT_ID!, secret: process.env.PAYPAL_CLIENT_SECRET! } : null;
}

async function accessToken(creds: Creds): Promise<string> {
  const basic = Buffer.from(`${creds.clientId}:${creds.secret}`).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { authorization: `Basic ${basic}`, "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new PayPalError("PayPal sign-in failed. Check the sandbox client id and secret.", res.status);
  return (await res.json()).access_token as string;
}

export class PayPalError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
  }
}

const money = (cents: number): string => (cents / 100).toFixed(2);

export interface CreatedOrder {
  orderId: string;
  mode: "sandbox" | "simulated";
}

export async function createOrder(args: { mandateId: string; mandateName: string; items: LineItem[]; totalCents: number; requestId: string }, creds: Creds | null = null): Promise<CreatedOrder> {
  if (!creds) return { orderId: `SIM-${args.requestId.slice(-10).toUpperCase()}`, mode: "simulated" };
  const token = await accessToken(creds);
  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "paypal-request-id": args.requestId,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: args.mandateId,
          custom_id: args.mandateId,
          description: `Mandate: ${args.mandateName}`.slice(0, 127),
          amount: {
            currency_code: "USD",
            value: money(args.totalCents),
            breakdown: { item_total: { currency_code: "USD", value: money(args.totalCents) } },
          },
          items: args.items.map((i) => ({
            name: i.title.slice(0, 127),
            sku: i.sku,
            quantity: String(i.qty),
            category: "PHYSICAL_GOODS",
            unit_amount: { currency_code: "USD", value: money(i.unitCents) },
          })),
        },
      ],
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new PayPalError(`PayPal could not create the order (${res.status}).`, res.status);
  return { orderId: (await res.json()).id as string, mode: "sandbox" };
}

export interface Captured {
  status: "paid" | "declined";
  captureId?: string;
  mode: "sandbox" | "simulated";
}

export async function captureOrder(orderId: string, creds: Creds | null = null): Promise<Captured> {
  if (orderId.startsWith("SIM-")) return { status: "paid", captureId: `SIMCAP-${orderId.slice(4)}`, mode: "simulated" };
  if (!creds) throw new PayPalError("PayPal is not configured.", 400);
  const token = await accessToken(creds);
  const res = await fetch(`${BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 422) return { status: "declined", mode: "sandbox" };
  if (!res.ok) throw new PayPalError(`PayPal could not capture the order (${res.status}).`, res.status);
  const data = await res.json();
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  return data.status === "COMPLETED" ? { status: "paid", captureId: capture?.id, mode: "sandbox" } : { status: "declined", mode: "sandbox" };
}
