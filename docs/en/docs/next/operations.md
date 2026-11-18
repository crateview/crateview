---
title: 'Operations & deletion'
description: 'Manage manifests carefully and keep registry storage under your control.'
---

## Enable manifest deletion

Deletion is disabled in the Crateview UI by default. Both the frontend and Distribution must allow it:

```dotenv
NUXT_REGISTRY_DELETE_ENABLED=true
```

```yaml
storage:
  delete:
    enabled: true
```

Distribution can also read `REGISTRY_STORAGE_DELETE_ENABLED=true`. Restart the relevant services after changing their environment or configuration. The registry remains responsible for authorization, including requests made directly through `/v2/**`.

## Understand digest deletion

The standard delete operation targets a **manifest digest**. Every tag pointing to that digest can be removed. Crateview previews the affected tags before confirmation, but a concurrent writer can change references after the preview: the registry API does not provide a transaction that locks aliases.

Treat a deletion as a change to the manifest and all its aliases, not as removal of one label. Verify your backups and intended scope before confirming.


Select one or more tags in the repository table and confirm deletion. The preview refreshes affected tags, shared digests are deleted once, and partial failures are reported. All aliases of a deleted digest are affected. Garbage collection remains a separate registry task.

## Garbage collection and backups

Deleting a manifest does not promise immediate disk reclamation. Garbage collection is a separate registry administration task. Crateview can request it from a pre-existing maintenance job; it does not run the collector itself.

Keep the integration disabled unless the job targets the same registry as Crateview, exposes protected start and status operations, prevents concurrent runs, and blocks all registry writes throughout collection. Keep registry authentication reachable if operators need live status. If the registry is stopped, status recovery waits until it returns.

The start API acknowledges job acceptance, not completion. Read the job status after a conflict or an uncertain response instead of resubmitting. The adapter must retain authoritative status and must refuse to collect if write protection cannot be established.

Set `NUXT_REGISTRY_GARBAGE_COLLECTION_ENABLED=true`, set `NUXT_REGISTRY_GARBAGE_COLLECTION_ALLOWED_USERS` to the exact managed usernames allowed to run it, and configure `NUXT_REGISTRY_GARBAGE_COLLECTION_ORIGIN` and `NUXT_REGISTRY_GARBAGE_COLLECTION_TOKEN` on the Crateview server. The adapter must implement the [start/status contract](https://github.com/crateview/crateview/blob/main/specs/003-registry-garbage-collection/contracts/garbage-collection.md). Do not put the adapter token in browser configuration.

Sign in as an allowed operator, open **Settings**, and select **Run garbage collection**. Confirm only when the maintenance window allows it. The card shows when the job is running, completed, failed, or its status is unknown. If Crateview cannot verify the result, check the maintenance job directly before starting again.

Back up your registry storage and its configuration using a method appropriate to the storage driver. Keep volumes when replacing containers. Follow Distribution's instructions for garbage collection and write coordination:

- [Distribution garbage collection](https://distribution.github.io/distribution/about/garbage-collection/)
- [Distribution configuration](https://distribution.github.io/distribution/about/configuration/)

## Update Crateview

<!-- release:operations:start -->
Preview containers must first be built locally from the pinned source revision; no released preview image is implied.

```sh
git clone https://github.com/crateview/registry-ui.git
cd registry-ui
git checkout 9954f9c33e34c65bab19378a9b488e9b8ed13b6d
docker compose -f compose.yaml -f compose.build.yaml up --build -d
```
<!-- release:operations:end -->

## Large registries

Repository search reads the complete paginated catalog. Metadata for visible repositories is fetched on demand. Sorting a large tag list by image creation time can require reading many manifests and configs. Crateview has no background metadata index or external search service.
