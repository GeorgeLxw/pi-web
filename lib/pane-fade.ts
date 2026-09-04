// Localized content-swap animation for pane switches (e.g. chat session
// changes). Unlike View Transitions this never snapshots the whole page, so it
// cannot interfere with the theme circle transition; it just fades the target
// pane out, swaps content synchronously, and fades back in.

import { flushSync } from "react-dom";

export function runPaneFade(element: HTMLElement | null, update: () => void, fadeMs = 90): void {
  if (typeof window === "undefined" || !element) {
    update();
    return;
  }
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true) {
    update();
    return;
  }
  const out = element.animate(
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: fadeMs, easing: "ease-in", fill: "forwards" },
  );
  out.onfinish = () => {
    try {
      flushSync(update);
    } catch {
      update();
    }
    element.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: fadeMs + 30, easing: "ease-out" },
    );
  };
}
