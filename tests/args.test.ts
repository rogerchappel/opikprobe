import assert from "node:assert/strict";
import { test } from "node:test";
import { parseArgs } from "../src/args.js";

test("parse inspect defaults", () => {
  assert.deepEqual(parseArgs(["inspect", "fixtures/pass"]), {
    command: "inspect",
    inputPath: "fixtures/pass",
    format: "markdown",
    failOnViolation: true
  });
});

test("parse inspect output and json format", () => {
  assert.deepEqual(parseArgs(["inspect", "fixtures/pass", "--output", "out", "--format=json", "--fail-on-violation=false"]), {
    command: "inspect",
    inputPath: "fixtures/pass",
    output: "out",
    format: "json",
    failOnViolation: false
  });
});
