import { hasPath } from "./field-path.js";
import { durationMs } from "./time.js";
import type { ProbeExpectations, ProbeFixture, ProbeViolation } from "./types.js";

const DEFAULT_EXPECTATIONS: Required<Pick<ProbeExpectations, "requiredTraceFields" | "requiredToolFields" | "requiredEvalFields" | "requireTraceForEveryTool">> = {
  requiredTraceFields: ["traceId", "spanId", "name", "kind", "startTime", "endTime", "status"],
  requiredToolFields: ["id", "name", "status", "startedAt", "endedAt", "traceId", "spanId"],
  requiredEvalFields: ["id", "traceId", "metric", "score"],
  requireTraceForEveryTool: true
};

export function validateFixture(fixture: ProbeFixture): ProbeViolation[] {
  const expectations = { ...DEFAULT_EXPECTATIONS, ...fixture.expectations };
  return [
    ...validateRequiredFields("tools", fixture.tools, expectations.requiredToolFields),
    ...validateRequiredFields("traces", fixture.traces, expectations.requiredTraceFields),
    ...validateRequiredFields("evals", fixture.evals, expectations.requiredEvalFields),
    ...validateRelationships(fixture, expectations),
    ...validateDurations(fixture, expectations),
    ...validateEvalScores(fixture, expectations)
  ];
}

function validateRequiredFields(collection: string, rows: unknown[], fields: string[]): ProbeViolation[] {
  return rows.flatMap((row, index) =>
    fields
      .filter((field) => !hasPath(row, field))
      .map((field) => ({
        code: "REQUIRED_FIELD_MISSING",
        message: `${collection}[${index}] is missing required field ${field}.`,
        severity: "error" as const,
        path: `${collection}[${index}].${field}`,
        expected: "present",
        actual: "missing"
      }))
  );
}

function validateRelationships(fixture: ProbeFixture, expectations: ProbeExpectations): ProbeViolation[] {
  const traces = new Set(fixture.traces.map((trace) => trace.traceId));
  const evalTraces = new Set(fixture.evals.map((event) => event.traceId));
  const violations: ProbeViolation[] = [];
  if (expectations.requireTraceForEveryTool !== false) {
    fixture.tools.forEach((tool, index) => {
      if (!traces.has(tool.traceId)) {
        violations.push({ code: "TOOL_TRACE_MISSING", message: `tools[${index}] references missing trace ${tool.traceId}.`, severity: "error", path: `tools[${index}].traceId`, expected: "known traceId", actual: tool.traceId });
      }
    });
  }
  if (expectations.requireEvalForEveryTrace === true) {
    fixture.traces.forEach((trace, index) => {
      if (!evalTraces.has(trace.traceId)) {
        violations.push({ code: "TRACE_EVAL_MISSING", message: `traces[${index}] has no eval event.`, severity: "warning", path: `traces[${index}].traceId`, expected: "eval traceId", actual: trace.traceId });
      }
    });
  }
  return violations;
}

function validateDurations(fixture: ProbeFixture, expectations: ProbeExpectations): ProbeViolation[] {
  const max = expectations.maxDurationMs;
  if (typeof max !== "number") return [];
  return fixture.traces.flatMap((trace, index) => {
    const duration = durationMs(trace.startTime, trace.endTime, `traces[${index}]`);
    return duration > max ? [{ code: "TRACE_TOO_SLOW", message: `traces[${index}] duration ${duration}ms exceeds ${max}ms.`, severity: "warning" as const, path: `traces[${index}]`, expected: `<= ${max}ms`, actual: `${duration}ms` }] : [];
  });
}

function validateEvalScores(fixture: ProbeFixture, expectations: ProbeExpectations): ProbeViolation[] {
  const min = expectations.minEvalScore;
  return fixture.evals.flatMap((event, index) => {
    const threshold = typeof event.threshold === "number" ? event.threshold : min;
    const passed = typeof event.passed === "boolean" ? event.passed : threshold === undefined || event.score >= threshold;
    if (passed) return [];
    return [{ code: "EVAL_BELOW_THRESHOLD", message: `evals[${index}] score ${event.score} is below threshold ${threshold}.`, severity: "error" as const, path: `evals[${index}].score`, expected: `>= ${threshold}`, actual: event.score }];
  });
}
