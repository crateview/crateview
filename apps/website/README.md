# Crateview website

Run the root `npm run setup`, then `npm run dev:website` from the repository root. The app reads product content from root `docs/`.

## Containers

From the repository root, build the local website image with:

```sh
docker compose -f apps/website/compose.yaml -f apps/website/compose.build.yaml build
```

The build uses the repository-root context for the website and docs sources. The local Compose example binds port `3002` on loopback. The private website image is published to `ghcr.io/crateview/website`.
