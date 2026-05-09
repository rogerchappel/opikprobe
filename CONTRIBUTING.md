# Contributing

Thanks for helping improve opikprobe.

## Local setup

```bash
npm install
npm run check
npm test
npm run smoke
```

## Development rules

- Keep the CLI local-first and deterministic.
- Do not add hidden network behavior.
- Add or update fixtures for every validation change.
- Prefer small, reviewable commits.
- Update README/docs when CLI flags or fixture shape changes.

## Pull request checklist

- [ ] Linked issue or clear motivation.
- [ ] Tests cover the behavior.
- [ ] `bash scripts/validate.sh` passes locally.
- [ ] Security/safety impact is described.

## Fixture guidance

Use stable timestamps and small JSON examples. Avoid real customer traces, secrets, tokens, or production telemetry exports.
