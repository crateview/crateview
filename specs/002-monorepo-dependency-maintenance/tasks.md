# Tasks: Monorepo Dependency Maintenance

- [x] T001 Reconcile queued Dependabot PRs. Merge independent updates with current green CI; identify overlapping updates.
- [x] T002 Fix scoped compatibility regressions and apply any remaining supported updates in `apps/website` or `apps/registry-ui`. Confirm reproducible installation and preserve behavior.
- [x] T003 Run [validation](quickstart.md), merge only with green CI, then verify `main` and leave upstream-blocked findings open.
- [x] T004 Harden both resolved picomatch major versions locally while the upstream fix is pending. Verify every locked copy and supported glob syntax locally.
- [x] T005 Verify the local patch on `main`. Version-based checks still report the original npm artifacts.
- [ ] T006 Replace those artifacts with reproducible, first-party hardened packages for both npm dependency trees. Verify clean installs without lifecycle scripts, glob compatibility, application CI, and the security dashboard on `main`.

T001 determines the remaining dependency work for T002; T003 validates and delivers T002. Review current CI for every merged PR independently.
