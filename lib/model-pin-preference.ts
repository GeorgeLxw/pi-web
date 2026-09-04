// Browser-persisted set of pinned models for the chat model selector.
// Mirrors the StorageLike pattern of lib/tool-preset-preference.ts: storage is
// injectable for tests, all access is try/catch best-effort, and malformed
// values fall back to an empty list.

const STORAGE_KEY = "pi-pinned-models";

export interface PinnedModel {
  provider: string;
  modelId: string;
}

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

export function isPinnedModel(value: unknown): value is PinnedModel {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.provider === "string" && typeof entry.modelId === "string";
}

export function parsePinnedModels(raw: string | null): PinnedModel[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPinnedModel);
  } catch {
    return [];
  }
}

export function getPinnedModels(
  storage: StorageLike | null = getBrowserStorage(),
): PinnedModel[] {
  if (!storage) return [];
  try {
    return parsePinnedModels(storage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function setPinnedModels(
  models: PinnedModel[],
  storage: StorageLike | null = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(models));
  } catch {
    // Browser storage is best-effort.
  }
}

/** Stable identity key for a model; provider and modelId may contain '/'. */
export function modelPinKey(provider: string, modelId: string): string {
  return `${provider}\u0000${modelId}`;
}

export function toPinKeySet(models: readonly PinnedModel[]): Set<string> {
  const keys = new Set<string>();
  for (const { provider, modelId } of models) {
    keys.add(modelPinKey(provider, modelId));
  }
  return keys;
}

/** Pure toggle: appends when absent, removes when present. Keeps pin order. */
export function togglePinnedModel(
  models: readonly PinnedModel[],
  provider: string,
  modelId: string,
): PinnedModel[] {
  const key = modelPinKey(provider, modelId);
  if (models.some((entry) => modelPinKey(entry.provider, entry.modelId) === key)) {
    return models.filter(
      (entry) => modelPinKey(entry.provider, entry.modelId) !== key,
    );
  }
  return [...models, { provider, modelId }];
}
