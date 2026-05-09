# Exit codes

| Code | Meaning |
| ---: | --- |
| 0 | Command succeeded. For `inspect`, no validation errors were found or `--fail-on-violation=false` was set. |
| 1 | Invalid command, invalid fixture, read/write failure, or validation errors with default fail-on-violation behavior. |

Warnings do not fail the CLI unless they are accompanied by an error-level violation.
