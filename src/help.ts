export const HELP = `opikprobe

Local-first MCP telemetry fixture probe.

USAGE
  opikprobe inspect <fixture-path> [--output <dir-or-file>] [--format <markdown|json>] [--fail-on-violation <true|false>]

OPTIONS
  -o, --output <dir-or-file>       Write the report to a file or directory
  --format <markdown|json>         Select the report format (default: markdown)
  --fail-on-violation <true|false> Exit nonzero when validation fails (default: true)

  Long options also accept the --option=value form.

COMMANDS
  inspect   Validate a local deterministic fixture and emit an integration report
  help      Show this help
  version   Show package version

SAFETY
  opikprobe reads local JSON fixtures and writes local reports only. It performs no network calls.
`;
