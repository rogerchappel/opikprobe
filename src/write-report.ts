import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ProbeReport } from "./types.js";
import { renderJson, renderMarkdown } from "./render.js";

export async function writeReport(report: ProbeReport, output: string | undefined, format: "markdown" | "json"): Promise<string | undefined> {
  const body = format === "json" ? renderJson(report) : renderMarkdown(report);
  if (!output) return body;
  const filename = output.endsWith(".json") || output.endsWith(".md") ? output : join(output, `opikprobe-report.${format === "json" ? "json" : "md"}`);
  await mkdir(dirname(filename), { recursive: true });
  await writeFile(filename, body, "utf8");
  return undefined;
}
