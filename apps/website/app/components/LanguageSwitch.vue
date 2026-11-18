<script setup lang="ts">
import type { LocaleCode } from '#shared/locales'
import { languageOptions } from '~/utils/locales'
const { locale, setLocale, setLocaleCookie, t } = useI18n()
async function changeLocale(value: LocaleCode) {
  setLocaleCookie(value)
  await setLocale(value)
}
const flags: Record<LocaleCode, string> = {
  en: '🇺🇸',
  de: '🇩🇪',
  'zh-CN': '🇨🇳',
  hi: '🇮🇳',
  es: '🇪🇸',
  ar: '🇸🇦',
  fr: '🇫🇷',
  bn: '🇧🇩',
  'pt-BR': '🇧🇷',
  id: '🇮🇩',
  ur: '🇵🇰',
  ru: '🇷🇺',
  ja: '🇯🇵',
}
const items = computed(() =>
  languageOptions.map((option) => ({
    label: option.label,
    flag: flags[option.value],
    type: 'checkbox' as const,
    checked: locale.value === option.value,
    onSelect: () => changeLocale(option.value),
  })),
)
</script>
<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'end' }"
    :ui="{ content: 'w-48 max-h-80 overflow-y-auto' }"
  >
    <template #item-leading="{ item }">
      <span aria-hidden="true" class="shrink-0 text-base" data-testid="language-flag">{{
        item.flag
      }}</span>
    </template>
    <UButton
      icon="i-lucide-languages"
      color="neutral"
      variant="ghost"
      :aria-label="t('language')"
      data-testid="language-switch"
    />
  </UDropdownMenu>
</template>
