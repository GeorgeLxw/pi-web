// "Send" composer morph: when the user hits send, the message text visually
// lifts out of the composer and flies into the newly appended bubble.
//
// Two cooperating pieces:
//  1. ChatInput captures the textarea rect (before clearing) via
//     captureComposerFlySource().
//  2. ChatWindow consumes it once the new user row has mounted and animates a
//     bubble-styled overlay from the composer rect to that row's bubble.
//
// Pure DOM/WAAPI — no framework state, best-effort, reduced-motion aware.

export interface ComposerFlySource {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

let pending: { at: number; source: ComposerFlySource } | null = null;

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function captureComposerFlySource(source: ComposerFlySource): void {
  pending = { at: now(), source };
}

/** Latest capture, if fresh enough; consumed once so only one morph runs. */
export function consumeComposerFlySource(maxAgeMs = 900): ComposerFlySource | null {
  if (!pending) return null;
  if (now() - pending.at > maxAgeMs) {
    pending = null;
    return null;
  }
  const { source } = pending;
  pending = null;
  return source;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

function makeOverlay(source: ComposerFlySource): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  const style = overlay.style;
  style.position = "fixed";
  style.left = `${source.x}px`;
  style.top = `${source.y}px`;
  style.width = `${source.width}px`;
  style.height = `${source.height}px`;
  style.zIndex = "999";
  style.pointerEvents = "none";
  style.overflow = "hidden";
  style.boxSizing = "border-box";
  style.display = "flex";
  style.alignItems = "center";
  style.borderRadius = "14px";
  style.background = "var(--user-bg, #eff6ff)";
  style.border = "1px solid var(--border)";
  style.color = "var(--text)";
  style.fontSize = "14px";
  style.lineHeight = "1.5";
  style.padding = "4px 10px";
  overlay.textContent = source.text.trim().slice(0, 2000);
  return overlay;
}

/**
 * Animate `source` (composer rect + text) toward `toRect` (the bubble that now
 * holds the same text). The overlay flies up, shrinks into the bubble region
 * while fading its text, then disappears — the real bubble underneath carries
 * the hand-off. Best-effort: any failure just leaves no overlay.
 */
export function runSendMorphFly(source: ComposerFlySource, toRect: DOMRect): void {
  if (typeof document === "undefined" || prefersReducedMotion()) return;
  let overlay: HTMLDivElement;
  try {
    overlay = makeOverlay(source);
    document.body.appendChild(overlay);
  } catch {
    return;
  }

  const fromCenterX = source.x + source.width / 2;
  const fromCenterY = source.y + source.height / 2;
  const toCenterX = toRect.x + toRect.width / 2;
  const toCenterY = toRect.y + toRect.height / 2;
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;
  // Final scale maps the composer-width pill onto the (usually wider) bubble.
  const scaleX = Math.max(0.2, Math.min(1.6, toRect.width / Math.max(1, source.width)));
  const scaleY = Math.max(0.2, Math.min(1.4, toRect.height / Math.max(1, source.height)));

  const finish = () => {
    try {
      overlay.remove();
    } catch {
      // best-effort
    }
  };

  try {
    overlay.animate(
      [
        // 1) Lift out of the composer, keeping full readability.
        {
          transform: "translate(0px, 0px) scale(1)",
          opacity: 1,
          offset: 0,
        },
        {
          transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 10}px) scale(1)`,
          opacity: 1,
          offset: 0.45,
        },
        // 2) Shrink onto the bubble while the real bubble underneath pops in.
        {
          transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
          opacity: 0,
          offset: 1,
        },
      ],
      { duration: 520, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "forwards" },
    ).addEventListener("finish", finish, { once: true });
  } catch {
    finish();
  }
}
