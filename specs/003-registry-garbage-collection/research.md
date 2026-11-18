# Research: Run Registry Garbage Collection

## Execution ownership

**Decision**: Trigger an existing operator-owned job through a small start/status HTTP contract. The operator can adapt an existing job without installing another Crateview component.

**Rationale**: [Distribution](https://distribution.github.io/distribution/about/garbage-collection/) provides garbage collection through its executable, not the standard registry API. It warns that writes during mark-and-sweep can corrupt images. The job must coordinate all writers, not just Crateview requests.

**Alternatives**: Direct `/v2/` execution is unsupported. Shell or container access from Crateview creates an unnecessary privilege boundary. A trigger without status cannot prove that maintenance finished.

## Operator authorization

**Decision**: Reuse revalidated managed htpasswd/token identities with a separate explicit, no-wildcard operator allowlist and same-origin protection for writes.

**Rationale**: `server/utils/accounts.ts` already revalidates managed identities; `server/api/account/users.post.ts` establishes the browser write guard. Anonymous access, registry read, manifest deletion, and user management confer no GC permission. The default layout and managed-auth checks need a reachable registry authentication endpoint; the supported live status flow therefore uses write protection with authentication left online.

**Alternatives**: A UI-only gate is insufficient. Reusing a user-creation or deletion flag grants unrelated authority. Adding an independent login or changing the default layout's outage policy is out of scope.

## Surface and job admission

**Decision**: Use Settings, not the monitoring-dependent overview or tag table. Use provider-owned atomic admission tied to an opaque status revision. Refresh only status after an ambiguous submission.

**Rationale**: The operation is registry-wide and independent from monitoring. A tab-local pending flag or a Nitro process lock cannot serialize operators, instances, or external triggers. The revision also prevents a delayed repeat after a fast job has already finished.

**Alternatives**: An application-owned durable queue duplicates provider responsibilities. An automatic start retry can start maintenance after the operator believes it failed.
