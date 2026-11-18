import { supportedLocales } from './shared/locales'
export default defineNuxtConfig({
  hooks: {
    'nitro:build:public-assets': async (nitro) => {
      const { rm } = await import('node:fs/promises')
      await rm(nitro.options.output.publicDir + '/images/docs/next', {
        recursive: true,
        force: true,
      })
    },
  },
  compatibilityDate: '2026-11-01',
  modules: ['@nuxt/ui', '@nuxt/content', '@nuxtjs/i18n', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  ui: { fonts: false },
  content: {
    experimental: { sqliteConnector: 'native' },
    build: {
      markdown: {
        highlight: {
          theme: { default: 'github-light', light: 'github-light', dark: 'github-dark' },
          langs: [
            'bash',
            'json',
            'yaml',
            'dockerfile',
            'dotenv',
            'javascript',
            'typescript',
            'html',
            'css',
            'sql',
            'markdown',
          ],
        },
      },
    },
  },
  colorMode: {
    preference: 'system',
    fallback: 'light',
    storage: 'localStorage',
    storageKey: 'crateview-color-mode',
  },
  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    locales: supportedLocales.map(({ code, language, name, file, dir }) => ({
      code,
      language,
      name,
      file,
      dir,
    })),
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'crateview-language',
      redirectOn: 'root',
      fallbackLocale: 'en',
    },
    baseUrl: 'https://crateview.de',
  },
  runtimeConfig: {
    public: {
      siteUrl: 'https://crateview.de',
      themePrimary: '',
      themeNeutral: '',
      themeRadius: '',
      themeFontFamily: '',
      brandName: 'Crateview',
      brandDescription: '',
      brandLogoLight: '/branding/crateview-mark-256.png',
      brandLogoDark: '/branding/crateview-mark-256.png',
      brandFavicon: '/favicon.ico',
      brandTitleTemplate: '',
      brandProductUrl: 'https://crateview.de',
      brandDocsUrl: '/docs/overview',
      brandRepositoryUrl: 'https://github.com/crateview/registry-ui',
    },
  },
  app: {
    head: {
      title: 'Crateview',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
  typescript: { strict: true },
  eslint: { config: { stylistic: false } },
})
