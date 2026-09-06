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

for (const [collection, invalidValue] of [["tools", null], ["traces", 42], ["evals", "not an eval"]] as const) {
  test(`${collection} members must be JSON objects`, async () => {
    const fixture = await loadFixture(`fixtures/fail/${collection}-member-invalid.json`);

    assert.deepEqual(validateFixture(fixture), [{
      code: "FIXTURE_MEMBER_SHAPE_INVALID",
      message: `${collection}[0] must be a JSON object.`,
      severity: "error",
      path: `${collection}[0]`,
      expected: "object",
      actual: invalidValue
    }]);
  });
}

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

test("parseable non-RFC3339 timestamps produce path-specific violations", async () => {
  const fixture = await loadFixture("fixtures/fail/timestamp-non-rfc3339.json");
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
      { code: "EXPECTATION_INVALID", path: "expectations.minEvalScore" },
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

test("numeric thresholds cannot be overridden by an explicit pass", async () => {
  const fixture = await loadFixture("fixtures/pass/probe.json");
  fixture.expectations!.minEvalScore = 0.9;
  delete fixture.evals[0]!.threshold;
  fixture.evals[0]!.score = 0.1;
  fixture.evals[0]!.passed = true;

  assert.deepEqual(validateFixture(fixture).map(({ code, expected, actual }) => ({ code, expected, actual })), [
    { code: "EVAL_BELOW_THRESHOLD", expected: ">= 0.9", actual: 0.1 }
  ]);
});

test("an explicit failure without a threshold has a meaningful violation", async () => {
  const fixture = await loadFixture("fixtures/pass/probe.json");
  delete fixture.expectations!.minEvalScore;
  delete fixture.evals[0]!.threshold;
  fixture.evals[0]!.passed = false;

  assert.deepEqual(validateFixture(fixture).map(({ code, message, expected, actual }) => ({ code, message, expected, actual })), [
    {
      code: "EVAL_MARKED_FAILED",
      message: "evals[0] is explicitly marked as failed.",
      expected: "passed: true",
      actual: false
    }
  ]);
});

test("an eval threshold takes precedence over the fixture minimum", async () => {
  const fixture = await loadFixture("fixtures/pass/probe.json");
  fixture.expectations!.minEvalScore = 0.9;
  fixture.evals[0]!.threshold = 0.4;
  fixture.evals[0]!.score = 0.5;
  fixture.evals[0]!.passed = true;

  assert.deepEqual(validateFixture(fixture), []);
});

test("malformed expectations produce deterministic path-specific violations", async () => {
  const fixture = await loadFixture("fixtures/fail/expectations-invalid.json");
  assert.deepEqual(
    validateFixture(fixture).map(({ code, path }) => ({ code, path })),
    [
      { code: "EXPECTATION_INVALID", path: "expectations.requiredToolFields" },
      { code: "EXPECTATION_INVALID", path: "expectations.requiredTraceFields[1]" },
      { code: "EXPECTATION_INVALID", path: "expectations.requiredTraceFields[2]" },
      { code: "EXPECTATION_INVALID", path: "expectations.requiredEvalFields[0]" },
      { code: "EXPECTATION_INVALID", path: "expectations.requireTraceForEveryTool" },
      { code: "EXPECTATION_INVALID", path: "expectations.requireEvalForEveryTrace" },
      { code: "EXPECTATION_INVALID", path: "expectations.minEvalScore" },
      { code: "EXPECTATION_INVALID", path: "expectations.maxDurationMs" }
    ]
  );
});

test("non-object expectations and non-finite numeric values never throw", async () => {
  const fixture = await loadFixture("fixtures/pass/probe.json");
  fixture.expectations = [] as never;
  assert.deepEqual(validateFixture(fixture).map(({ path }) => path), ["expectations"]);
  fixture.expectations = { minEvalScore: Number.NaN, maxDurationMs: Number.POSITIVE_INFINITY };
  assert.deepEqual(validateFixture(fixture).map(({ path }) => path), ["expectations.minEvalScore", "expectations.maxDurationMs"]);
});
