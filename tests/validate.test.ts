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

test("semantic fixture reports path-specific ordering and numeric violations", async () => {
  const fixture = await loadFixture("fixtures/fail/semantic-invalid.json");
  const violations = validateFixture(fixture);
  assert.deepEqual(
    violations.map(({ code, path }) => ({ code, path })),
    [
      { code: "TOOL_TIMESTAMP_ORDER_INVALID", path: "tools[0].endedAt" },
      { code: "TRACE_TIMESTAMP_ORDER_INVALID", path: "traces[0].endTime" },
      { code: "EVAL_SCORE_INVALID", path: "evals[0].score" },
      { code: "EVAL_THRESHOLD_INVALID", path: "evals[1].threshold" }
    ]
  );
});

test("malformed timestamps produce path-specific violations without throwing", async () => {
  const fixture = await loadFixture("fixtures/fail/timestamp-invalid.json");
  assert.deepEqual(
    validateFixture(fixture).map(({ code, path }) => ({ code, path })),
    [
      { code: "TIMESTAMP_INVALID", path: "tools[0].startedAt" },
      { code: "TIMESTAMP_INVALID", path: "tools[0].endedAt" },
      { code: "TIMESTAMP_INVALID", path: "traces[0].startTime" },
      { code: "TIMESTAMP_INVALID", path: "traces[0].endTime" }
    ]
  );
});

test("non-finite eval numbers are rejected without coercion", async () => {
  const fixture = await loadFixture("fixtures/pass/probe.json");
  const evalEvent = fixture.evals[0]!;
  evalEvent.score = Number.NaN;
  fixture.evals.push({ ...evalEvent, id: "eval-infinite-threshold", score: 1, threshold: Number.POSITIVE_INFINITY });
  fixture.expectations!.minEvalScore = Number.NEGATIVE_INFINITY;
  assert.deepEqual(
    validateFixture(fixture).map(({ code, path }) => ({ code, path })),
    [
      { code: "EVAL_THRESHOLD_INVALID", path: "expectations.minEvalScore" },
      { code: "EVAL_SCORE_INVALID", path: "evals[0].score" },
      { code: "EVAL_THRESHOLD_INVALID", path: "evals[1].threshold" }
    ]
  );
});

test("equal timestamps and numeric boundary scores remain valid", async () => {
  const fixture = await loadFixture("fixtures/pass/probe.json");
  fixture.tools[0]!.endedAt = fixture.tools[0]!.startedAt;
  fixture.traces[0]!.endTime = fixture.traces[0]!.startTime;
  fixture.evals[0]!.score = 0;
  fixture.evals[0]!.threshold = 0;
  fixture.expectations!.minEvalScore = 0;
  assert.deepEqual(validateFixture(fixture), []);
});
