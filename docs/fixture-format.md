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

## Trace fields

- `traceId`
- `spanId`
- `name`
- `kind`
- `startTime`
- `endTime`
- `status`
- `attributes`

## Eval fields

- `id`
- `traceId`
- `metric`
- `score`

## Expectations

`expectations` can set:

- `requiredTraceFields`
- `requiredToolFields`
- `requiredEvalFields`
- `minEvalScore`
- `requireTraceForEveryTool`
- `requireEvalForEveryTrace`
- `maxDurationMs`
