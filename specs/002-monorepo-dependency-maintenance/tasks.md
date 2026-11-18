# Tasks: Monorepo Dependency Maintenance

- [x] T001 Reconcile queued Dependabot PRs. Merge independent updates with current green CI; identify overlapping updates.
- [x] T002 Fix scoped compatibility regressions and apply any remaining supported updates in `apps/website` or `apps/registry-ui`. Confirm reproducible installation and preserve behavior.
- [x] T003 Run [validation](quickstart.md), merge only with green CI, then verify `main` and leave upstream-blocked findings open.
- [x] T004 Harden both resolved picomatch major versions locally while the upstream fix is pending. Verify every locked copy and supported glob syntax locally.
- [ ] T005 Require green CI on the latest merge candidate and recheck Dependabot on `main`. Replace the local patch when a supported release is available; do not dismiss open alerts.

T001 determines the remaining dependency work for T002; T003 validates and delivers T002. Review current CI for every merged PR independently.
