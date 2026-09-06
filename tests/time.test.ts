import assert from "node:assert/strict";
import { test } from "node:test";
import { parseIso } from "../src/time.js";

test("parseIso accepts complete RFC3339 timestamps", () => {
  for (const value of [
    "2020-01-01T00:00:00Z",
    "2020-01-01T00:00:00.123456Z",
    "2020-01-01T10:30:00+10:30",
    "2020-01-01T00:00:00-04:00"
  ]) {
    assert.doesNotThrow(() => parseIso(value, "trace.startTime"));
  }
});

test("parseIso rejects incomplete, locale-dependent, and impossible timestamps", () => {
  for (const value of [
    "01/02/2020",
    "2020-01-01",
    "2020-01-01 00:00:00",
    "2020-01-01T00:00:00",
    "2020-02-30T00:00:00Z"
  ]) {
    assert.throws(
      () => parseIso(value, "trace.startTime"),
      (error: unknown) => error instanceof Error
        && error.message === `Invalid ISO timestamp at trace.startTime: ${value}`
        && "code" in error
        && error.code === "INVALID_TIMESTAMP"
    );
  }
});
