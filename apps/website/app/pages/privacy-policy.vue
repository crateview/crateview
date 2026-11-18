<script setup lang="ts">
import { privacySectionKeys } from '~/utils/legal'

const { t } = useI18n()
const localePath = useLocalePath()
const sections = computed(() =>
  privacySectionKeys.map((section) => ({
    title: t(section.title),
    paragraphs: section.paragraphs.map((key) => t(key)),
  })),
)
useHead(() => ({ title: t('privacyPolicy') }))
</script>

<template>
  <article class="page-width max-w-3xl py-12 sm:py-16">
    <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">{{ t('privacyPolicy') }}</h1>
    <p class="mt-4 text-sm text-muted">
      {{ t('legalUpdated') }}
    </p>
    <div class="mt-8 space-y-8 text-muted">
      <section>
        <h2 class="mb-3 text-xl font-semibold text-highlighted">
          {{ t('legalController') }}
        </h2>
        <address class="not-italic leading-7">
          Tobias Wälde<br />Sandhübel 8<br />66640 Namborn<br />
          {{ t('legalCountry') }}<br />
          <a href="mailto:business@tobiaswaelde.com" class="text-primary"
            >business@tobiaswaelde.com</a
          >
        </address>
        <NuxtLink :to="localePath('/imprint')" class="mt-3 inline-block text-primary">{{
          t('imprint')
        }}</NuxtLink>
      </section>
      <section v-for="section in sections" :key="section.title">
        <h2 class="mb-3 text-xl font-semibold text-highlighted">{{ section.title }}</h2>
        <p v-for="paragraph in section.paragraphs" :key="paragraph" class="mt-3 leading-7">
          {{ paragraph }}
        </p>
      </section>
      <a
        href="https://www.netcup.com/de/kontakt/datenschutzerklaerung"
        class="inline-block text-primary"
        >{{ t('legalHostingPrivacy') }}</a
      >
    </div>
  </article>
</template>
