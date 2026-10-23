import { ClientOnly } from "@/components/client-only";
import { LedgerView } from "@/components/ledger-view";

export default function LedgerPage() {
  return (
    <ClientOnly>
      <LedgerView />
    </ClientOnly>
  );
}
