import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const {
  getProviderOrder,
  setProviderOrder,
  parseProviderOrder,
  reorderList,
  arrangeProviders,
  defaultProviderOrder,
} = await jiti.import("./provider-order-preference.ts");

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

test("defaults to empty order when storage is missing or malformed", () => {
  assert.deepEqual(getProviderOrder(createStorage()), []);
  assert.deepEqual(getProviderOrder(createStorage({ "pi-provider-order": "nope" })), []);
  assert.deepEqual(getProviderOrder(createStorage({ "pi-provider-order": "[1,null]" })), []);
  assert.deepEqual(getProviderOrder(createStorage({ "pi-provider-order": '{"a":1}' })), []);
});

test("round-trips an order list", () => {
  const storage = createStorage();
  const order = ["openrouter", "deepseek", "zai"];
  setProviderOrder(order, storage);
  assert.equal(storage.values.get("pi-provider-order"), JSON.stringify(order));
  assert.deepEqual(getProviderOrder(storage), order);
});

test("parse drops non-strings and duplicate entries", () => {
  assert.deepEqual(
    parseProviderOrder('["openrouter", 5, "openrouter", null, "zai"]'),
    ["openrouter", "zai"],
  );
});

test("set serializes de-duplicated entries", () => {
  const storage = createStorage();
  setProviderOrder(["a", "a", "b"], storage);
  assert.equal(storage.values.get("pi-provider-order"), '["a","b"]');
});

test("reorderList moves items by pre-removal indices", () => {
  const list = ["a", "b", "c", "d"];
  assert.deepEqual(reorderList(list, 0, 3), ["b", "c", "d", "a"]);
  assert.deepEqual(reorderList(list, 3, 0), ["d", "a", "b", "c"]);
  assert.deepEqual(reorderList(list, 1, 1), list);
  assert.deepEqual(reorderList(list, -1, 2), list);
  assert.deepEqual(reorderList(list, 5, 2), list);
});

test("arrangeProviders puts preferred entries first, drops unknown ones", () => {
  const all = ["openrouter", "deepseek", "zai", "anthropic"];
  assert.deepEqual(
    arrangeProviders(all, ["zai", "openrouter"]),
    ["zai", "openrouter", "deepseek", "anthropic"],
  );
  assert.deepEqual(
    arrangeProviders(all, ["ghost", "zai"]),
    ["zai", "openrouter", "deepseek", "anthropic"],
  );
  assert.deepEqual(arrangeProviders(all, []), all);
});

test("defaultProviderOrder sorts alphabetically", () => {
  assert.deepEqual(
    defaultProviderOrder(["openrouter", "deepseek", "zai", "anthropic"]),
    ["anthropic", "deepseek", "openrouter", "zai"],
  );
  assert.deepEqual(defaultProviderOrder(["openrouter", "deepseek"]), ["deepseek", "openrouter"]);
  assert.deepEqual(defaultProviderOrder([]), []);
});

test("falls back safely when browser storage is unavailable", () => {
  const unavailable = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
  };
  assert.deepEqual(getProviderOrder(unavailable), []);
  assert.doesNotThrow(() => setProviderOrder(["a"], unavailable));
  assert.deepEqual(getProviderOrder(null), []);
  assert.doesNotThrow(() => setProviderOrder([], null));
});
