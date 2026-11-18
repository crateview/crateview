<script setup lang="ts">
import { stableDocVersion } from '#shared/docs'

const { t } = useI18n()
const root = useTemplateRef<HTMLElement>('root')
const slides = computed(() => [
  { value: 'repositories', label: t('repositories') },
  { value: 'image', label: t('imageDetails') },
  { value: 'monitoring', label: t('previewDashboard') },
])
const selected = ref('image')
const paused = ref(false)
const hovered = ref(false)
const focused = ref(false)
const visible = ref(false)
const documentVisible = ref(true)
const reducedMotion = ref(false)
const playing = computed(
  () =>
    visible.value &&
    documentVisible.value &&
    !paused.value &&
    !hovered.value &&
    !focused.value &&
    !reducedMotion.value,
)
let timer: ReturnType<typeof setTimeout> | undefined
let observer: IntersectionObserver | undefined
let motion: MediaQueryList | undefined

function schedule() {
  clearTimeout(timer)
  if (!playing.value) return
  timer = setTimeout(() => {
    const index = slides.value.findIndex((slide) => slide.value === selected.value)
    selected.value = slides.value[(index + 1) % slides.value.length]!.value
    schedule()
  }, 6000)
}
function select(value: string) {
  selected.value = value
  schedule()
}
function updateMotion() {
  reducedMotion.value = motion?.matches || false
}
function updateVisibility() {
  documentVisible.value = !document.hidden
}
function focusOut(event: FocusEvent) {
  focused.value = event.relatedTarget instanceof Node && !!root.value?.contains(event.relatedTarget)
}
watch(playing, schedule)
onMounted(() => {
  motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotion()
  updateVisibility()
  motion.addEventListener('change', updateMotion)
  document.addEventListener('visibilitychange', updateVisibility)
  if (window.IntersectionObserver) {
    observer = new IntersectionObserver(
      ([entry]) => {
        visible.value = !!entry?.isIntersecting
      },
      { threshold: 0.2 },
    )
    if (root.value) observer.observe(root.value)
  } else visible.value = true
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  observer?.disconnect()
  motion?.removeEventListener('change', updateMotion)
  document.removeEventListener('visibilitychange', updateVisibility)
})
</script>
<template>
  <div
    ref="root"
    class="product-preview overflow-hidden rounded-2xl border border-default bg-muted/30 shadow-2xl shadow-black/5"
    role="region"
    :aria-label="t('previewTitle')"
    :data-playing="playing"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @focusin="focused = true"
    @focusout="focusOut"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-default px-4 py-3 sm:px-6"
    >
      <div class="flex items-center gap-2" aria-hidden="true">
        <span
          v-for="dot in 3"
          :key="dot"
          class="size-2 rounded-full border border-default bg-muted"
        />
        <span class="ms-3 hidden font-mono text-[10px] text-dimmed sm:inline">localhost:3000</span>
      </div>
      <div class="flex flex-wrap items-center gap-1">
        <UButton
          v-for="slide in slides"
          :key="slide.value"
          :variant="selected === slide.value ? 'soft' : 'ghost'"
          :color="selected === slide.value ? 'primary' : 'neutral'"
          size="xs"
          :aria-pressed="selected === slide.value"
          @click="select(slide.value)"
          >{{ slide.label }}</UButton
        >
        <UButton
          v-if="!reducedMotion"
          :icon="paused ? 'i-lucide-play' : 'i-lucide-pause'"
          :aria-label="t(paused ? 'previewPlay' : 'previewPause')"
          :aria-pressed="paused"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="paused = !paused"
        />
      </div>
    </div>
    <div class="relative aspect-[17/11] overflow-hidden" :aria-live="paused ? 'polite' : 'off'">
      <div
        class="preview-track flex h-full"
        dir="ltr"
        :style="{
          transform: `translateX(-${slides.findIndex((slide) => slide.value === selected) * 100}%)`,
        }"
      >
        <div
          v-for="slide in slides"
          :key="slide.value"
          class="preview-slide w-full shrink-0"
          :class="{ 'is-active': selected === slide.value }"
          :aria-hidden="selected !== slide.value"
        >
          <img
            :src="`/images/docs/${stableDocVersion}/${slide.value}-light.webp`"
            :alt="`Crateview — ${slide.label}`"
            width="1360"
            height="880"
            class="preview-light w-full"
            loading="lazy"
            decoding="async"
          />
          <img
            :src="`/images/docs/${stableDocVersion}/${slide.value}-dark.webp`"
            :alt="`Crateview — ${slide.label}`"
            width="1360"
            height="880"
            class="preview-dark w-full"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>
  </div>
</template>
