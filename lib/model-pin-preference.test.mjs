import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const {
  getPinnedModels,
  setPinnedModels,
  parsePinnedModels,
  modelPinKey,
  toPinKeySet,
  togglePinnedModel,
} = await jiti.import("./model-pin-preference.ts");

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

test("defaults to no pins when storage is empty or malformed", () => {
  assert.deepEqual(getPinnedModels(createStorage()), []);
  assert.deepEqual(
    getPinnedModels(createStorage({ "pi-pinned-models": "not-json" })),
    [],
  );
  assert.deepEqual(
    getPinnedModels(createStorage({ "pi-pinned-models": '{"provider":"x"}' })),
    [],
  );
  assert.deepEqual(
    getPinnedModels(createStorage({ "pi-pinned-models": "[1, null, \"x\"]" })),
    [],
  );
});

test("round-trips a pinned model list", () => {
  const storage = createStorage();
  const models = [
    { provider: "anthropic", modelId: "claude-sonnet-4-6" },
    { provider: "openai", modelId: "gpt-4o" },
  ];
  setPinnedModels(models, storage);
  assert.equal(
    storage.values.get("pi-pinned-models"),
    JSON.stringify(models),
  );
  assert.deepEqual(getPinnedModels(storage), models);
});

test("drops entries with non-string provider/modelId", () => {
  assert.deepEqual(
    parsePinnedModels('[{"provider":"a","modelId":"m"},{"provider":1,"modelId":"x"},{"provider":"b"}]'),
    [{ provider: "a", modelId: "m" }],
  );
});

test("toggle appends when absent and removes when present", () => {
  const target = { provider: "openai", modelId: "gpt-4o" };
  const once = togglePinnedModel([], target.provider, target.modelId);
  assert.deepEqual(once, [target]);
  assert.deepEqual(
    togglePinnedModel(once, target.provider, target.modelId),
    [],
  );
  // Removing a middle entry keeps the order of the rest.
  const three = [
    { provider: "a", modelId: "m1" },
    target,
    { provider: "b", modelId: "m2" },
  ];
  assert.deepEqual(togglePinnedModel(three, target.provider, target.modelId), [
    { provider: "a", modelId: "m1" },
    { provider: "b", modelId: "m2" },
  ]);
});

test("modelPinKey keeps provider/modelId with slashes apart", () => {
  assert.notEqual(modelPinKey("zenmux", "a/b"), modelPinKey("zenmux/a", "b"));
  assert.equal(modelPinKey("zenmux", "a/b"), modelPinKey("zenmux", "a/b"));
});

test("toPinKeySet indexes by stable key", () => {
  const keys = toPinKeySet([{ provider: "openai", modelId: "gpt-4o" }]);
  assert.equal(keys.has("openai\u0000gpt-4o"), true);
  assert.equal(keys.size, 1);
});

test("falls back safely when browser storage is unavailable", () => {
  const unavailable = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
  };
  assert.deepEqual(getPinnedModels(unavailable), []);
  assert.doesNotThrow(() =>
    setPinnedModels([{ provider: "openai", modelId: "gpt-4o" }], unavailable),
  );
  assert.deepEqual(getPinnedModels(null), []);
  assert.doesNotThrow(() => setPinnedModels([], null));
});
