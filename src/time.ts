import { OpikProbeError } from "./errors.js";

const RFC3339_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/;

export function timestampValue(value: string): number | undefined {
  const match = RFC3339_TIMESTAMP.exec(value);
  if (match === null) return undefined;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const offsetHour = Number(offsetHourText ?? 0);
  const offsetMinute = Number(offsetMinuteText ?? 0);
  const daysInMonth = month >= 1 && month <= 12 ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 0;

  if (day < 1 || day > daysInMonth || hour > 23 || minute > 59 || second > 59 || offsetHour > 23 || offsetMinute > 59) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

export function parseIso(value: string, path: string): Date {
  const timestamp = timestampValue(value);
  if (timestamp === undefined) {
    throw new OpikProbeError(`Invalid ISO timestamp at ${path}: ${value}`, "INVALID_TIMESTAMP");
  }
  return new Date(timestamp);
}

export function durationMs(start: string, end: string, path: string): number {
  const started = parseIso(start, `${path}.start`);
  const ended = parseIso(end, `${path}.end`);
  return ended.valueOf() - started.valueOf();
}

export function stableGeneratedAt(): string {
  return "1970-01-01T00:00:00.000Z";
}
