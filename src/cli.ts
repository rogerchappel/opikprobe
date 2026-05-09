#!/usr/bin/env node
import { parseArgs } from "./args.js";
import { asErrorMessage } from "./errors.js";
import { HELP } from "./help.js";
import { inspectFixture } from "./index.js";
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
    const report = await inspectFixture({ inputPath: options.inputPath!, output: options.output, format: options.format, failOnViolation: options.failOnViolation });
    if (!options.output) process.stdout.write(options.format === "json" ? `${JSON.stringify(report, null, 2)}\n` : "");
    return !report.ok && options.failOnViolation ? 1 : 0;
  } catch (error) {
    process.stderr.write(`opikprobe: ${asErrorMessage(error)}\n`);
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = await main();
}
