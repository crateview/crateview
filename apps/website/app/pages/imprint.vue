<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
useHead(() => ({ title: t('imprint') }))
</script>

<template>
  <article class="page-width max-w-3xl py-12 sm:py-16">
    <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">{{ t('imprint') }}</h1>
    <div class="mt-8 space-y-8 text-muted [&_a]:text-primary [&_h2]:text-highlighted">
      <section>
        <h2 class="mb-3 text-xl font-semibold">
          {{ t('legalProvider') }}
        </h2>
        <address class="not-italic leading-7">
          Tobias Wälde<br />Sandhübel 8<br />66640 Namborn<br />
          {{ t('legalCountry') }}
        </address>
      </section>
      <section>
        <h2 class="mb-3 text-xl font-semibold">{{ t('legalContact') }}</h2>
        <p class="leading-7">
          {{ t('legalPhone') }}: <a href="tel:+4917656799893">+49 176 56799893</a><br />
          {{ t('legalEmail') }}:
          <a href="mailto:business@tobiaswaelde.com">business@tobiaswaelde.com</a><br />
          {{ t('legalWebsite') }}: <a href="https://tobiaswaelde.com">tobiaswaelde.com</a>
        </p>
      </section>
      <NuxtLink :to="localePath('/privacy-policy')" class="inline-block">{{
        t('privacyPolicy')
      }}</NuxtLink>
    </div>
  </article>
</template>
