# Crateview

Crateview is a web interface for Docker and OCI container registries.

- [Registry UI](apps/registry-ui/README.md): development, Compose deployment, and account management.
- [Product website and docs](https://crateview.de)
- [Coding guidelines](docs/coding-guidelines.md) · [Security](SECURITY.md)

## Develop the registry UI

Use the Node version in [`.nvmrc`](.nvmrc). From the repository root:

```sh
cd apps/registry-ui
npm ci
npm ci --prefix auth
npm run dev
```

See the [registry fixture instructions](apps/registry-ui/README.md#local-docker-registry-with-demo-images) for a local upstream.

Crateview is licensed under the [MIT License](LICENSE).
