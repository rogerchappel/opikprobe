import { OpikProbeError } from "./errors.js";

export interface CliOptions {
  command: "inspect" | "help" | "version";
  inputPath?: string;
  output?: string;
  format: "markdown" | "json";
  failOnViolation: boolean;
}

export function parseArgs(argv: string[]): CliOptions {
  const [command = "help", ...rest] = argv;
  if (command === "--help" || command === "-h" || command === "help") return { command: "help", format: "markdown", failOnViolation: true };
  if (command === "--version" || command === "version") return { command: "version", format: "markdown", failOnViolation: true };
  if (command !== "inspect") throw new OpikProbeError(`Unknown command: ${command}`, "CLI_UNKNOWN_COMMAND");

  const options: CliOptions = { command: "inspect", format: "markdown", failOnViolation: true };
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index]!;
    if (arg === "--output" || arg === "-o") options.output = takeValue(rest, ++index, arg);
    else if (arg === "--format") options.format = parseFormat(takeValue(rest, ++index, arg));
    else if (arg === "--fail-on-violation") options.failOnViolation = parseBoolean(takeValue(rest, ++index, arg));
    else if (arg.startsWith("--fail-on-violation=")) options.failOnViolation = parseBoolean(arg.split("=")[1] ?? "true");
    else if (arg.startsWith("--format=")) options.format = parseFormat(arg.split("=")[1] ?? "");
    else if (arg.startsWith("--output=")) options.output = arg.slice("--output=".length);
    else if (arg.startsWith("-")) throw new OpikProbeError(`Unknown option: ${arg}`, "CLI_UNKNOWN_OPTION");
    else if (!options.inputPath) options.inputPath = arg;
    else throw new OpikProbeError(`Unexpected argument: ${arg}`, "CLI_UNEXPECTED_ARGUMENT");
  }
  if (!options.inputPath) throw new OpikProbeError("Usage: opikprobe inspect <fixture-path>", "CLI_INPUT_REQUIRED");
  return options;
}

function takeValue(values: string[], index: number, flag: string): string {
  const value = values[index];
  if (!value) throw new OpikProbeError(`${flag} requires a value.`, "CLI_OPTION_VALUE_REQUIRED");
  return value;
}

function parseFormat(value: string): "markdown" | "json" {
  if (value === "markdown" || value === "json") return value;
  throw new OpikProbeError(`Unsupported format: ${value}`, "CLI_FORMAT_INVALID");
}

function parseBoolean(value: string): boolean {
  if (["1", "true", "yes"].includes(value)) return true;
  if (["0", "false", "no"].includes(value)) return false;
  throw new OpikProbeError(`Invalid boolean: ${value}`, "CLI_BOOLEAN_INVALID");
}
