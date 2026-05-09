# Security policy

opikprobe is designed to be local-first:

- It reads explicit local fixture paths.
- It writes reports only when `--output` is provided.
- It does not perform network calls.
- It does not discover credentials or environment secrets.
- It does not upload telemetry.

## Reporting a vulnerability

Please open a private GitHub security advisory or contact the maintainer with:

- affected version or commit,
- reproduction steps,
- expected and actual behavior,
- whether local files or credentials could be exposed.

## Supported versions

The current `main` branch and latest tagged release receive security fixes.

## Threat model

Fixture JSON is untrusted input. opikprobe should parse it as data, avoid executing fixture content, and keep output paths explicit and reviewable.
