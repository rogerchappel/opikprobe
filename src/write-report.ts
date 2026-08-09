import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { OpikProbeError } from "./errors.js";
import type { ProbeReport } from "./types.js";
import { renderJson, renderMarkdown } from "./render.js";

export async function writeReport(report: ProbeReport, output: string | undefined, format: "markdown" | "json"): Promise<string | undefined> {
  const body = format === "json" ? renderJson(report) : renderMarkdown(report);
  if (!output) return body;
  const expectedExtension = format === "json" ? ".json" : ".md";
  const extension = extname(output);
  if ((extension === ".json" || extension === ".md") && extension !== expectedExtension) {
    throw new OpikProbeError(`Output file extension ${extension} does not match --format ${format}; use ${expectedExtension}.`, "OUTPUT_FORMAT_MISMATCH");
  }
  const filename = extension === expectedExtension ? output : join(output, `opikprobe-report${expectedExtension}`);
  await mkdir(dirname(filename), { recursive: true });
  await writeFile(filename, body, "utf8");
  return undefined;
}
