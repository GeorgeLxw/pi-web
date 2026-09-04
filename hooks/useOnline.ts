"use client";

import { useEffect, useState } from "react";

/**
 * Online state. Starts `true` on both server and the client's first paint so
 * hydration never sees a conditional (the offline banner) that differs
 * between the two; the real value is applied right after mount via effect.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  return online;
}
