import { hasPath } from "./field-path.js";
import type { ProbeExpectations, ProbeFixture, ProbeViolation } from "./types.js";

const DEFAULT_EXPECTATIONS: Required<Pick<ProbeExpectations, "requiredTraceFields" | "requiredToolFields" | "requiredEvalFields" | "requireTraceForEveryTool">> = {
  requiredTraceFields: ["traceId", "spanId", "name", "kind", "startTime", "endTime", "status"],
  requiredToolFields: ["id", "name", "status", "startedAt", "endedAt", "traceId", "spanId"],
  requiredEvalFields: ["id", "traceId", "metric", "score"],
  requireTraceForEveryTool: true
};

export function validateFixture(fixture: ProbeFixture): ProbeViolation[] {
  const memberShapeViolations = validateMemberShapes(fixture);
  const expectations = { ...DEFAULT_EXPECTATIONS, ...fixture.expectations };
  return [
    ...memberShapeViolations,
    ...validateRequiredFields("tools", fixture.tools, expectations.requiredToolFields),
    ...validateRequiredFields("traces", fixture.traces, expectations.requiredTraceFields),
    ...validateRequiredFields("evals", fixture.evals, expectations.requiredEvalFields),
    ...validateRelationships(fixture, expectations),
    ...validateTimestamps(fixture),
    ...validateTimestampOrder(fixture),
    ...validateDurations(fixture, expectations),
    ...validateEvalScores(fixture, expectations)
  ];
}

