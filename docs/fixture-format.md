# Fixture format

opikprobe fixtures are JSON files with `version: 1`.

## Required top-level fields

- `name`: human-readable fixture name.
- `tools`: array of mock MCP tool calls.
- `traces`: array of trace/span events.
- `evals`: array of evaluation events.

## Tool fields

- `id`
- `name`
- `input`
- `status`
- `startedAt`
- `endedAt`
- `traceId`
- `spanId`

`startedAt` and `endedAt` must be ISO timestamps, and `endedAt` must be equal to or later than `startedAt`. Zero-duration tool calls are valid.

## Trace fields

- `traceId`
- `spanId`
- `name`
- `kind`
- `startTime`
- `endTime`
- `status`
- `attributes`

`startTime` and `endTime` must be ISO timestamps, and `endTime` must be equal to or later than `startTime`. Zero-duration traces are valid.

## Eval fields

- `id`
- `traceId`
- `metric`
- `score`

`score` must be a finite JSON number. When present, an eval's `threshold` must also be a finite JSON number. An eval may include a boolean `passed` field.

## Expectations

`expectations` can set:

- `requiredTraceFields`
- `requiredToolFields`
- `requiredEvalFields`
- `minEvalScore`
- `requireTraceForEveryTool`
- `requireEvalForEveryTrace`
- `maxDurationMs`

The three `required*Fields` values must be arrays of non-empty field-path strings. Paths use dot-separated object keys (for example, `metadata.model`). The two `require*` flags must be JSON booleans.

`minEvalScore` must be a finite JSON number from `0` to `1`, inclusive. An eval's own `threshold` takes precedence over `minEvalScore`. Scores equal to their applicable threshold pass, and scores below it fail even when `passed` is `true`. When the score satisfies its threshold (or no numeric threshold applies), `passed: false` still records an explicit failure. `maxDurationMs` must be a finite, non-negative JSON number; zero is valid.

Malformed expectation values are reported as `EXPECTATION_INVALID` violations at the exact property or array-member path. They are included in both JSON and Markdown reports and follow the normal `--fail-on-violation` exit behavior instead of terminating inspection with an unstructured runtime error.
