# Temporary picomatch fork

Both apps install the local `@crateview/picomatch-hardened` artifacts in
place of the upstream v2 and v4 packages. They retain the existing import
paths and MIT licenses. The fork rejects repeated extglobs at compilation;
other glob syntax is unchanged. This applies before any lifecycle hook runs.

From the repository root, using the Node version in `.nvmrc`, run
`node scripts/build-hardened-picomatch.mjs` to regenerate both copies or add
`--check` to verify them. The generator verifies the original npm tarballs
against pinned SHA-512 digests and preserves the upstream package files
apart from the guard and fork metadata.

When refreshing a tarball, npm may resolve a relative override from the
transitive consumer. In that case temporarily set the two override values
to absolute `file:` paths in the owning app, run
`npm update picomatch --package-lock-only --ignore-scripts`, and restore the
manifest overrides to `file:vendor/...` before committing. The lockfile
must contain only the relative tarball paths.

Remove the overrides, artifacts, and temporary guard tests once supported
upstream versions are available. Verify a clean install and both application
test suites before removing them.
