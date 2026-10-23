"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getState, setState } from "@/lib/store";
import { sampleState } from "@/lib/sample";

/** Opens the agent desk, loading two sample envelopes first when the drawer is empty. */
export function TryLink({ className = "btn btn-primary", children }: { className?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <Link
      href="/desk"
      className={className}
      data-testid="try-demo"
      onClick={(e) => {
        e.preventDefault();
        const s = getState();
        if (s.mandates.length === 0) setState({ ...s, mandates: sampleState(new Date()).mandates });
        router.push("/desk");
      }}
    >
      {children}
    </Link>
  );
}
