import { buildProposal, pickOffline } from "@/lib/agent";
import { aiConfigured, pickWithModel } from "@/lib/ai";
import { evaluate } from "@/lib/policy";
import { allowAi, clientKey } from "@/lib/ratelimit";
import { parseLedger, parseMandate } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const mandate = parseMandate(body?.mandate);
  const request = typeof body?.request === "string" ? body.request.trim().slice(0, 300) : "";
  if (!mandate || !request) return Response.json({ error: "A mandate and a request are required." }, { status: 400 });

  let source: "ai" | "offline" = "offline";
  let chosen = pickOffline(request);
  let note: string | undefined;
  if (aiConfigured() && !allowAi(clientKey(req))) {
    note = "Busy: the AI model is rate limited for you right now, so the built-in matcher chose instead.";
  } else if (aiConfigured()) {
    try {
      chosen = await pickWithModel(request);
      source = "ai";
    } catch {
      note = "The AI model did not answer, so the built-in matcher chose instead.";
    }
  }

  const proposal = buildProposal({ mandate, request, picks: chosen.picks, rationale: chosen.rationale, source });
  const verdict = evaluate(mandate, proposal, parseLedger(body?.ledger), new Date());
  return Response.json({ proposal, verdict, note });
}
