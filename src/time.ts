import { OpikProbeError } from "./errors.js";

export function parseIso(value: string, path: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    throw new OpikProbeError(`Invalid ISO timestamp at ${path}: ${value}`, "INVALID_TIMESTAMP");
  }
  return date;
}

export function durationMs(start: string, end: string, path: string): number {
  const started = parseIso(start, `${path}.start`);
  const ended = parseIso(end, `${path}.end`);
  return ended.valueOf() - started.valueOf();
}

export function stableGeneratedAt(): string {
  return "1970-01-01T00:00:00.000Z";
}
