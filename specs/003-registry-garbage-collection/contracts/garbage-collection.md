# Contract: Registry Garbage Collection

## Browser-facing Nitro routes

Both routes require a valid managed registry session and exact operator allowlist match. Responses are private, `no-store`, and excluded from service-worker caching/fallback. The Settings panel uses GET; disabled and unauthorized users do not see the button. POST also uses the existing same-origin mutation guard.

- `GET /api/registry/garbage-collection`: `200` with `{ revision, run }` described in the [data model](../data-model.md).
- `POST /api/registry/garbage-collection`: strict JSON `{ revision }`; `202` with the admitted snapshot, including a `running` run. `202` means accepted, not completed. A `409` means no additional run was started; refresh status rather than resubmit.
- Failure mapping: `404` disabled or unsupported mode, `401` missing/invalid identity, `403` disallowed identity or origin, `400` invalid start body, `503` unavailable/misconfigured integration, `502` invalid provider reply, `504` provider timeout. After a submission begins, transport/protocol failures are treated as potentially accepted.

## Operator-provided job adapter

- Nitro sends GET and POST to a fixed `/garbage-collection` path on a privately configured HTTPS origin using a server-only bearer credential. Requests are bounded and do not follow redirects. The adapter is not contacted for unauthorized or malformed browser requests.
- GET returns the current or latest durable snapshot. POST accepts the same `revision` body. On admission the adapter atomically records a run and retires the revision before replying; rejected stale or active requests return `409`.
- The adapter validates that writes are blocked across all registry instances and write paths before collection and maintains that protection throughout. If it cannot guarantee protection, it reports failure without collecting. It coordinates restoration and reports success only after the configured job completes successfully.
- Nitro validates and projects provider replies to the documented shape. Runner error bodies, credentials, logs, URLs, and process output are not sent to the browser.

## UI behavior

The Settings panel identifies the action as registry-wide and warns that writes may be interrupted. Cancel sends no POST. Pending and active states disable starting; only status requests are repeated. A lost or malformed response is not success: keep start disabled until an authoritative new snapshot resolves the action or the operator verifies the outcome outside Crateview. Never retry a start automatically.
