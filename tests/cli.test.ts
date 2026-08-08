import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { test } from "node:test";

const cliPath = new URL("../src/cli.js", import.meta.url);

test("help advertises every supported inspect option", () => {
  const output = execFileSync(process.execPath, [cliPath.pathname, "--help"], { encoding: "utf8" });

  assert.match(output, /--output <dir-or-file>/);
  assert.match(output, /--format <markdown\|json>/);
  assert.match(output, /--fail-on-violation <true\|false>/);
  assert.match(output, /--option=value/);
});

test("empty output value exits nonzero without emitting a report", () => {
  const result = spawnSync(process.execPath, [cliPath.pathname, "inspect", "fixtures/pass", "--output="], {
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "opikprobe: --output requires a value.\n");
});

test("invalid timestamps are rendered as a structured report", () => {
  const result = spawnSync(process.execPath, [cliPath.pathname, "inspect", "fixtures/fail/timestamp-invalid.json", "--format=json"], {
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.equal(result.stderr, "");
  const report = JSON.parse(result.stdout) as { ok: boolean; violations: Array<{ code: string; path: string }> };
  assert.equal(report.ok, false);
  assert.deepEqual(report.violations.map(({ code, path }) => ({ code, path })), [
    { code: "TIMESTAMP_INVALID", path: "tools[0].endedAt" },
    { code: "TIMESTAMP_INVALID", path: "tools[0].startedAt" },
    { code: "TIMESTAMP_INVALID", path: "traces[0].endTime" },
    { code: "TIMESTAMP_INVALID", path: "traces[0].startTime" }
  ]);
});
