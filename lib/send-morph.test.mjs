import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const { captureComposerFlySource, consumeComposerFlySource } = await jiti.import("./send-morph.ts");

function source(overrides = {}) {
  return { x: 10, y: 800, width: 400, height: 40, text: "hello world", ...overrides };
}

test("returns nothing when nothing was captured", () => {
  assert.equal(consumeComposerFlySource(), null);
});

test("returns the captured source once, then clears it", () => {
  captureComposerFlySource(source());
  const captured = consumeComposerFlySource();
  assert.deepEqual(captured, source());
  assert.equal(consumeComposerFlySource(), null);
});

test("a stale capture is dropped", async () => {
  captureComposerFlySource(source());
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(consumeComposerFlySource(10), null);
});

test("a second capture replaces the first", () => {
  captureComposerFlySource(source({ text: "first" }));
  captureComposerFlySource(source({ text: "second" }));
  assert.equal(consumeComposerFlySource()?.text, "second");
});
