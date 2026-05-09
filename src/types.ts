export type Severity = "info" | "warning" | "error";

export interface ProbeFixture {
  version: 1;
  name: string;
  description?: string;
  tools: ProbeToolCall[];
  traces: TraceEvent[];
  evals: EvalEvent[];
  expectations?: ProbeExpectations;
}

export interface ProbeToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: "ok" | "error";
  startedAt: string;
  endedAt: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  metadata?: Record<string, unknown>;
}

export interface TraceEvent {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: "tool" | "chain" | "eval" | "agent";
  startTime: string;
  endTime: string;
  status: "ok" | "error";
  attributes: Record<string, unknown>;
}

export interface EvalEvent {
  id: string;
  traceId: string;
  metric: string;
  score: number;
  threshold?: number;
  passed?: boolean;
  comment?: string;
}

export interface ProbeExpectations {
  requiredTraceFields?: string[];
  requiredToolFields?: string[];
  requiredEvalFields?: string[];
  minEvalScore?: number;
  requireTraceForEveryTool?: boolean;
  requireEvalForEveryTrace?: boolean;
  maxDurationMs?: number;
}

export interface ProbeViolation {
  code: string;
  message: string;
  severity: Severity;
  path: string;
  expected?: unknown;
  actual?: unknown;
}

export interface ProbeReport {
  ok: boolean;
  fixtureName: string;
  summary: {
    tools: number;
    traces: number;
    evals: number;
    violations: number;
    warnings: number;
  };
  violations: ProbeViolation[];
  generatedAt: string;
  inputPath: string;
}

export interface InspectOptions {
  inputPath: string;
  output?: string;
  format?: "markdown" | "json";
  failOnViolation?: boolean;
}
