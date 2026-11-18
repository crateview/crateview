<script setup lang="ts">
import { docPath, stableDocVersion } from '#shared/docs'
const { t } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig().public
const { websiteVersion } = useAppConfig()
const searchOpen = ref(false)
const menuOpen = ref(false)
const route = useRoute()
const docsLink = computed(() =>
  config.brandDocsUrl === '/docs/overview'
    ? localePath(docPath(stableDocVersion))
    : safeUrl(config.brandDocsUrl),
)
const links = computed(() =>
  [
    { label: t('features'), to: localePath('/') + '#features' },
    { label: t('docs'), to: docsLink.value },
  ].filter((link) => link.to),
)
watch(
  () => route.fullPath,
  () => (menuOpen.value = false),
)
function shortcut(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing || event.altKey) return
  const editable =
    event.target instanceof Element &&
    event.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])')
  if (
    ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') ||
    (!editable && !event.ctrlKey && !event.metaKey && event.key === '/')
  ) {
    event.preventDefault()
    searchOpen.value = true
  }
}
onMounted(() => window.addEventListener('keydown', shortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', shortcut))
</script>
<template>
  <div class="min-h-screen">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-default focus:p-4"
      >{{ t('skipContent') }}</a
    >
    <header class="sticky top-0 z-40 border-b border-default bg-default/90 backdrop-blur-xl">
      <div
        class="page-width flex h-20 items-center gap-2 sm:gap-6 lg:grid lg:grid-cols-[1fr_auto_1fr]"
      >
        <BrandMark />
        <nav
          class="hidden items-center justify-center gap-7 text-sm font-medium text-muted lg:flex lg:justify-self-center"
          :aria-label="t('navigation')"
        >
          <NuxtLink
            v-for="link in links"
            :key="link.label"
            :to="link.to"
            class="transition hover:text-highlighted"
            >{{ link.label }}</NuxtLink
          >
        </nav>
        <div class="ms-auto flex items-center gap-2 sm:gap-3 lg:justify-self-end">
          <UButton
            icon="i-lucide-search"
            color="neutral"
            variant="ghost"
            :aria-label="t('searchLabel')"
            @click="searchOpen = true"
          />
          <ModeSwitch />
          <LanguageSwitch /><UButton
            v-if="safeUrl(config.brandRepositoryUrl)"
            :to="safeUrl(config.brandRepositoryUrl)"
            icon="i-lucide-github"
            color="neutral"
            variant="ghost"
            target="_blank"
            aria-label="GitHub"
            class="hidden sm:flex"
          /><UButton
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            :aria-label="t('navigation')"
            class="lg:hidden"
            @click="menuOpen = true"
          />
        </div>
      </div>
    </header>
    <main id="main"><slot /></main>
    <footer class="border-t border-default bg-muted/25 py-12">
      <div class="page-width">
        <div class="flex flex-col justify-between gap-8 sm:flex-row">
          <div>
            <BrandMark />
            <p class="mt-4 max-w-xs text-sm leading-6 text-muted">{{ t('footerLine') }}</p>
          </div>
          <div class="grid grid-cols-2 gap-x-10 gap-y-3 text-sm">
            <NuxtLink
              :to="localePath(docPath(stableDocVersion, 'installation'))"
              class="text-muted hover:text-highlighted"
              >{{ t('getStarted') }}</NuxtLink
            >
            <a
              href="https://github.com/crateview/crateview/tree/main/docs"
              target="_blank"
              rel="noopener noreferrer"
              class="text-muted hover:text-highlighted"
              >{{ t('websiteSource') }}</a
            >
            <NuxtLink v-if="docsLink" :to="docsLink" class="text-muted hover:text-highlighted">{{
              t('docs')
            }}</NuxtLink>
            <a
              href="https://buymeacoffee.com/tobiaswaelde"
              target="_blank"
              rel="noopener noreferrer"
              class="text-muted hover:text-highlighted"
              >{{ t('support') }}</a
            >
            <a
              v-if="safeUrl(config.brandRepositoryUrl)"
              :href="safeUrl(config.brandRepositoryUrl)"
              target="_blank"
              rel="noopener noreferrer"
              class="text-muted hover:text-highlighted"
              >{{ t('sourceCode') }}</a
            >
            <a
              href="https://github.com/crateview/crateview/security/policy"
              target="_blank"
              rel="noopener noreferrer"
              class="text-muted hover:text-highlighted"
              >{{ t('security') }}</a
            >
            <NuxtLink :to="localePath('/imprint')" class="text-muted hover:text-highlighted">{{
              t('imprint')
            }}</NuxtLink>
            <NuxtLink
              :to="localePath('/privacy-policy')"
              class="text-muted hover:text-highlighted"
              >{{ t('privacyPolicy') }}</NuxtLink
            >
          </div>
        </div>
        <div class="mt-10 border-t border-default pt-6 text-xs text-dimmed">
          {{ t('builtWith') }}
          <a href="https://tobiaswaelde.com" class="ms-3 text-muted hover:text-highlighted"
            >{{ t('createdBy') }} Tobias Wälde</a
          >
          <a
            v-if="safeUrl(config.brandProductUrl)"
            :href="safeUrl(config.brandProductUrl)"
            class="ms-3 text-muted hover:text-highlighted"
            >{{ config.brandName }}</a
          >
          <bdi dir="ltr" class="ms-3 inline-block">v{{ websiteVersion }}</bdi>
        </div>
      </div>
    </footer>
    <DocsSearch v-model:open="searchOpen" /><UModal v-model:open="menuOpen" :title="t('navigation')"
      ><template #body
        ><div class="space-y-5">
          <NuxtLink
            v-for="link in links"
            :key="link.label"
            :to="link.to"
            class="block text-lg font-medium"
            @click="menuOpen = false"
            >{{ link.label }}</NuxtLink
          >
        </div></template
      ></UModal
    >
  </div>
</template>
