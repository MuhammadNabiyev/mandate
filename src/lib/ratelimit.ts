/**
 * Best-effort per-visitor limiter for the endpoints that spend the owner's AI quota. State is per
 * server instance, which is enough to stop casual abuse of a public demo; over the limit the app
 * simply falls back to the built-in matcher, so nothing breaks.
 */
const WINDOW_MS = 10 * 60_000;
const MAX_CALLS = 40;
const hits = new Map<string, number[]>();

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "local";
}

/** True when this visitor may still use the AI model in the current window. */
export function allowAi(key: string, now: number = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_CALLS) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  return true;
}
