"use client";

import { useSyncExternalStore } from "react";

export interface ClientConfig {
  ai: boolean;
  paypalClientId: string | null;
}

let value: ClientConfig | null = null;
let started = false;
const listeners = new Set<() => void>();

function load() {
  if (started) return;
  started = true;
  fetch("/api/config")
    .then((r) => r.json())
    .then((c: ClientConfig) => (value = c))
    .catch(() => (value = { ai: false, paypalClientId: null }))
    .finally(() => listeners.forEach((l) => l()));
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  load();
  return () => listeners.delete(cb);
}

/** Which integrations the server has configured. null until the first answer arrives. */
export const useConfig = (): ClientConfig | null =>
  useSyncExternalStore(
    subscribe,
    () => value,
    () => null,
  );
