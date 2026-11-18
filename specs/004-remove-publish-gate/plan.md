# Implementation Plan: Remove Release Publishing Gate

**Checkout**: Original checkout on linked branch `79-remove-release-publishing-gate`.\
**Date**: 2026-11-18\
**Spec**: [spec.md](spec.md)

## Summary

Remove the extra enablement switch from release and docs promotion without changing any other gates. Keep independent, manually merged version PRs and app-local changesets.

## Technical Context

GitHub Actions, the repository-pinned Node version, npm, and the built-in `node:test` runner. Release writes are tested with stub executables, not live credentials. Changesets remains app-local. No new dependencies or external interfaces.

## Constitution Check

The repository constitution is an unfilled template. No populated clauses apply. Follow existing workflow, test, formatting, and release conventions. Post-design: existing CI, serialization, branch checks, and artifact validation are unchanged.

## Project Structure

- `.github/workflows/release.yml` and `promote-docs.yml`: keep the `main` restrictions; remove variable conditions and forwarding.
- `scripts/release.mjs` and `release-plan.mjs`: remove the enabled input; preserve current-head checks, per-app PRs, eligibility, and verification.
- `scripts/*.test.mjs`: update planner assertions and add isolated workflow-script coverage for pending changesets on either or both apps.
- `docs/monorepo-migration.md`: remove obsolete switch instructions and explain current safeguards.

## Design and Validation

See [research](research.md), [state model](data-model.md), and [validation guide](quickstart.md). No external contract changes. Detect whether an empty changeset is appropriate under project policy; do not bump an app solely for release automation. Do not dispatch production workflows or modify hosted settings as part of validation.
