# Data Model: Run Registry Garbage Collection

## Operator permission

- Authenticated username is taken from the revalidated managed account and must match the current session identity.
- Dedicated exact-match allowlist is server-only and empty by default. It conveys no other registry permission.
- A single private provider origin and credential pair binds the operation to the configured registry; the operator setup documents how to verify this pairing.

## Job status snapshot

- `revision`: opaque, bounded non-empty token representing the current provider state; cannot be reused after admission.
- `run`: `null` before the first run, otherwise `{ id, state }`. `id` is opaque and bounded; `state` is `running`, `succeeded`, or `failed`.
- State: no run → `running` → `succeeded` or `failed`; a new confirmed run gets a new ID. An admitted job waiting for prerequisites is `running` until its terminal outcome.
- The provider stores the active or latest run durably, owns the lock and write coordination, and applies admission to other launch paths using the same lock. The UI derives `unknown` from uncertainty or incompatibility; it is not a provider terminal state.

## Start request

- References the last observed `revision` and no execution parameters.
- The provider admits at most one request for an eligible revision and atomically replaces the revision when it admits a run. A stale or active revision cannot launch a second run.
- No user-controlled registry address, job ID, command, paths, credential, or free-form output is carried from the browser to the runner.
