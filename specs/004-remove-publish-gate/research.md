# Research: Remove Release Publishing Gate

- **Decision**: Remove the switch entirely. **Rationale**: Maintainers selected automatic operation of version PRs, publishing, and docs promotion. **Alternative**: Separating PR creation from the switch would leave an unrequested publishing toggle.
- **Decision**: Retain current triggers, `main` restrictions, verification, PR names, and release streams. **Rationale**: They do not depend on the retired toggle. **Alternative**: A new workflow or shared changeset location would expand scope.
- **Decision**: Verify with test doubles rather than live dispatch. **Rationale**: Live runs can create branches, tags, releases, or images.
