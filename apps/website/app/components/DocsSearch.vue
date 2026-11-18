<script setup lang="ts">
import { stableDocVersion } from '#shared/docs'
const open = defineModel<boolean>('open', { default: false })
const { t, locale } = useI18n()
const { entries, collection, version } = useDocs()
const localePath = useLocalePath()
const query = ref('')
const { data: sections } = await useAsyncData(
  () => 'docs-search-' + locale.value + '-' + (version.value?.id || stableDocVersion),
  () =>
    queryCollectionSearchSections(collection.value).where(
      'path',
      'LIKE',
      `/docs/${version.value?.id || stableDocVersion}/%`,
    ),
  { watch: [locale, version] },
)
const results = computed(() => {
  const term = query.value.trim().toLowerCase()
  if (!term)
    return entries.value.map((entry) => ({ id: entry.to, title: entry.title, content: '' }))
  return (sections.value || [])
    .filter((section) => (section.title + ' ' + section.content).toLowerCase().includes(term))
    .slice(0, 12)
    .map((section) => ({ ...section, id: localePath(section.id) }))
})
watch(open, (value) => {
  if (value) query.value = ''
})
</script>
<template>
  <UModal v-model:open="open" :title="t('searchLabel')" :description="t('searchHint')"
    ><template #body
      ><UInput
        v-model="query"
        icon="i-lucide-search"
        :placeholder="t('search')"
        :aria-label="t('searchLabel')"
        autofocus
        class="w-full"
      />
      <div class="mt-4 max-h-96 space-y-1 overflow-y-auto">
        <NuxtLink
          v-for="(result, index) in results"
          :key="result.id + index"
          :to="result.id"
          class="block rounded-lg px-4 py-3 hover:bg-muted focus:bg-muted"
          @click="open = false"
          ><div class="flex items-center gap-3 text-sm font-medium">
            <UIcon name="i-lucide-file-text" class="text-primary" />{{ result.title }}
          </div>
          <p v-if="result.content" class="mt-1 line-clamp-2 ps-7 text-xs leading-5 text-muted">
            {{ result.content.slice(0, 180) }}
          </p></NuxtLink
        >
        <p v-if="!results.length" class="p-8 text-center text-sm text-muted">
          {{ t('noResults') }}
        </p>
      </div></template
    ></UModal
  >
</template>
