// Tactile feedback (Android): short vibration pulses on primary actions like
// send / stop. Off by default state is stored under pi-haptics; the pulse is
// skipped on desktop (no vibrate), reduced-motion users, or when disabled.

const STORAGE_KEY = "pi-haptics";

function readPreference(): boolean {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value !== "off";
  } catch {
    return true;
  }
}

export function isHapticsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return readPreference();
}

export function setHapticsEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // best-effort
  }
}

export function hapticPulse(durationMs = 10): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  if (!isHapticsEnabled()) return;
  try {
    navigator.vibrate(durationMs);
  } catch {
    // best-effort
  }
}
