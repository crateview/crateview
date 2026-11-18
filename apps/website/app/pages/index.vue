<script setup lang="ts">
import { docPath, getDocVersion, stableDocVersion } from '#shared/docs'
import { firstPwaRelease, hasPwaSupport, pwaGuideUrl } from '~/utils/pwa'
const { t } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig().public
const landing = useTemplateRef<HTMLElement>('landing')
let revealObserver: IntersectionObserver | undefined
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.IntersectionObserver)
    return
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-revealed')
        revealObserver?.unobserve(entry.target)
      }
    },
    { threshold: 0.08 },
  )
  landing.value?.querySelectorAll('.landing-reveal').forEach((section) => {
    revealObserver?.observe(section)
  })
})
onBeforeUnmount(() => revealObserver?.disconnect())
const installTab = ref('compose')
const command = computed(() => {
  const stable = getDocVersion(stableDocVersion)!
  const clone = `git clone https://github.com/crateview/crateview.git\ncd crateview\ngit checkout ${stable.release}`
  const app = stable.docsRevision === stable.revision ? '\ncd apps/registry-ui' : ''
  return installTab.value === 'compose'
    ? `${clone}${app}\nexport CRATEVIEW_VERSION=${stable.release}\ndocker compose pull\ndocker compose up -d`
    : `${clone}${app}\nnpm ci\nNUXT_REGISTRY_UPSTREAM=http://127.0.0.1:5000 npm run dev`
})
const features = [
  { key: 'Search', icon: 'i-lucide-search' },
  { key: 'Layers', icon: 'i-lucide-layers-3' },
  { key: 'Own', icon: 'i-lucide-palette' },
  { key: 'Auth', icon: 'i-lucide-key-round' },
  { key: 'Native', icon: 'i-lucide-boxes' },
  { key: 'Control', icon: 'i-lucide-shield-check' },
]
const stableRelease = getDocVersion(stableDocVersion)?.release
const pwaAvailable = hasPwaSupport(stableRelease)
const pwaGuide = computed(() =>
  pwaGuideUrl(stableRelease, localePath(docPath(stableDocVersion, 'installation'))),
)
const faqs = computed(() => [
  ...[1, 2, 3, 4].map((index) => ({ label: t(`faq${index}q`), content: t(`faq${index}a`) })),
  {
    label: t('faqPwaQuestion'),
    content:
      t(pwaAvailable ? 'faqPwaAvailable' : 'faqPwaUpcoming', { version: firstPwaRelease }) +
      ' ' +
      t('faqPwaDetails'),
  },
])
useHead(() => ({ title: t('heroA') + ' ' + t('heroB') }))
useSeoMeta({
  description: () => config.brandDescription || t('landingDescription'),
  ogTitle: () => `${config.brandName} — ${t('heroA')} ${t('heroB')}`,
  ogDescription: () => config.brandDescription || t('landingDescription'),
  ogType: 'website',
  ogImage: () => config.siteUrl + `/images/docs/${stableDocVersion}/image-dark.webp`,
})
</script>
<template>
  <div ref="landing" class="landing">
    <section class="landing-hero relative isolate overflow-hidden pb-20 pt-20 sm:pb-24 sm:pt-28">
      <div class="hero-grid pointer-events-none absolute inset-0" />
      <HeroRegistryNetwork />
      <div class="hero-content page-width relative text-center">
        <UBadge
          color="primary"
          variant="subtle"
          class="mb-8 rounded-full px-4 py-2 text-[10px] tracking-[0.13em]"
          >{{ t('badge') }}</UBadge
        >
        <h1 class="hero-title text-highlighted">
          {{ t('heroA') }}<br /><span class="text-primary">{{ t('heroB') }}</span>
        </h1>
        <p class="mx-auto mt-8 max-w-2xl text-base leading-8 text-muted sm:text-lg">
          {{ t('heroDescription') }}
        </p>
        <div class="mt-9 flex flex-wrap justify-center gap-3">
          <UButton
            :to="localePath(docPath(stableDocVersion, 'installation'))"
            trailing-icon="i-lucide-arrow-right"
            :ui="{ trailingIcon: 'rtl:rotate-180' }"
            size="xl"
            class="px-6"
            >{{ t('getStarted') }}</UButton
          ><UButton
            v-if="safeUrl(config.brandRepositoryUrl)"
            :to="safeUrl(config.brandRepositoryUrl)"
            target="_blank"
            icon="i-lucide-github"
            color="neutral"
            variant="outline"
            size="xl"
            class="px-6"
            >{{ t('github') }}</UButton
          >
        </div>
        <p class="mt-6 text-xs text-dimmed">{{ t('heroNote') }}</p>
        <div
          class="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-muted"
        >
          <span class="flex items-center gap-2"
            ><UIcon name="i-lucide-container" class="size-4" />Docker Registry</span
          ><span class="flex items-center gap-2"
            ><UIcon name="i-lucide-boxes" class="size-4" />OCI Distribution</span
          ><span class="flex items-center gap-2"
            ><UIcon name="i-lucide-layout-dashboard" class="size-4" />Nuxt UI</span
          >
        </div>
      </div>
    </section>
    <section class="landing-reveal page-width pb-24 sm:pb-32">
      <div class="mb-9 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p class="eyebrow mb-3">{{ t('previewLabel') }}</p>
          <h2 class="section-title max-w-2xl">{{ t('previewTitle') }}</h2>
        </div>
        <p class="max-w-md text-sm leading-7 text-muted">{{ t('previewDescription') }}</p>
      </div>
      <ProductPreview />
      <p class="mt-4 text-center text-[11px] text-dimmed">{{ t('screenshotNote') }}</p>
    </section>
    <section
      id="features"
      class="landing-reveal border-y border-default bg-muted/25 py-20 sm:py-28"
    >
      <div class="page-width">
        <p class="eyebrow mb-4">{{ t('featuresEyebrow') }}</p>
        <h2 class="section-title max-w-4xl">{{ t('featuresTitle') }}</h2>
        <div class="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="feature in features"
            :key="feature.key"
            class="feature-card rounded-2xl border border-default bg-default/60 p-6"
          >
            <div
              class="mb-5 flex size-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 text-primary"
            >
              <UIcon :name="feature.icon" class="size-5" />
            </div>
            <h3 class="text-base font-semibold tracking-tight text-highlighted">
              {{ t(`feature${feature.key}Title`) }}
            </h3>
            <p class="mt-3 text-sm leading-7 text-muted">{{ t(`feature${feature.key}Text`) }}</p>
          </div>
        </div>
      </div>
    </section>
    <section
      class="landing-reveal page-width grid grid-cols-1 items-center gap-12 py-24 lg:grid-cols-2 lg:gap-20 sm:py-32"
    >
      <div>
        <p class="eyebrow mb-4">{{ t('installEyebrow') }}</p>
        <h2 class="section-title">{{ t('installTitle') }}</h2>
        <p class="mt-6 max-w-md text-sm leading-7 text-muted">{{ t('installDescription') }}</p>
        <UButton
          :to="localePath(docPath(stableDocVersion, 'installation'))"
          variant="link"
          trailing-icon="i-lucide-arrow-right"
          :ui="{ trailingIcon: 'rtl:rotate-180' }"
          class="mt-5 p-0"
          >{{ t('readInstall') }}</UButton
        >
      </div>
      <div>
        <div class="mb-4 flex gap-2">
          <UButton
            v-for="tab in ['compose', 'existing']"
            :key="tab"
            :variant="installTab === tab ? 'soft' : 'ghost'"
            :color="installTab === tab ? 'primary' : 'neutral'"
            :aria-pressed="installTab === tab"
            @click="installTab = tab"
            >{{ t(tab) }}</UButton
          >
        </div>
        <CommandBlock :code="command" />
        <p class="mt-3 text-xs text-dimmed">{{ t('openLocal') }}</p>
        <aside
          data-testid="pwa-announcement"
          :aria-label="t('pwaTitle')"
          class="mt-6 rounded-xl border border-default bg-muted/30 p-5"
        >
          <h3 class="text-sm font-semibold text-highlighted">{{ t('pwaTitle') }}</h3>
          <p class="mt-2 text-sm leading-7 text-muted">
            {{ t(pwaAvailable ? 'pwaAvailable' : 'pwaUpcoming', { version: firstPwaRelease }) }}
          </p>
          <UButton
            :to="pwaGuide"
            :target="pwaAvailable ? undefined : '_blank'"
            variant="link"
            trailing-icon="i-lucide-arrow-right"
            :ui="{ trailingIcon: 'rtl:rotate-180' }"
            class="mt-2 p-0"
            >{{ t('pwaReadGuide') }}</UButton
          >
        </aside>
      </div>
    </section>
    <section class="landing-reveal page-width pb-24">
      <div
        class="flex flex-col gap-6 rounded-2xl border border-default bg-muted/30 p-8 sm:p-10 lg:flex-row lg:gap-12"
      >
        <UIcon name="i-lucide-scan-eye" class="size-9 shrink-0 text-primary" />
        <div>
          <h2 class="text-xl font-semibold tracking-tight">{{ t('honestTitle') }}</h2>
          <p class="mt-3 max-w-4xl text-sm leading-7 text-muted">{{ t('honestText') }}</p>
        </div>
      </div>
    </section>
    <section
      class="landing-reveal page-width grid grid-cols-1 gap-10 pb-24 lg:grid-cols-[1fr_1.4fr]"
    >
      <h2 class="section-title max-w-sm">{{ t('faqTitle') }}</h2>
      <UAccordion
        :items="faqs"
        :ui="{ trigger: 'text-base py-5', body: 'text-sm text-muted leading-7 pb-6' }"
      />
    </section>
    <section
      class="landing-reveal relative overflow-hidden border-t border-default bg-muted/25 py-20 sm:py-28"
    >
      <div
        class="page-width relative flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center"
      >
        <div>
          <h2 class="section-title max-w-2xl">{{ t('ctaTitle') }}</h2>
          <p class="mt-5 max-w-xl text-sm leading-7 text-muted">{{ t('ctaText') }}</p>
        </div>
        <UButton
          :to="localePath(docPath(stableDocVersion, 'installation'))"
          trailing-icon="i-lucide-arrow-right"
          :ui="{ trailingIcon: 'rtl:rotate-180' }"
          size="xl"
          class="shrink-0 px-6"
          >{{ t('getStarted') }}</UButton
        >
      </div>
    </section>
  </div>
</template>
