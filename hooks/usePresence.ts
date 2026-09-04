"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface PresenceState {
  /** Render while true (open or animating out). */
  mounted: boolean;
  /** True during the exit phase — add your "out" class/animation. */
  closing: boolean;
  /** Call when open changes so the hook knows the exit should start. */
  setOpen: (open: boolean) => void;
}

/**
 * Keeps a conditionally-rendered popover/menu mounted for `exitMs` after it
 * closes so an exit animation can play before the node unmounts.
 *
 * Usage: keep `mounted && <div className={closing ? "...out" : "...in"}>`
 * and drive it from `setOpen` (usually the same value as your open flag).
 */
export function usePresence(open: boolean, exitMs = 140): PresenceState {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setClosing(false);
      setMounted(true);
      return;
    }
    if (mounted) {
      setClosing(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setClosing(false);
        setMounted(false);
      }, exitMs);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, mounted, exitMs]);

  const setOpen = useCallback((next: boolean) => {
    // open is normally owned by the parent; this hook only reacts to it.
    // Keeping an imperative escape hatch costs nothing and avoids surprises.
    if (next) {
      setClosing(false);
      setMounted(true);
    } else if (mounted) {
      setClosing(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setClosing(false);
        setMounted(false);
      }, exitMs);
    }
  }, [mounted, exitMs]);

  return { mounted, closing, setOpen };
}
