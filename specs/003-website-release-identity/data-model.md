# Data Model: Website Release Identity

- **Website build version**: A SemVer string from the website app's manifest at build time. The display value derives by adding `v` exactly once. Every route using the shared layout reads the same value. No application persistence or state transition.
- **Website image**: Each new runtime image has the monorepo URL as OCI source and retains revision metadata from the release flow. The image name and tag scheme stay unchanged.
- **GitHub package association**: The existing private `website` package changes repository source from `crateview/website` to `crateview/crateview`. The image tags, existing digests, visibility, and required grants do not change as a consequence of relinking. No new package is created.
