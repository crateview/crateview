import { fileURLToPath } from 'node:url'
import { defineContentConfig, defineCollection } from '@nuxt/content'

const docsRoot = fileURLToPath(new URL('../../docs/', import.meta.url))
const source = (locale: string) => ({
  cwd: docsRoot,
  include: `${locale}/**/*.md`,
  prefix: '',
  exclude: ['**/docs/next/**'],
})

export default defineContentConfig({
  collections: {
    docs_en: defineCollection({
      type: 'page',
      source: source('en'),
    }),
    docs_de: defineCollection({
      type: 'page',
      source: source('de'),
    }),
    docs_zh_CN: defineCollection({
      type: 'page',
      source: source('zh-CN'),
    }),
    docs_hi: defineCollection({
      type: 'page',
      source: source('hi'),
    }),
    docs_es: defineCollection({
      type: 'page',
      source: source('es'),
    }),
    docs_ar: defineCollection({
      type: 'page',
      source: source('ar'),
    }),
    docs_fr: defineCollection({
      type: 'page',
      source: source('fr'),
    }),
    docs_bn: defineCollection({
      type: 'page',
      source: source('bn'),
    }),
    docs_pt_BR: defineCollection({
      type: 'page',
      source: source('pt-BR'),
    }),
    docs_id: defineCollection({
      type: 'page',
      source: source('id'),
    }),
    docs_ur: defineCollection({
      type: 'page',
      source: source('ur'),
    }),
    docs_ru: defineCollection({
      type: 'page',
      source: source('ru'),
    }),
    docs_ja: defineCollection({
      type: 'page',
      source: source('ja'),
    }),
  },
})
