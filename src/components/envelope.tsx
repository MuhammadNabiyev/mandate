import { PERIOD_LABEL, daysLeft, usd, usdShort } from "@/lib/format";
import type { Mandate } from "@/lib/types";

/**
 * A mandate drawn as a security envelope: lattice flap, glassine window showing what is left to
 * spend. A revoked mandate is sealed and stamped across the front.
 */
export function Envelope({ mandate, remainingCents, now, stamp }: { mandate: Mandate; remainingCents: number; now: Date; stamp?: React.ReactNode }) {
  const revoked = mandate.status === "revoked";
  const paused = mandate.status === "paused";
  const expired = new Date(mandate.expiresAt).getTime() < now.getTime();
  const used = mandate.periodCents > 0 ? 1 - remainingCents / mandate.periodCents : 1;
  const dead = revoked || expired;

  return (
    <div className="envelope" data-testid="envelope" data-status={mandate.status}>
      <div className="flap tint" aria-hidden />
      <div className="absolute left-[7%] right-[7%] top-[9%] z-[2] flex items-start justify-between gap-3 text-[0.78rem]">
        <span className="rounded-sm bg-paper/85 px-1.5 py-0.5 font-semibold text-ink">{mandate.agent}</span>
        <span className="rounded-sm bg-paper/85 px-1.5 py-0.5 font-medium text-ink-soft">
          {dead ? (revoked ? "revoked" : "expired") : paused ? "paused" : `${daysLeft(mandate, now)} d left`}
        </span>
      </div>

      <div className="window" style={{ opacity: dead ? 0.55 : 1 }}>
        <p className="text-[0.72rem] font-semibold tracking-[0.06em] text-ink-soft uppercase">Left {PERIOD_LABEL[mandate.period]}</p>
        <p className="num text-[clamp(1.5rem,3.2vw,2.15rem)] leading-none font-semibold" data-testid="envelope-remaining">
          {usd(remainingCents)}
        </p>
        <div className="meter mt-2" aria-hidden>
          <span style={{ width: `${Math.min(100, Math.max(0, used * 100)).toFixed(1)}%` }} />
        </div>
        <p className="mt-1.5 text-[0.78rem] leading-tight text-ink-soft">
          up to <span className="num font-semibold text-ink">{usdShort(mandate.perPurchaseCents)}</span> a purchase · asks above <span className="num font-semibold text-ink">{usdShort(mandate.approvalAboveCents)}</span>
        </p>
      </div>

      {stamp && !dead && <div className="absolute right-[5%] bottom-[14%] z-[3] origin-bottom-right scale-[0.68] sm:scale-100">{stamp}</div>}

      {dead && (
        <span className="stamp stamp-land absolute top-[40%] left-1/2 z-[3] -translate-x-1/2 text-[1.5rem]" data-tone="refuse" style={{ ["--tilt" as string]: "-9deg" }}>
          <span>{revoked ? "Revoked" : "Expired"}</span>
        </span>
      )}
    </div>
  );
}
