<script setup lang="ts">
import DocsImage from '~/components/DocsImage.vue'
definePageMeta({ key: (route) => route.path })
const route = useRoute()
const { locale, t } = useI18n()
const { entries, collection, version } = useDocs()
if (!version.value) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
const config = useRuntimeConfig().public
const slug = computed(() => String(route.params.slug))
const path = computed(() => `/docs/${version.value!.id}/${slug.value}`)
const { data: page } = await useAsyncData(
  () => `doc-${locale.value}-${version.value!.id}-${slug.value}`,
  () => queryCollection(collection.value).path(path.value).first(),
  { watch: [locale, slug, version] },
)
if (!version.value?.slugs.includes(slug.value) || !page.value)
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
const index = computed(() => entries.value.findIndex((entry) => entry.slug === slug.value))
const neighbors = computed(() => ({
  previous: entries.value[index.value - 1],
  next: entries.value[index.value + 1],
}))
const section = computed(
  () => entries.value.find((entry) => entry.slug === slug.value)?.section || 'get-started',
)
const sectionEntries = computed(() =>
  entries.value.filter((entry) => entry.section === section.value),
)
const navigation = computed(() => [
  {
    title: t(section.value === 'get-started' ? 'gettingStarted' : 'guides'),
    path: sectionEntries.value[0]?.to || '',
    children: sectionEntries.value.map((entry) => ({ title: entry.title, path: entry.to })),
  },
])
const toc = computed(() => page.value?.body?.toc?.links || [])
const editUrl = computed(
  () =>
    `https://github.com/crateview/crateview/edit/main/docs/${locale.value}/docs/${version.value!.id}/${slug.value}.md`,
)
useHead(() => ({
  title: `${page.value?.title} · ${version.value!.id}`,
  meta: version.value?.status === 'preview' ? [{ name: 'robots', content: 'noindex, follow' }] : [],
}))
useSeoMeta({
  description: () => page.value?.description,
  ogTitle: () => `${page.value?.title} · ${config.brandName}`,
  ogDescription: () => page.value?.description,
  ogType: 'article',
})
</script>
<template>
  <div class="docs-page">
    <DocsToolbar :section="section" />
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
            :aria-label="t('docs')"
          />
        </div>
      </aside>
      <article class="docs-article pb-12">
        <UAlert
          v-if="version!.status !== 'stable'"
          :title="t(version!.status === 'preview' ? 'docsPreview' : 'docsArchived')"
          color="warning"
          variant="subtle"
          class="mb-5"
        />
        <UAlert
          v-if="route.query.missing"
          :title="t('docsPageMissing')"
          color="neutral"
          variant="subtle"
          class="mb-5"
        />
        <USelect
          :model-value="entries.find((entry) => entry.slug === slug)?.slug"
          :items="sectionEntries.map((entry) => ({ label: entry.title, value: entry.slug }))"
          :aria-label="t('docs')"
          class="mb-6 w-full lg:hidden"
          @update:model-value="navigateTo(entries.find((entry) => entry.slug === $event)!.to)"
        /><UPageHeader
          :title="page!.title"
          :description="page!.description"
          :ui="{ title: 'text-3xl sm:text-4xl tracking-tight', description: 'text-base leading-7' }"
        /><UPageBody
          ><ContentRenderer v-if="page" :value="page" :components="{ img: DocsImage }"
        /></UPageBody>
        <div class="mt-12 border-t border-default pt-6">
          <a
            :href="editUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 text-xs text-muted hover:text-primary"
            ><UIcon name="i-lucide-pencil" />{{ t('editPage') }}</a
          >
          <div class="mt-8 grid gap-4 sm:grid-cols-2">
            <NuxtLink
              v-if="neighbors.previous"
              :to="neighbors.previous.to"
              class="rounded-xl border border-default p-5 hover:border-primary/40"
              ><p class="mb-2 text-xs text-muted">{{ t('previous') }}</p>
              <span class="flex items-center gap-2 text-sm font-medium"
                ><UIcon name="i-lucide-arrow-left" class="rtl:rotate-180" />{{
                  neighbors.previous.title
                }}</span
              ></NuxtLink
            >
            <div v-else />
            <NuxtLink
              v-if="neighbors.next"
              :to="neighbors.next.to"
              class="rounded-xl border border-default p-5 text-end hover:border-primary/40"
              ><p class="mb-2 text-xs text-muted">{{ t('next') }}</p>
              <span class="flex items-center justify-end gap-2 text-sm font-medium"
                >{{ neighbors.next.title
                }}<UIcon name="i-lucide-arrow-right" class="rtl:rotate-180" /></span
            ></NuxtLink>
          </div>
        </div>
      </article>
      <aside class="hidden xl:block">
        <UContentToc
          highlight
          highlight-variant="circuit"
          :links="toc"
          :title="t('onThisPage')"
          class="sticky top-40"
        />
      </aside>
    </div>
  </div>
</template>
