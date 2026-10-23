import type { Verdict } from "@/lib/types";

export function Logo({ className = "", iconOnlyOnMobile = false }: { className?: string; iconOnlyOnMobile?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-bold tracking-tight ${className}`}>
      <svg viewBox="0 0 32 24" width="30" height="22" aria-hidden>
        <rect x="1" y="1" width="30" height="22" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M2 2l14 11L30 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <rect x="6" y="15" width="9" height="5" rx="1" fill="currentColor" opacity=".9" />
      </svg>
      <span className={`text-[1.15rem] leading-none ${iconOnlyOnMobile ? "hidden sm:inline" : ""}`}>Mandate</span>
    </span>
  );
}

const TONE = {
  allow: { tone: "clear", word: "Cleared", sub: "within the mandate" },
  approve: { tone: "hold", word: "Hold", sub: "owner approval needed" },
  deny: { tone: "refuse", word: "Refused", sub: "outside the mandate" },
} as const;

/** The verdict as a rubber stamp. `land` plays the thump once when it first appears. */
export function VerdictStamp({ decision, land = true, size = "md" }: { decision: Verdict["decision"]; land?: boolean; size?: "sm" | "md" | "lg" }) {
  const t = TONE[decision];
  const text = size === "lg" ? "text-[1.7rem]" : size === "sm" ? "text-[0.72rem]" : "text-[1.15rem]";
  return (
    <span className={`stamp ${text} ${land ? "stamp-land" : ""}`} data-tone={t.tone} data-testid="verdict-stamp" role="img" aria-label={`${t.word}: ${t.sub}`}>
      <span>{t.word}</span>
      {size !== "sm" && <span className="text-[0.7rem] font-semibold tracking-[0.12em] opacity-90">{t.sub}</span>}
    </span>
  );
}

export const VERDICT_WORD: Record<Verdict["decision"], string> = { allow: "Cleared", approve: "Hold", deny: "Refused" };
