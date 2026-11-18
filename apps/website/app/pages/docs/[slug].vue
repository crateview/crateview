<script setup lang="ts">
import { docPath, getDocVersion, stableDocVersion } from '#shared/docs'
const route = useRoute()
const slug = String(route.params.slug)
const localePath = useLocalePath()
const isVersion = getDocVersion(slug)
if (!isVersion && !getDocVersion(stableDocVersion)!.slugs.includes(slug))
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
await navigateTo(
  {
    path: localePath(docPath(isVersion ? slug : stableDocVersion, isVersion ? 'overview' : slug)),
    query: route.query,
    hash: route.hash,
  },
  { redirectCode: 302 },
)
</script>
<template><div /></template>
