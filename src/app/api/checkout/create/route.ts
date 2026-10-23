import { newId } from "@/lib/agent";
import { evaluate, proposalTotal } from "@/lib/policy";
import { createOrder, PayPalError } from "@/lib/paypal";
import { parseLedger, parseMandate, parseProposal } from "@/lib/validate";

export const dynamic = "force-dynamic";

/**
 * The only place an order is ever created. The judge runs here again, on the server, with prices
 * rebuilt from the catalog, so a tampered browser cannot talk its way past a limit.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const mandate = parseMandate(body?.mandate);
  const proposal = mandate ? parseProposal(body?.proposal, mandate) : null;
  if (!mandate || !proposal) return Response.json({ error: "Invalid checkout request." }, { status: 400 });

  const verdict = evaluate(mandate, proposal, parseLedger(body?.ledger), new Date());
  if (verdict.decision === "deny") return Response.json({ error: "Denied by the mandate.", verdict }, { status: 422 });
  if (verdict.decision === "approve" && body?.approved !== true) {
    return Response.json({ error: "This purchase needs the owner's approval first.", verdict }, { status: 403 });
  }

  try {
    const order = await createOrder({
      mandateId: mandate.id,
      mandateName: mandate.name,
      items: proposal.items,
      totalCents: proposalTotal(proposal),
      requestId: newId("req"),
    });
    return Response.json({ ...order, verdict, totalCents: proposalTotal(proposal) });
  } catch (e) {
    const status = e instanceof PayPalError ? e.status : 502;
    return Response.json({ error: e instanceof Error ? e.message : "Could not create the order." }, { status: status >= 400 && status < 600 ? status : 502 });
  }
}