function validateMemberShapes(fixture: ProbeFixture): ProbeViolation[] {
  return (["tools", "traces", "evals"] as const).flatMap((collection) =>
    fixture[collection].flatMap((row, index) => {
      if (isJsonObject(row)) return [];
      return [{
        code: "FIXTURE_MEMBER_SHAPE_INVALID",
        message: `${collection}[${index}] must be a JSON object.`,
        severity: "error" as const,
        path: `${collection}[${index}]`,
        expected: "object",
        actual: row
      }];
    })
  );
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateTimestamps(fixture: ProbeFixture): ProbeViolation[] {
  return [
    ...fixture.tools.flatMap((tool, index) => isJsonObject(tool) ? [
        invalidTimestampViolation(`tools[${index}].startedAt`, tool.startedAt),
        invalidTimestampViolation(`tools[${index}].endedAt`, tool.endedAt)
      ] : []),
    ...fixture.traces.flatMap((trace, index) => isJsonObject(trace) ? [
        invalidTimestampViolation(`traces[${index}].startTime`, trace.startTime),
        invalidTimestampViolation(`traces[${index}].endTime`, trace.endTime)
      ] : [])
  ].filter((violation): violation is ProbeViolation => violation !== undefined);
}

function invalidTimestampViolation(path: string, value: string): ProbeViolation | undefined {
  if (timestampValue(value) !== undefined) return undefined;
  return {
    code: "TIMESTAMP_INVALID",
    message: `${path} must be a valid timestamp.`,
    severity: "error",
    path,
    expected: "valid timestamp",
    actual: value
  };
}

function validateTimestampOrder(fixture: ProbeFixture): ProbeViolation[] {
  const violations: ProbeViolation[] = [];
  fixture.tools.forEach((tool, index) => {
    if (!isJsonObject(tool)) return;
    const startedAt = timestampValue(tool.startedAt);
    const endedAt = timestampValue(tool.endedAt);
    if (startedAt !== undefined && endedAt !== undefined && endedAt < startedAt) {
      violations.push({
        code: "TOOL_TIMESTAMP_ORDER_INVALID",
        message: `tools[${index}].endedAt must not be before startedAt.`,
        severity: "error",
        path: `tools[${index}].endedAt`,
        expected: `>= ${tool.startedAt}`,
        actual: tool.endedAt
      });
    }
  });
  fixture.traces.forEach((trace, index) => {
    if (!isJsonObject(trace)) return;
    const startTime = timestampValue(trace.startTime);
    const endTime = timestampValue(trace.endTime);
    if (startTime !== undefined && endTime !== undefined && endTime < startTime) {
      violations.push({
        code: "TRACE_TIMESTAMP_ORDER_INVALID",
        message: `traces[${index}].endTime must not be before startTime.`,
        severity: "error",
        path: `traces[${index}].endTime`,
        expected: `>= ${trace.startTime}`,
        actual: trace.endTime
      });
    }
  });
  return violations;
}

function validateRequiredFields(collection: string, rows: unknown[], fields: string[]): ProbeViolation[] {
  return rows.flatMap((row, index) =>
    isJsonObject(row) ? fields
      .filter((field) => !hasPath(row, field))
      .map((field) => ({
        code: "REQUIRED_FIELD_MISSING",
        message: `${collection}[${index}] is missing required field ${field}.`,
        severity: "error" as const,
        path: `${collection}[${index}].${field}`,
        expected: "present",
        actual: "missing"
      })) : []
  );
}

function validateRelationships(fixture: ProbeFixture, expectations: ProbeExpectations): ProbeViolation[] {
  const traces = new Set(fixture.traces.filter(isJsonObject).map((trace) => trace.traceId));
  const evalTraces = new Set(fixture.evals.filter(isJsonObject).map((event) => event.traceId));
  const violations: ProbeViolation[] = [];
  if (expectations.requireTraceForEveryTool !== false) {
    fixture.tools.forEach((tool, index) => {
      if (!isJsonObject(tool)) return;
      if (!traces.has(tool.traceId)) {
        violations.push({ code: "TOOL_TRACE_MISSING", message: `tools[${index}] references missing trace ${tool.traceId}.`, severity: "error", path: `tools[${index}].traceId`, expected: "known traceId", actual: tool.traceId });
      }
    });
  }
  if (expectations.requireEvalForEveryTrace === true) {
    fixture.traces.forEach((trace, index) => {
      if (!isJsonObject(trace)) return;
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
    if (!isJsonObject(trace)) return [];
    const startTime = timestampValue(trace.startTime);
    const endTime = timestampValue(trace.endTime);
    if (startTime === undefined || endTime === undefined) return [];
    const duration = endTime - startTime;
    return duration >= 0 && duration > max ? [{ code: "TRACE_TOO_SLOW", message: `traces[${index}] duration ${duration}ms exceeds ${max}ms.`, severity: "warning" as const, path: `traces[${index}]`, expected: `<= ${max}ms`, actual: `${duration}ms` }] : [];
  });
}

function validateEvalScores(fixture: ProbeFixture, expectations: ProbeExpectations): ProbeViolation[] {
  const min = expectations.minEvalScore;
  const violations: ProbeViolation[] = [];
  const validMin = min === undefined || isFiniteNumber(min);
  if (!validMin) {
    violations.push({ code: "EVAL_THRESHOLD_INVALID", message: "expectations.minEvalScore must be a finite number.", severity: "error", path: "expectations.minEvalScore", expected: "finite number", actual: min });
  }
  fixture.evals.forEach((event, index) => {
    if (!isJsonObject(event)) return;
    if (!isFiniteNumber(event.score)) {
      violations.push({ code: "EVAL_SCORE_INVALID", message: `evals[${index}].score must be a finite number.`, severity: "error", path: `evals[${index}].score`, expected: "finite number", actual: event.score });
      return;
    }
    if (event.threshold !== undefined && !isFiniteNumber(event.threshold)) {
      violations.push({ code: "EVAL_THRESHOLD_INVALID", message: `evals[${index}].threshold must be a finite number.`, severity: "error", path: `evals[${index}].threshold`, expected: "finite number", actual: event.threshold });
      return;
    }
    const threshold = event.threshold ?? (validMin ? min : undefined);
    const passed = typeof event.passed === "boolean" ? event.passed : threshold === undefined || event.score >= threshold;
    if (!passed) violations.push({ code: "EVAL_BELOW_THRESHOLD", message: `evals[${index}] score ${event.score} is below threshold ${threshold}.`, severity: "error", path: `evals[${index}].score`, expected: `>= ${threshold}`, actual: event.score });
  });
  return violations;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function timestampValue(value: string): number | undefined {
  const timestamp = new Date(value).valueOf();
  return Number.isNaN(timestamp) ? undefined : timestamp;
}
