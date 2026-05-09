import { readFile } from "node:fs/promises";
import { OpikProbeError, asErrorMessage } from "./errors.js";
import type { ProbeFixture } from "./types.js";

export async function loadFixture(filePath: string): Promise<ProbeFixture> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    throw new OpikProbeError(`Unable to read fixture ${filePath}: ${asErrorMessage(error)}`, "FIXTURE_READ_FAILED");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new OpikProbeError(`Invalid JSON in ${filePath}: ${asErrorMessage(error)}`, "FIXTURE_JSON_INVALID");
  }
  return coerceFixture(parsed, filePath);
}

function coerceFixture(value: unknown, filePath: string): ProbeFixture {
  if (!isObject(value)) throw new OpikProbeError(`Fixture ${filePath} must be a JSON object.`, "FIXTURE_SHAPE_INVALID");
  if (value.version !== 1) throw new OpikProbeError(`Fixture ${filePath} must declare version: 1.`, "FIXTURE_VERSION_INVALID");
  if (typeof value.name !== "string" || value.name.length === 0) throw new OpikProbeError(`Fixture ${filePath} needs a non-empty name.`, "FIXTURE_NAME_INVALID");
  for (const field of ["tools", "traces", "evals"] as const) {
    if (!Array.isArray(value[field])) throw new OpikProbeError(`Fixture ${filePath} field ${field} must be an array.`, "FIXTURE_SHAPE_INVALID");
  }
  return value as ProbeFixture;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
