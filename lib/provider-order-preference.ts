// Browser-persisted ordering of provider groups in the chat model selector.
// Same StorageLike pattern as lib/model-pin-preference.ts and
// lib/tool-preset-preference.ts: injectable storage, best-effort access, and
// malformed values fall back to an empty order (meaning "default order").

const STORAGE_KEY = "pi-provider-order";

/** Broadcast after writes so open pickers on the same page can resync. */
export const PROVIDER_ORDER_CHANGE_EVENT = "pi:provider-order-change";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function parseProviderOrder(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const strings = parsed.filter((item): item is string => typeof item === "string");
    // De-duplicate while preserving first occurrence.
    return [...new Set(strings)];
  } catch {
    return [];
  }
}

export function getProviderOrder(
  storage: StorageLike | null = getBrowserStorage(),
): string[] {
  if (!storage) return [];
  try {
    return parseProviderOrder(storage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function setProviderOrder(
  order: string[],
  storage: StorageLike | null = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify([...new Set(order)]));
  } catch {
    // Browser storage is best-effort.
  }
}

/** Notify already-open consumers (e.g. the model selector) of a change. */
export function notifyProviderOrderChanged(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(PROVIDER_ORDER_CHANGE_EVENT));
  } catch {
    // Best-effort.
  }
}

/** Pure reorder: moves the item at `from` to `to` (indices before removal). */
export function reorderList<T>(list: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length) return [...list];
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

const PROVIDER_ORDER_COLLATOR = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

/** Canonical default order: alphabetical by provider key. */
export function defaultProviderOrder(providers: readonly string[]): string[] {
  return [...providers].sort((a, b) => PROVIDER_ORDER_COLLATOR.compare(a, b));
}

/**
 * Arranges `all` so every provider mentioned in `preferredOrder` (that still
 * exists) comes first in that order, followed by the rest in their original
 * order. Unknown/removed preference entries are dropped.
 */
export function arrangeProviders(all: readonly string[], preferredOrder: readonly string[]): string[] {
  const preferred = preferredOrder.filter((provider) => all.includes(provider));
  const preferredSet = new Set(preferred);
  const rest = all.filter((provider) => !preferredSet.has(provider));
  return [...preferred, ...rest];
}
