# Changesets

Run `npm run changeset` from the repository root and select only the affected apps. Commit the generated Markdown file. The release workflow maintains one `Version Packages` PR; merging it lets the existing container release workflow publish the affected apps separately. These packages are not published to npm.
