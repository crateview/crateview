<template>
  <UPageCard v-if="available" variant="subtle" :title="t('garbageCollection')">
    <p v-if="statusKey" role="status" class="text-sm text-muted">
      {{ t(statusKey) }}
    </p>
    <div>
      <UModal
        v-model:open="open"
        :title="t('garbageCollectionStart')"
        :description="t('garbageCollectionWarning')"
        @update:open="prepare"
      >
        <UButton color="error" variant="outline" :loading="starting" :disabled="!canStart">
          {{ t('garbageCollectionStart') }}
        </UButton>
        <template #footer>
          <UButton color="neutral" variant="outline" @click="open = false">
            {{ t('cancel') }}
          </UButton>
          <UButton color="error" :disabled="!canStart || revision !== snapshot?.revision" @click="start">
            {{ t('confirm') }}
          </UButton>
        </template>
      </UModal>
    </div>
  </UPageCard>
</template>

<script setup lang="ts">
import { garbageCollectionSnapshot, type GarbageCollectionSnapshot } from '~~/shared/garbage-collection';

const { operator } = defineProps<{ operator: string }>();
const { t } = useI18n();
const endpoint = '/api/registry/garbage-collection';
const storageKey = `registry-ui-garbage-collection:${operator}`;
const snapshot = shallowRef<GarbageCollectionSnapshot>();
const available = ref(false);
const starting = ref(false);
const unreadable = ref(false);
const unresolved = ref<string>();
const open = ref(false);
const revision = ref<string>();
const canStart = computed(
  () =>
    !!snapshot.value &&
    !starting.value &&
    !unreadable.value &&
    !unresolved.value &&
    snapshot.value.run?.state !== 'running',
);
const statusKey = computed(() => {
  if (starting.value) return 'loading';
  if (unreadable.value || unresolved.value) return 'garbageCollectionUnknown';
  switch (snapshot.value?.run?.state) {
    case 'running':
      return 'garbageCollectionRunning';
    case 'succeeded':
      return 'garbageCollectionSucceeded';
    case 'failed':
      return 'garbageCollectionFailed';
  }
  return undefined;
});

let timer: ReturnType<typeof setTimeout> | undefined;
let stopped = false;
let request: AbortController | undefined;

function remember(value?: string) {
  unresolved.value = value;
  try {
    if (value) sessionStorage.setItem(storageKey, value);
    else sessionStorage.removeItem(storageKey);
  } catch {
    // Keep the current view safe even if browser session storage is unavailable.
  }
}

function prepare(value: boolean) {
  if (value) revision.value = snapshot.value?.revision;
}

function schedule() {
  if (!stopped && (unreadable.value || unresolved.value || snapshot.value?.run?.state === 'running'))
    timer = setTimeout(refresh, 2000);
}

function code(error: unknown) {
  const failure = error as { statusCode?: number; status?: number } | undefined;
  return failure?.statusCode ?? failure?.status;
}

async function refresh() {
  request = new AbortController();
  try {
    const result = garbageCollectionSnapshot.parse(
      await $fetch(endpoint, { signal: request.signal, cache: 'no-store', retry: 0 }),
    );
    if (stopped) return;
    snapshot.value = result;
    available.value = true;
    unreadable.value = false;
    if (unresolved.value && result.revision !== unresolved.value) remember();
  } catch (error) {
    if (stopped) return;
    if ([401, 403, 404].includes(code(error) ?? 0)) {
      available.value = false;
      return;
    }
    unreadable.value = true;
  }
  schedule();
}

async function start() {
  if (!canStart.value || !revision.value || revision.value !== snapshot.value?.revision) return;
  clearTimeout(timer);
  const requested = revision.value;
  open.value = false;
  starting.value = true;
  remember(requested);
  request = new AbortController();
  try {
    const accepted = garbageCollectionSnapshot.parse(
      await $fetch(endpoint, { method: 'POST', body: { revision: requested }, signal: request.signal, retry: 0 }),
    );
    if (stopped) return;
    if (accepted.revision === requested || accepted.run?.state !== 'running') throw new Error('Invalid acceptance');
    snapshot.value = accepted;
    remember();
  } catch (error) {
    if (stopped) return;
    const status = code(error);
    if (status === 409 || status === 400 || status === 401 || status === 403 || status === 404) remember();
    unreadable.value = true;
    await refresh();
    return;
  } finally {
    if (!stopped) starting.value = false;
  }
  schedule();
}

onMounted(() => {
  try {
    unresolved.value = sessionStorage.getItem(storageKey) || undefined;
  } catch {
    // Session storage may be blocked.
  }
  void refresh();
});
onBeforeUnmount(() => {
  stopped = true;
  clearTimeout(timer);
  request?.abort();
});
</script>
