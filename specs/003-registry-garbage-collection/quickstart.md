# Validation Guide: Run Registry Garbage Collection

## Prerequisites

After implementation, use the Node.js version in `.nvmrc` and a disposable Crateview/Distribution fixture with managed authentication. Configure one allowed operator, one ordinary user, and an authenticated job adapter implementing the [contract](contracts/garbage-collection.md). Use isolated synthetic storage and credentials. Do not point tests at a production registry or job.

From `apps/registry-ui`:

```sh
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:auth
npm run build
```

Run `npm run test:e2e -- garbage-collection.spec.ts` against the configured local UI fixtures after that suite is added.

## Acceptance Scenarios

1. **Default off and access**: No maintenance control for disabled, unauthenticated, or non-operator sessions. Direct calls do not reach the provider. Allow an authenticated operator; verify runtime responses and same-origin enforcement.
2. **Confirmation and completion**: Cancel without starting. Confirm once, observe active status, reload, and observe the eventual result. Exercise keyboard confirmation/focus and narrow/wide layout in English and German; verify keys across all supported locale dictionaries.
3. **Concurrency and uncertainty**: Send simultaneous starts with the same revision, including across server instances sharing one fake provider; one run at most. Drop the acceptance response, simulate malformed status and a failed run, and verify no automatic resubmission, stale cache, or misleading success.
4. **Write safety and storage**: On disposable registry storage, verify the job refuses collection when it cannot block writes and preserves referenced content when it can. Confirm write access is restored according to the job policy. Separately verify the UI status path stays usable when writes are blocked and authentication remains online. A mock adapter does not prove real registry write protection.

Record mocked browser evidence, real HTTP contract evidence, and real disposable registry/job evidence separately. Do not claim unrun coverage.
