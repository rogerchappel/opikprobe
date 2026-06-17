# opikprobe

Tiny local-first MCP observability probe for deterministic tracing and evaluation integration checks.

`opikprobe` reads a local JSON fixture describing MCP-like tool calls, trace spans, and eval events. It validates the fixture against practical telemetry expectations and emits a Markdown or JSON report. It does **not** call Opik, MCP servers, LLMs, or any network endpoint.

## Why

Agent and MCP integrations often claim tracing or evaluation is wired up, but the proof is hard to review. opikprobe gives maintainers a small fixture-based contract they can run in CI or during agent handoff before touching real telemetry systems.

## Install

```bash
npm install
npm run build
```

## Quickstart

```bash
npm run build
node dist/src/cli.js inspect fixtures/pass --output .tmp/pass
cat .tmp/pass/opikprobe-report.md
```

JSON output:

```bash
node dist/src/cli.js inspect fixtures/pass --format json
```

Expected failure demo:

```bash
node dist/src/cli.js inspect fixtures/fail --fail-on-violation=false
```

## Fixture shape

A fixture contains:

- `tools`: deterministic mock MCP tool calls.
- `traces`: emitted trace/span events.
- `evals`: evaluation metrics and scores.
- `expectations`: optional validation rules such as minimum eval score, required fields, and duration thresholds.

See [`fixtures/pass/probe.json`](fixtures/pass/probe.json) and [`fixtures/fail/probe.json`](fixtures/fail/probe.json).

## CLI

```bash
opikprobe inspect <fixture-path> [--output <dir-or-file>] [--format markdown|json]
```

Exit code is `1` when validation errors are found unless `--fail-on-violation=false` is set.

## Library

```ts
import { inspectFixture } from "opikprobe";

const report = await inspectFixture({ inputPath: "fixtures/pass", format: "json" });
console.log(report.ok);
```

## Safety

- Local files only.
- No hidden network.
- No credential lookup.
- No telemetry upload.
- Deterministic timestamps in generated reports.

## Attribution

This project was inspired by the existence of `test-opik-mcp` and the broader need for MCP/observability probes. It is a renamed, fresh implementation focused on local deterministic fixtures and does not copy source code or branding.

## Development

```bash
npm run check
npm test
npm run build
npm run smoke
bash scripts/validate.sh
```

## Release readiness

Run the same checks that CI uses before opening a release PR:

```sh
npm run release:readiness
npm run release:check
```

`release:readiness` validates repository metadata, the package files allowlist, package smoke coverage, and CI placeholder cleanup. `release:check` runs the project build, test, smoke, and package dry-run checks where configured.

## License

MIT
