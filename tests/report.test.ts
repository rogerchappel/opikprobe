import assert from "node:assert/strict";
import { test } from "node:test";
import { createReport, loadFixture, renderMarkdown, validateFixture } from "../src/index.js";

test("report generation is deterministic", async () => {
  const fixture = await loadFixture("fixtures/pass/probe.json");
  const report = createReport(fixture, validateFixture(fixture), "fixtures/pass/probe.json");
  assert.equal(report.generatedAt, "1970-01-01T00:00:00.000Z");
  assert.equal(report.ok, true);
  assert.equal(report.summary.tools, 1);
});

test("markdown report names status and counts", async () => {
  const fixture = await loadFixture("fixtures/fail/probe.json");
  const report = createReport(fixture, validateFixture(fixture), "fixtures/fail/probe.json");
  const markdown = renderMarkdown(report);
  assert.match(markdown, /Status: FAIL/);
  assert.match(markdown, /TOOL_TRACE_MISSING/);
});
