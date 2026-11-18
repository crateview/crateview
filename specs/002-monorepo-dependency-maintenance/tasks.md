# Tasks: Monorepo Dependency Maintenance

- [ ] T001 Reconcile queued Dependabot PRs. Merge independent updates with current green CI; identify overlapping updates.
- [ ] T002 Fix scoped compatibility regressions and apply any remaining supported updates in `apps/website` or `apps/registry-ui`. Confirm reproducible installation and preserve behavior.
- [ ] T003 Run [validation](quickstart.md), merge only with green CI, then verify `main` and leave upstream-blocked findings open.

T001 determines the remaining dependency work for T002; T003 validates and delivers T002. Review current CI for every merged PR independently.
