import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const { getWaitingHints, pickWaitingHint, isWaitingHintsLocale } = await jiti.import("./waiting-hints.ts");

test("returns non-empty hint lists for every supported locale", () => {
  for (const locale of ["en", "zh-CN", "zh-TW"]) {
    const hints = getWaitingHints(locale);
    assert.ok(hints.length >= 8, `${locale} should have several hints`);
  }
});

test("unknown locale falls back to English", () => {
  assert.deepEqual(getWaitingHints("fr-FR"), getWaitingHints("en"));
  assert.deepEqual(getWaitingHints(""), getWaitingHints("en"));
});

test("isWaitingHintsLocale only accepts the three supported ids", () => {
  assert.equal(isWaitingHintsLocale("en"), true);
  assert.equal(isWaitingHintsLocale("zh-CN"), true);
  assert.equal(isWaitingHintsLocale("zh-TW"), true);
  assert.equal(isWaitingHintsLocale("fr"), false);
});

test("pickWaitingHint returns members of the list", () => {
  const hints = getWaitingHints("en");
  for (let i = 0; i < 40; i++) {
    assert.ok(hints.includes(pickWaitingHint(hints)));
  }
});

test("pickWaitingHint never returns the excluded line when more than one exists", () => {
  const hints = getWaitingHints("zh-CN");
  const seen = new Set();
  for (let i = 0; i < 100; i++) {
    const picked = pickWaitingHint(hints, "正在认真考虑你的问题,包括那些绕弯的想法");
    assert.notEqual(picked, "正在认真考虑你的问题,包括那些绕弯的想法");
    seen.add(picked);
  }
  // Rotation should be able to surface many different lines.
  assert.ok(seen.size >= 3);
});

test("pickWaitingHint handles empty and single-hint lists", () => {
  assert.equal(pickWaitingHint([]), "");
  assert.equal(pickWaitingHint(["only"]), "only");
  assert.equal(pickWaitingHint(["only"], "only"), "only");
});
