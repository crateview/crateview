<script setup lang="ts">
const mode = useColorMode()
const { t } = useI18n()
const modes = [
  { value: 'system', icon: 'i-lucide-monitor' },
  { value: 'light', icon: 'i-lucide-sun' },
  { value: 'dark', icon: 'i-lucide-moon' },
]
const selected = computed(() => modes.find((item) => item.value === mode.preference) || modes[0]!)
function cycle() {
  const index = modes.findIndex((item) => item.value === selected.value.value)
  mode.preference = modes[(index + 1) % modes.length]!.value
}
</script>
<template>
  <ColorScheme>
    <UButton
      :icon="selected.icon"
      color="neutral"
      variant="ghost"
      :aria-label="`${t('theme')}: ${t(selected.value)}`"
      :title="`${t('theme')}: ${t(selected.value)}`"
      :disabled="Boolean(mode.forced)"
      data-testid="theme-switch"
      @click="cycle"
    />
    <template #placeholder>
      <UButton
        icon="i-lucide-monitor"
        color="neutral"
        variant="ghost"
        :aria-label="t('theme')"
        disabled
      />
    </template>
  </ColorScheme>
</template>
