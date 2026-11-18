import { docPath, getDocVersion, stableDocVersion } from '#shared/docs'
import { getLocale } from '#shared/locales'
export function useDocs() {
  const { locale, t } = useI18n()
  const route = useRoute()
  const localePath = useLocalePath()
  const version = computed(() => getDocVersion(String(route.params.version || stableDocVersion)))
  const entries = computed(() =>
    (version.value?.slugs || []).map((slug, index) => ({
      slug,
      title: t(slug),
      to: localePath(docPath(version.value!.id, slug)),
      group: index < 3 ? t('gettingStarted') : t('guides'),
      section: index < 3 ? 'get-started' : 'guides',
    })),
  )
  const collection = computed(() => getLocale(locale.value).collection)
  return { entries, collection, version }
}
