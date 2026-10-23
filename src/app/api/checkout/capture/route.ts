import { captureOrder, credsFromRequest, PayPalError } from "@/lib/paypal";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  if (!/^[A-Za-z0-9-]{6,40}$/.test(orderId)) return Response.json({ error: "Invalid order id." }, { status: 400 });
  try {
    return Response.json(await captureOrder(orderId, credsFromRequest(req)));
  } catch (e) {
    const status = e instanceof PayPalError ? e.status : 502;
    return Response.json({ error: e instanceof Error ? e.message : "Could not capture the order." }, { status: status >= 400 && status < 600 ? status : 502 });
  }
}
