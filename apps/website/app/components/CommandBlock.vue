<script setup lang="ts">
withDefaults(defineProps<{ code: string; label?: string; language?: string }>(), {
  language: 'bash',
  label: undefined,
})
const { t } = useI18n()
const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
async function copy(code: string) {
  try {
    await navigator.clipboard.writeText(code)
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), 1800)
  } catch {
    useToast().add({ title: t('copyFailed'), color: 'error' })
  }
}
onBeforeUnmount(() => clearTimeout(timer))
</script>
<template>
  <div class="overflow-hidden rounded-xl border border-default bg-muted/50">
    <div class="flex items-center justify-between border-b border-default px-4 py-2.5">
      <span class="text-xs text-muted">{{ label || t('terminal') }}</span>
      <UButton
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        :aria-label="t(copied ? 'copied' : 'copy')"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="copy(code)"
      />
    </div>
    <CodeBlock
      :code="code"
      :language="language"
      class="p-5 font-mono text-xs leading-7 sm:text-sm"
    />
  </div>
</template>
