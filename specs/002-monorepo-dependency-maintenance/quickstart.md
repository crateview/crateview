# Validation

Use Node 26.13.1. In a clean checkout, run:

```sh
npm run setup
npm run check
npm test
npm run build
```

Confirm GitHub CI passes for both apps and the `checks` gate on the current merge candidate. Review resolved lockfile versions, npm audit output, and the GitHub dependency graph on `main` after merge.
