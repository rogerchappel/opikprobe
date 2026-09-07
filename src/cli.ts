#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseArgs } from "./args.js";
import { asErrorMessage } from "./errors.js";
import { HELP } from "./help.js";
import { inspectFixture } from "./index.js";
import { renderJson, renderMarkdown } from "./render.js";
import { VERSION } from "./package-info.js";

export async function main(argv = process.argv.slice(2)): Promise<number> {
  try {
    const options = parseArgs(argv);
    if (options.command === "help") {
      process.stdout.write(HELP);
      return 0;
    }
    if (options.command === "version") {
      process.stdout.write(`${VERSION}\n`);
      return 0;
    }
    const request = options.output
      ? { inputPath: options.inputPath!, output: options.output, format: options.format, failOnViolation: options.failOnViolation }
      : { inputPath: options.inputPath!, format: options.format, failOnViolation: options.failOnViolation };
    const report = await inspectFixture(request);
    if (!options.output) process.stdout.write(options.format === "json" ? renderJson(report) : renderMarkdown(report));
    return !report.ok && options.failOnViolation ? 1 : 0;
  } catch (error) {
    process.stderr.write(`opikprobe: ${asErrorMessage(error)}\n`);
    return 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(realpathSync(invokedPath)).href) {
  process.exitCode = await main();
}
