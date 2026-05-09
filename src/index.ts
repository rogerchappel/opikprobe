import { findFixtureFile } from "./paths.js";
import { loadFixture } from "./load.js";
import { validateFixture } from "./validate.js";
import { createReport } from "./report.js";
import { writeReport } from "./write-report.js";
import type { InspectOptions, ProbeReport } from "./types.js";

export type { EvalEvent, InspectOptions, ProbeFixture, ProbeReport, ProbeToolCall, ProbeViolation, TraceEvent } from "./types.js";
export { loadFixture } from "./load.js";
export { validateFixture } from "./validate.js";
export { createReport } from "./report.js";
export { renderJson, renderMarkdown } from "./render.js";

export async function inspectFixture(options: InspectOptions): Promise<ProbeReport> {
  const filePath = await findFixtureFile(options.inputPath);
  const fixture = await loadFixture(filePath);
  const report = createReport(fixture, validateFixture(fixture), filePath);
  const rendered = await writeReport(report, options.output, options.format ?? "markdown");
  if (rendered) process.stdout.write(rendered);
  return report;
}
