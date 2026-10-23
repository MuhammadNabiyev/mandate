import { ClientOnly } from "@/components/client-only";
import { MandatesView } from "@/components/mandates-view";

export default function MandatesPage() {
  return (
    <ClientOnly>
      <MandatesView />
    </ClientOnly>
  );
}
