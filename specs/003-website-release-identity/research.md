# Research: Website Release Identity

## Footer value

- **Decision**: Use the `version` field of `apps/website/package.json` as a build-time value; render it in the shared layout as plain text prefixed with `v`.
- **Rationale**: Repovio displays a plain footer version. The monorepo releases the website independently, and the website Docker build already reads the manifest from the exact build source. Build-time config covers SSR and hydration without a network call.
- **Alternatives considered**: Documentation version, registry UI release version, Git SHA, manually maintained text, and a runtime environment variable. None reliably identifies the website release without coupling or a second source of truth.

## Existing package association

- **Decision**: Add canonical OCI source metadata for new builds; separately relink the existing package using GitHub Package settings under the agreed access constraints.
- **Rationale**: GitHub currently reports `ghcr.io/crateview/website` as private and connected to `crateview/website`. Its [documented migration procedure](https://docs.github.com/en/packages/learn-github-packages/connecting-a-repository-to-a-package#migrating-a-package-to-another-repository) is to unlink and reconnect. A source label by itself is not evidence that GitHub migrated an already linked package.
- **Access caveat**: A [previous monorepo workflow](https://github.com/crateview/crateview/actions/runs/44233666755) received `403` against the package despite requesting `packages: write`. GitHub distinguishes [Actions access and fork exposure](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility#ensuring-workflow-access-to-your-package) from source association. Record current grants before relinking; do not widen them as a side effect.
- **Alternatives considered**: Publishing another image name, making the image public, or adding a one-off release job. These add risk, do not achieve a private in-place reassociation, or duplicate existing release automation.

## Evidence boundaries

- **Decision**: Prove rendering and image metadata in local production artifacts, then separately verify hosted package state and permissions.
- **Rationale**: The main release workflow already builds the website from the monorepo when publishing is enabled. Local builds cannot prove GitHub repository association; GitHub metadata alone cannot prove the running website's footer or deployment pull access.
- **Alternatives considered**: Treating a successful PR build or push as proof of package visibility. Neither establishes the actual hosted listing under the requested repository.
