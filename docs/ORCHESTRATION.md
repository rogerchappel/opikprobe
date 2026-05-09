# Orchestration

opikprobe is intentionally single-process and local-first. Agents should treat it as a verification utility, not as a networked observer.

## Agent flow

1. Generate or copy a fixture into a working directory.
2. Run `opikprobe inspect <fixture-dir> --output <report-dir>`.
3. Read `opikprobe-report.md` or `opikprobe-report.json`.
4. Fix instrumentation gaps before claiming an integration is healthy.

## Ownership slices

- Fixture contract: schema conventions and examples.
- Probe engine: load, validate, and report deterministically.
- CLI UX: commands, flags, exit codes, and smoke tests.
- Documentation: safety, attribution, install, and examples.

## Safety boundaries

- No hidden network calls.
- No credential discovery.
- No telemetry upload.
- No background services.
- Outputs are deterministic for the same input fixture.

## Exit codes

- `0`: valid fixture or explicitly disabled fail-on-violation.
- `1`: CLI error, invalid fixture, or validation failure with default settings.
