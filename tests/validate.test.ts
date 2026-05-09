import assert from "node:assert/strict";
import { test } from "node:test";
import { loadFixture, validateFixture } from "../src/index.js";

test("passing fixture has no violations", async () => {
  const fixture = await loadFixture("fixtures/pass/probe.json");
  assert.deepEqual(validateFixture(fixture), []);
});

test("failing fixture reports deterministic violation codes", async () => {
  const fixture = await loadFixture("fixtures/fail/probe.json");
  const codes = validateFixture(fixture).map((violation) => violation.code).sort();
  assert.deepEqual(codes, ["EVAL_BELOW_THRESHOLD", "TOOL_TRACE_MISSING", "TRACE_TOO_SLOW"]);
});
