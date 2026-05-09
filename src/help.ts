export const HELP = `opikprobe

Local-first MCP telemetry fixture probe.

USAGE
  opikprobe inspect <fixture-path> [--output <dir-or-file>] [--format markdown|json]

COMMANDS
  inspect   Validate a local deterministic fixture and emit an integration report
  help      Show this help
  version   Show package version

SAFETY
  opikprobe reads local JSON fixtures and writes local reports only. It performs no network calls.
`;
