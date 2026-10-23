import { aiConfigured, draftMandateOffline, draftMandateWithModel } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const description = typeof body?.description === "string" ? body.description.trim().slice(0, 500) : "";
  if (!description) return Response.json({ error: "Describe what the agent may buy." }, { status: 400 });

  if (aiConfigured()) {
    try {
      return Response.json({ draft: await draftMandateWithModel(description), source: "ai" });
    } catch {
      /* fall through to the offline drafter */
    }
  }
  return Response.json({ draft: draftMandateOffline(description), source: "offline" });
}
