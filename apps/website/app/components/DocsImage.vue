<script setup lang="ts">
import { ProseImg } from '@nuxt/ui/components/prose'

defineOptions({ inheritAttrs: false })
const props = defineProps<{
  src: string
  alt?: string
  width?: string | number
  height?: string | number
}>()
const localSource = computed(() =>
  props.src.replace(/^https:\/\/crateview\.de(?=\/images\/docs\/)/, ''),
)
const screenshot = computed(() =>
  /^\/images\/docs\/[^/]+\/[^/]+-(light|dark)\.webp$/.test(localSource.value),
)
const light = computed(() => localSource.value.replace(/-(light|dark)\.webp$/, '-light.webp'))
const dark = computed(() => localSource.value.replace(/-(light|dark)\.webp$/, '-dark.webp'))
</script>
<template>
  <template v-if="screenshot">
    <ProseImg
      :src="light"
      :alt="alt || ''"
      :width="width || 1360"
      :height="height || 880"
      class="dark:hidden"
      v-bind="$attrs"
    />
    <ProseImg
      :src="dark"
      :alt="alt || ''"
      :width="width || 1360"
      :height="height || 880"
      class="hidden dark:block"
      v-bind="$attrs"
    />
  </template>
  <ProseImg v-else :src="src" :alt="alt || ''" :width="width" :height="height" v-bind="$attrs" />
</template>
