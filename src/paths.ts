import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { OpikProbeError } from "./errors.js";

export async function findFixtureFile(inputPath: string): Promise<string> {
  const target = resolve(inputPath);
  const entries = await safeReaddir(target);
  if (!entries) return target;
  const preferred = ["probe.json", "fixture.json", "opikprobe.json"];
  for (const name of preferred) {
    if (entries.includes(name)) return join(target, name);
  }
  const jsonFiles = entries.filter((entry) => entry.endsWith(".json")).sort();
  if (jsonFiles.length === 1) return join(target, jsonFiles[0]!);
  if (jsonFiles.length > 1) {
    throw new OpikProbeError(`Multiple JSON files found in ${target}; use probe.json or pass a file path.`, "AMBIGUOUS_FIXTURE");
  }
  throw new OpikProbeError(`No probe.json fixture found in ${target}.`, "FIXTURE_NOT_FOUND");
}

async function safeReaddir(path: string): Promise<string[] | undefined> {
  try {
    return await readdir(path);
  } catch (error: unknown) {
    if (isNotDirectory(error)) return undefined;
    throw error;
  }
}

function isNotDirectory(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOTDIR";
}
