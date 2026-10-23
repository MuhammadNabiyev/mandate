import { aiConfigured } from "@/lib/ai";
import { paypalClientId } from "@/lib/paypal";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ai: aiConfigured(), paypalClientId: paypalClientId() });
}
