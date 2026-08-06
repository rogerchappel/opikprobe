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

`score` must be a finite JSON number. When present, an eval's `threshold` must also be a finite JSON number.

## Expectations

`expectations` can set:

- `requiredTraceFields`
- `requiredToolFields`
- `requiredEvalFields`
- `minEvalScore`
- `requireTraceForEveryTool`
- `requireEvalForEveryTrace`
- `maxDurationMs`

`minEvalScore` must be a finite JSON number. Scores equal to their applicable threshold pass.
