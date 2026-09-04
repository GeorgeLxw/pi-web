import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const { sessionSearchText, matchesSessionQuery } = await jiti.import("./session-search.ts");

function session(overrides = {}) {
  return {
    id: "abc-123",
    firstMessage: "检查下 pi-web 服务,怎么没有起来",
    ...overrides,
  };
}

test("matches against the first message (row title)", () => {
  const s = session();
  assert.equal(matchesSessionQuery(s, "pi-web"), true);
  assert.equal(matchesSessionQuery(s, "怎么没有起来"), true);
  assert.equal(matchesSessionQuery(s, "不存在的词"), false);
});

test("matches case-insensitively", () => {
  assert.equal(matchesSessionQuery(session({ firstMessage: "Check GitHub access" }), "github"), true);
  assert.equal(matchesSessionQuery(session({ firstMessage: "Check GitHub access" }), "GITHUB"), true);
});

test("matches the stored name and the id", () => {
  const s = session({ name: "My custom title" });
  assert.equal(matchesSessionQuery(s, "custom title"), true);
  assert.equal(matchesSessionQuery(s, "abc-123"), true);
  assert.equal(matchesSessionQuery(s, "My"), true);
});

test("empty or whitespace query matches everything", () => {
  const s = session();
  assert.equal(matchesSessionQuery(s, ""), true);
  assert.equal(matchesSessionQuery(s, "   "), true);
});

test("matches the collapsed skill-invocation title, not the raw XML", () => {
  const expanded = session({
    firstMessage: `<skill name="image-editing" location="/Users/me/skills/image-editing/SKILL.md">\nReferences are relative to /Users/me.\n\nUpscale the photo\n</skill>`,
  });
  assert.equal(matchesSessionQuery(expanded, "/skill:image-editing"), true);
  // The body is collapsed away; only the command form is searchable.
  assert.equal(matchesSessionQuery(expanded, "Upscale the photo"), false);
});

test("sessionSearchText covers name, title, and id", () => {
  const text = sessionSearchText(session({ name: "n", firstMessage: "hello world" }));
  assert.match(text, /n/);
  assert.match(text, /hello world/);
  assert.match(text, /abc-123/);
});
