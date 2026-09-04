import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, {
  jsx: { runtime: "automatic" },
  tsconfigPaths: true,
});
const {
  ModelSelector,
  partitionPinnedModelOptions,
  orderProviderGroups,
  filterModelOptions,
} = await jiti.import("./ModelSelector.tsx");

const options = [
  { provider: "anthropic", modelId: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
  { provider: "openai", modelId: "gpt-4o", name: "GPT-4o" },
  { provider: "openai", modelId: "gpt-4o-mini", name: "GPT-4o mini" },
  { provider: "zenmux", modelId: "a/b", name: "Zen A/B" },
];

test("partition keeps pinned options in pin order, on top of the rest", () => {
  const pinnedModels = [
    { provider: "openai", modelId: "gpt-4o" },
    { provider: "anthropic", modelId: "claude-sonnet-4-6" },
  ];
  const { pinned, rest } = partitionPinnedModelOptions(options, pinnedModels);
  assert.deepEqual(pinned, [options[1], options[0]]);
  assert.deepEqual(rest, [options[2], options[3]]);
});

test("partition drops pins that are not in the option list anymore", () => {
  const { pinned, rest } = partitionPinnedModelOptions(options, [
    { provider: "gone", modelId: "removed-model" },
  ]);
  assert.deepEqual(pinned, []);
  assert.deepEqual(rest, options);
});

test("partition is a no-op without pins", () => {
  const { pinned, rest } = partitionPinnedModelOptions(options, []);
  assert.deepEqual(pinned, []);
  assert.deepEqual(rest, options);
});

test("partition key handles slashes in provider/modelId", () => {
  const { pinned, rest } = partitionPinnedModelOptions(options, [
    { provider: "zenmux", modelId: "a/b" },
  ]);
  assert.deepEqual(pinned, [options[3]]);
  assert.deepEqual(rest, [options[0], options[1], options[2]]);
});

test("filterModelOptions still filters the full option list", () => {
  assert.deepEqual(
    filterModelOptions(options, "gpt").map((option) => option.modelId),
    ["gpt-4o", "gpt-4o-mini"],
  );
});

test("orderProviderGroups puts preferred groups first in preference order", () => {
  const groups = [
    { provider: "openrouter", options: [options[1]] },
    { provider: "deepseek", options: [options[0]] },
    { provider: "zai", options: [options[2]] },
  ];
  const ordered = orderProviderGroups(groups, ["zai", "openrouter"]);
  assert.deepEqual(ordered.map((g) => g.provider), ["zai", "openrouter", "deepseek"]);
});

test("orderProviderGroups keeps unlisted groups in original relative order", () => {
  const groups = [
    { provider: "a", options: [] },
    { provider: "b", options: [] },
    { provider: "c", options: [] },
  ];
  assert.deepEqual(
    orderProviderGroups(groups, ["b"]).map((g) => g.provider),
    ["b", "a", "c"],
  );
  assert.deepEqual(
    orderProviderGroups(groups, []).map((g) => g.provider),
    ["a", "b", "c"],
  );
});

test("orderProviderGroups ignores preference entries with no matching group", () => {
  const groups = [{ provider: "a", options: [] }];
  assert.deepEqual(
    orderProviderGroups(groups, ["ghost", "a"]).map((g) => g.provider),
    ["a"],
  );
});

test("ModelSelector exposes the toolbar component", () => {
  assert.equal(typeof ModelSelector, "function");
});
