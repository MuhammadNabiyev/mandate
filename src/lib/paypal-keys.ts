"use client";

import { useSyncExternalStore } from "react";

/**
 * A visitor's own PayPal sandbox keys, for trying the real sandbox flow without the owner's keys.
 * Kept in this tab's sessionStorage only (gone when the tab closes) and sent in two headers to this
 * app's own API, which forwards them to PayPal's sandbox host and nowhere else.
 */
export interface SandboxKeys {
  clientId: string;
  secret: string;
}

const KEY = "mandate.paypal.sandbox.v1";
const EVENT = "mandate:paypal-keys";
export const KEY_SHAPE = /^[A-Za-z0-9_-]{20,200}$/;

let cacheRaw: string | null | undefined;
let cacheValue: SandboxKeys | null = null;

function read(): SandboxKeys | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw !== cacheRaw) {
      cacheRaw = raw;
      const v = raw ? (JSON.parse(raw) as Partial<SandboxKeys>) : null;
      cacheValue = v && typeof v.clientId === "string" && typeof v.secret === "string" && KEY_SHAPE.test(v.clientId) && KEY_SHAPE.test(v.secret) ? { clientId: v.clientId, secret: v.secret } : null;
    }
  } catch {
    /* storage blocked: keep whatever is in memory */
  }
  return cacheValue;
}

export function saveKeys(keys: SandboxKeys): boolean {
  const clientId = keys.clientId.trim();
  const secret = keys.secret.trim();
  if (!KEY_SHAPE.test(clientId) || !KEY_SHAPE.test(secret)) return false;
  cacheValue = { clientId, secret };
  try {
    cacheRaw = JSON.stringify(cacheValue);
    window.sessionStorage.setItem(KEY, cacheRaw);
  } catch {
    cacheRaw = undefined;
  }
  window.dispatchEvent(new Event(EVENT));
  return true;
}

export function clearKeys() {
  cacheValue = null;
  cacheRaw = null;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
  window.dispatchEvent(new Event(EVENT));
}

export const keyHeaders = (): Record<string, string> => {
  const k = read();
  return k ? { "x-paypal-client-id": k.clientId, "x-paypal-client-secret": k.secret } : {};
};

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export const useSandboxKeys = (): SandboxKeys | null =>
  useSyncExternalStore(
    subscribe,
    read,
    () => null,
  );
