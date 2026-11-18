# Crateview website

Run the root `npm run setup`, then `npm run dev:website` from the repository root. The app reads product content from root `docs/`.

## Containers

From the repository root, build the local website image with:

```sh
docker compose -f apps/website/compose.yaml -f apps/website/compose.build.yaml build
```

The build uses the repository-root context for the approved website and docs sources. For image-based deploys, keep using `ghcr.io/crateview/website` with the existing runtime environment variables and container port `3000`. The repository's local Compose example binds port `3002` on loopback. The production reverse proxy and credentials are managed separately; do not copy that configuration into the public repo.
