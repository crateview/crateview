# Crateview

Crateview is a web interface for Docker and OCI container registries.

- [Registry UI](apps/registry-ui/README.md): development, Compose deployment, and account management.
- [Website source](apps/website/) and [versioned docs source](docs/README.md).
- [Product website and docs](https://crateview.de)
- [Coding guidelines](docs/coding-guidelines.md) · [Security](SECURITY.md)

## Develop both apps

Use the Node version in [`.nvmrc`](.nvmrc). From the repository root:

```sh
npm run setup
npm run check
npm test
npm run build
```

Run `npm run dev:registry-ui` or `npm run dev:website` in separate terminals. The defaults are `http://127.0.0.1:3000` and `http://127.0.0.1:3002`, respectively. Run individual scripts with `npm --prefix apps/<app> run <script>`. No submodule checkout or root dependency install is required.

See the [registry fixture instructions](apps/registry-ui/README.md#local-docker-registry-with-demo-images) for a local upstream.

Crateview is licensed under the [MIT License](LICENSE).
