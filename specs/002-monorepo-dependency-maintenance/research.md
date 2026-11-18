# Dependency Maintenance Decisions

- Keep the existing npm and Node versions. Use the published compatible patch lines without introducing dependency registries or widening runtime pins.
- Prefer the existing dependency PRs to manual lockfile changes. Consolidate identical updates rather than generating conflicting lockfiles.
- Keep the formatter upgrade if its only regression is style. Reformat only the files reported by the updated formatter and leave lint and CI rules unchanged.
- Leave findings without a supported fix open and recheck against the default branch.
