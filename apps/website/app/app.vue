<script setup lang="ts">
import { getLocale, supportedLocales, localizedPath } from '#shared/locales'
import { getUiLocale } from '~/utils/locales'
const config = useRuntimeConfig().public
const { locale } = useI18n()
const route = useRoute()
const origin = computed(() => safeUrl(config.siteUrl).replace(/\/$/, '') || 'https://crateview.de')
const plainPath = computed(
  () =>
    route.path.replace(
      new RegExp(
        `^/(${supportedLocales
          .filter((item) => item.code !== 'en')
          .map((item) => item.code)
          .join('|')})(?=/|$)`,
      ),
      '',
    ) || '/',
)
useHead(() => ({
  htmlAttrs: { lang: locale.value, dir: getLocale(locale.value).dir },
  titleTemplate: (title) =>
    (config.brandTitleTemplate || `%s · ${config.brandName}`).replaceAll(
      '%s',
      title || config.brandName,
    ),
  link: [
    { rel: 'icon', href: safeUrl(config.brandFavicon) || '/favicon.ico' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    { rel: 'canonical', href: origin.value + route.path },
    ...supportedLocales.map((item) => ({
      rel: 'alternate' as const,
      hreflang: item.language,
      href: origin.value + localizedPath(item.code, plainPath.value),
    })),
    { rel: 'alternate', hreflang: 'x-default', href: origin.value + plainPath.value },
  ],
  meta: [
    { property: 'og:site_name', content: config.brandName },
    { property: 'og:locale', content: getLocale(locale.value).og },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
}))
</script>
<template>
  <UApp :locale="getUiLocale(locale)"
    ><NuxtLayout><NuxtPage /></NuxtLayout
  ></UApp>
</template>
