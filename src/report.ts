import type { ProbeFixture, ProbeReport, ProbeViolation } from "./types.js";
import { stableGeneratedAt } from "./time.js";

export function createReport(fixture: ProbeFixture, violations: ProbeViolation[], inputPath: string): ProbeReport {
  const errors = violations.filter((violation) => violation.severity === "error").length;
  return {
    ok: errors === 0,
    fixtureName: fixture.name,
    summary: {
      tools: fixture.tools.length,
      traces: fixture.traces.length,
      evals: fixture.evals.length,
      violations: errors,
      warnings: violations.filter((violation) => violation.severity === "warning").length
    },
    violations: sortViolations(violations),
    generatedAt: stableGeneratedAt(),
    inputPath
  };
}

export function sortViolations(violations: ProbeViolation[]): ProbeViolation[] {
  return [...violations].sort((a, b) => `${a.severity}:${a.path}:${a.code}`.localeCompare(`${b.severity}:${b.path}:${b.code}`));
}
