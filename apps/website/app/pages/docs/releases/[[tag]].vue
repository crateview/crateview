<script setup lang="ts">
definePageMeta({ key: (route) => route.path })
const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const config = useRuntimeConfig().public
const { data: releases, error: listError, refresh: refreshList } = await useFetch('/api/releases')
const tag = computed(() => String(route.params.tag || releases.value?.[0]?.tag || ''))
if (
  !listError.value &&
  route.params.tag &&
  !releases.value?.some((release) => release.tag === tag.value)
)
  throw createError({ statusCode: 404, statusMessage: 'Release not found' })
const {
  data: release,
  error: releaseError,
  refresh: refreshRelease,
} = await useAsyncData(
  () => `release-${tag.value}`,
  () =>
    tag.value ? $fetch(`/api/releases/${encodeURIComponent(tag.value)}`) : Promise.resolve(null),
  { watch: [tag] },
)
const navigation = computed(() => [
  {
    title: t('releases'),
    path: localePath('/docs/releases'),
    children: (releases.value || []).map((item) => ({
      title: item.tag,
      path: localePath(`/docs/releases/${item.tag}`),
      active: item.tag === tag.value,
    })),
  },
])
const failed = computed(() => !!listError.value || !!releaseError.value)
async function retry() {
  await refreshList()
  await refreshRelease()
}
useHead(() => ({ title: `${release.value?.tag || t('releases')} · ${t('releases')}` }))
useSeoMeta({
  description: () => t('releasesDescription'),
  ogTitle: () => `${release.value?.tag || t('releases')} · ${config.brandName}`,
})
</script>
<template>
  <div class="docs-page">
    <DocsToolbar section="releases" />
    <div
      class="page-width grid gap-10 py-8 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_190px]"
    >
      <aside class="hidden lg:block">
        <div class="sticky top-40 max-h-[calc(100dvh-10rem)] overflow-y-auto px-2.5 pt-1.5">
          <UContentNavigation
            :navigation="navigation"
            :collapsible="false"
            highlight
            variant="link"
            :aria-label="t('releases')"
          />
        </div>
      </aside>
      <article class="docs-article pb-12">
        <UPageHeader
          :title="release?.tag || t('releases')"
          :description="t('releasesDescription')"
          :ui="{ title: 'text-3xl sm:text-4xl tracking-tight', description: 'text-base leading-7' }"
        />
        <div v-if="failed" role="alert" class="mt-8 space-y-4">
          <UAlert :title="t('releasesFailed')" color="warning" variant="subtle" />
          <UButton @click="retry">{{ t('retry') }}</UButton>
        </div>
        <p v-else-if="!release" class="mt-8 text-muted">{{ t('releasesEmpty') }}</p>
        <template v-else>
          <USelect
            :model-value="tag"
            :items="(releases || []).map((item) => ({ label: item.tag, value: item.tag }))"
            :aria-label="t('releases')"
            class="mt-6 w-full lg:hidden"
            @update:model-value="navigateTo(localePath(`/docs/releases/${$event}`))"
          />
          <div class="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
            <time v-if="release.publishedAt" :datetime="release.publishedAt">{{
              new Date(release.publishedAt).toLocaleDateString(locale, {
                dateStyle: 'long',
                timeZone: 'UTC',
              })
            }}</time>
            <UButton
              :to="release.url"
              target="_blank"
              rel="noopener noreferrer"
              color="neutral"
              variant="outline"
              icon="i-lucide-github"
              >{{ t('github') }}</UButton
            >
          </div>
          <UPageBody><MDCRenderer :body="release.document.body" /></UPageBody>
        </template>
      </article>
      <aside class="hidden xl:block">
        <UContentToc
          v-if="release"
          :links="release.document.toc?.links || []"
          :title="t('onThisPage')"
          highlight
          highlight-variant="circuit"
          class="sticky top-40"
        />
      </aside>
    </div>
  </div>
</template>
