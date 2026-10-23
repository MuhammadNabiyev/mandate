import { ClientOnly } from "@/components/client-only";
import { DeskView } from "@/components/desk-view";

export default function DeskPage() {
  return (
    <ClientOnly>
      <DeskView />
    </ClientOnly>
  );
}
