import assert from "node:assert/strict";
import { test } from "node:test";
import { parseArgs } from "../src/args.js";
import { OpikProbeError } from "../src/errors.js";

test("parse inspect defaults", () => {
  assert.deepEqual(parseArgs(["inspect", "fixtures/pass"]), {
    command: "inspect",
    inputPath: "fixtures/pass",
    format: "markdown",
    failOnViolation: true
  });
});

for (const option of ["--output=", "--format=", "--fail-on-violation="]) {
  test(`reject empty value for ${option}`, () => {
    assert.throws(
      () => parseArgs(["inspect", "fixtures/pass", option]),
      (error: unknown) => error instanceof OpikProbeError
        && error.code === "CLI_OPTION_VALUE_REQUIRED"
        && error.message === `${option.slice(0, -1)} requires a value.`
    );
  });
}

for (const option of ["--output", "-o", "--format", "--fail-on-violation"]) {
  test(`reject option token as separated value for ${option}`, () => {
    assert.throws(
      () => parseArgs(["inspect", "fixtures/pass", option, "--format=json"]),
      (error: unknown) => error instanceof OpikProbeError
        && error.code === "CLI_OPTION_VALUE_REQUIRED"
        && error.message === `${option} requires a value.`
    );
  });
}

test("parse inspect output and json format", () => {
  assert.deepEqual(parseArgs(["inspect", "fixtures/pass", "--output", "out", "--format=json", "--fail-on-violation=false"]), {
    command: "inspect",
    inputPath: "fixtures/pass",
    output: "out",
    format: "json",
    failOnViolation: false
  });
});

test("parse separated inspect option values", () => {
  assert.deepEqual(parseArgs(["inspect", "fixtures/pass", "-o", "out", "--format", "json", "--fail-on-violation", "false"]), {
    command: "inspect",
    inputPath: "fixtures/pass",
    output: "out",
    format: "json",
    failOnViolation: false
  });
});
