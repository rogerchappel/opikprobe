export class OpikProbeError extends Error {
  constructor(message: string, readonly code = "OPIKPROBE_ERROR") {
    super(message);
    this.name = "OpikProbeError";
  }
}

export function asErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
