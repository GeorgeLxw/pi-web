// Small View Transition helper: wrap a content-swap update so browsers that
// support the View Transition API get a smooth cross-fade (default root
// snapshot) while everyone else just runs the update synchronously.
// Reduced-motion users and unsupported browsers skip straight to the update.

import { flushSync } from "react-dom";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished?: Promise<unknown> };
};

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

export function runViewTransition(update: () => void): void {
  if (typeof document === "undefined" || prefersReducedMotion()) {
    update();
    return;
  }
  const doc = document as ViewTransitionDocument;
  if (typeof doc.startViewTransition !== "function") {
    update();
    return;
  }
  const transition = doc.startViewTransition(() => {
    // flushSync makes React commit synchronously so the API snapshots the
    // *new* DOM inside the transition instead of a half-updated tree.
    flushSync(update);
  });
  // Rapid successive switches abort earlier transitions — swallow that.
  Promise.resolve(transition?.finished)?.catch(() => {});
}
