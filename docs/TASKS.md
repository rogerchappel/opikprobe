# opikprobe MVP tasks

## Done

- [x] Scaffold StackForge TypeScript OSS CLI.
- [x] Preserve source-idea attribution without copying implementation.
- [x] Define deterministic fixture schema for MCP-like tool calls, traces, and evals.
- [x] Implement local fixture loading with directory/file resolution.
- [x] Validate required telemetry fields and trace/eval relationships.
- [x] Render Markdown and JSON integration reports.
- [x] Provide pass/fail fixtures for demos and tests.
- [x] Add unit tests for validation, reporting, and CLI parsing.
- [x] Add local smoke command using bundled fixtures.
- [x] Document safety, contribution, examples, and orchestration.

## Deferred

- [ ] JSON Schema export for editor integration.
- [ ] Optional adapters for real Opik/OpenTelemetry exports.
- [ ] Snapshot fixtures for more MCP server shapes.
- [ ] Homebrew/npm release automation after manual review.

## Acceptance checks

- `npm run check`
- `npm test`
- `npm run build`
- `npm run smoke`
- `bash scripts/validate.sh`
- `node dist/src/cli.js inspect fixtures/pass --output .tmp/manual-smoke`
