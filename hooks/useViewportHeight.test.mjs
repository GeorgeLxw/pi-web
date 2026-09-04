import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const { shouldUseVisualViewportHeight } = await jiti.import("./useViewportHeight.ts");

test("tracks the visual viewport while an editor is focused (keyboard open)", () => {
  assert.equal(shouldUseVisualViewportHeight({
    hasFocusedEditable: true,
    viewportScale: 1,
  }), true);
});

test("keeps tracking when the layout viewport already shrank with the keyboard", () => {
  // Some browsers resize innerHeight together with the keyboard; the gate must
  // not depend on innerHeight vs viewport.height difference.
  assert.equal(shouldUseVisualViewportHeight({
    hasFocusedEditable: true,
    viewportScale: 1,
  }), true);
});

test("restores the dynamic height as soon as the editor loses focus", () => {
  assert.equal(shouldUseVisualViewportHeight({
    hasFocusedEditable: false,
    viewportScale: 1,
  }), false);
});

test("does not mistake pinch zoom for an open keyboard", () => {
  assert.equal(shouldUseVisualViewportHeight({
    hasFocusedEditable: true,
    viewportScale: 2,
  }), false);
});
