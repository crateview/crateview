<script setup lang="ts">
defineProps<{ section: string }>()
const { t } = useI18n()
const { entries } = useDocs()
const localePath = useLocalePath()
const items = computed(() => [
  {
    label: t('getStarted'),
    icon: 'i-lucide-rocket',
    to: entries.value.find((entry) => entry.section === 'get-started')?.to,
    section: 'get-started',
  },
  {
    label: t('guides'),
    icon: 'i-lucide-book-open',
    to: entries.value.find((entry) => entry.section === 'guides')?.to,
    section: 'guides',
  },
  {
    label: t('releases'),
    icon: 'i-lucide-sparkles',
    to: localePath('/docs/releases'),
    section: 'releases',
  },
])
</script>
<template>
  <div
    class="docs-toolbar sticky top-20 z-30 border-b border-default bg-default/95 backdrop-blur-xl"
  >
    <div class="page-width flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <UNavigationMenu
        :items="items.map((item) => ({ ...item, active: item.section === section }))"
        :aria-label="t('docs')"
        variant="link"
        highlight
        class="min-w-0 max-w-full"
        :ui="{
          list: 'flex-wrap gap-x-3 gap-y-0 p-0',
          item: 'py-0',
          link: 'h-10 py-0 text-xs after:bottom-0',
          linkLeadingIcon: 'size-4',
          linkLabel: 'whitespace-nowrap',
        }"
      />
      <DocsVersionSwitch class="ms-auto" />
    </div>
  </div>
</template>
