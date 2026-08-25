import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
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

for (const option of ["--output", "-o", "--format", "--fail-on-violation"]) {
  test(`${option} rejects a following option token without emitting a report`, async () => {
    const directory = await mkdtemp(join(tmpdir(), "opikprobe-cli-"));
    const output = join(directory, "report.json");
    const followingOption = option === "--output" || option === "-o" ? "--format=json" : `--output=${output}`;

    const result = spawnSync(process.execPath, [cliPath.pathname, "inspect", "fixtures/pass", option, followingOption], {
      encoding: "utf8"
    });

    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, `opikprobe: ${option} requires a value.\n`);
    assert.equal(existsSync(output), false);
    assert.equal(existsSync(join(process.cwd(), "--format=json")), false);
  });
}

for (const [format, extension, prefix] of [["json", ".json", "{"], ["markdown", ".md", "# "]] as const) {
  test(`writes ${format} to a matching ${extension} filename`, async () => {
    const directory = await mkdtemp(join(tmpdir(), "opikprobe-cli-"));
    const output = join(directory, `report${extension}`);

    const result = spawnSync(process.execPath, [cliPath.pathname, "inspect", "fixtures/pass", "--format", format, "--output", output], { encoding: "utf8" });

    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.match(readFileSync(output, "utf8"), new RegExp(`^${prefix.replace("{", "\\{")}`));
  });
}

for (const [format, extension, expectedExtension] of [["markdown", ".json", ".md"], ["json", ".md", ".json"]] as const) {
  test(`rejects ${format} with a mismatching ${extension} filename`, async () => {
    const directory = await mkdtemp(join(tmpdir(), "opikprobe-cli-"));
    const output = join(directory, `report${extension}`);

    const result = spawnSync(process.execPath, [cliPath.pathname, "inspect", "fixtures/pass", "--format", format, "--output", output], { encoding: "utf8" });

    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, `opikprobe: Output file extension ${extension} does not match --format ${format}; use ${expectedExtension}.\n`);
  });
}

test("writes the selected format into a generated filename for directory output", async () => {
  const output = await mkdtemp(join(tmpdir(), "opikprobe-cli-"));

  const result = spawnSync(process.execPath, [cliPath.pathname, "inspect", "fixtures/pass", "--format", "json", "--output", output], { encoding: "utf8" });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.doesNotThrow(() => JSON.parse(readFileSync(join(output, "opikprobe-report.json"), "utf8")));
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

for (const [format, collection] of [["json", "tools"], ["markdown", "traces"]] as const) {
  test(`invalid collection members preserve ${format} report output and exit semantics`, () => {
    const result = spawnSync(process.execPath, [cliPath.pathname, "inspect", `fixtures/fail/${collection}-member-invalid.json`, `--format=${format}`], {
      encoding: "utf8"
    });

    assert.equal(result.status, 1);
    assert.equal(result.stderr, "");
    assert.match(result.stdout, new RegExp(`FIXTURE_MEMBER_SHAPE_INVALID[\\s\\S]*${collection}\\[0\\]`));
  });
}

for (const format of ["json", "markdown"] as const) {
  test(`malformed members do not suppress independent findings in ${format} reports`, () => {
    const result = spawnSync(process.execPath, [cliPath.pathname, "inspect", "fixtures/fail/aggregate-invalid.json", `--format=${format}`], {
      encoding: "utf8"
    });

    assert.equal(result.status, 1);
    assert.equal(result.stderr, "");
    for (const [code, path] of [
      ["FIXTURE_MEMBER_SHAPE_INVALID", "tools[0]"],
      ["TIMESTAMP_INVALID", "traces[0].startTime"],
      ["TIMESTAMP_INVALID", "traces[0].endTime"]
    ] as const) {
      assert.match(result.stdout, new RegExp(code));
      assert.match(result.stdout, new RegExp(path.replaceAll("[", "\\[").replaceAll("]", "\\]")));
    }
  });
}

for (const format of ["json", "markdown"] as const) {
  test(`malformed expectations retain structured ${format} output and exit semantics`, () => {
    const result = spawnSync(process.execPath, [cliPath.pathname, "inspect", "fixtures/fail/expectations-invalid.json", `--format=${format}`], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.equal(result.stderr, "");
    assert.match(result.stdout, /EXPECTATION_INVALID/);
    assert.match(result.stdout, /expectations\.requiredTraceFields\[1\]/);
  });
}
