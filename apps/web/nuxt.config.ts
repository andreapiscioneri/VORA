// Monorepo layout: this app lives at apps/web, with shared types/validation
// at ../../packages/shared (also consumed by apps/mobile via its own
// tsconfig path + Metro watchFolders — see apps/mobile/metro.config.js).
// apps/web/shared is a symlink to that directory (not a real folder) — every
// `~/shared/...` import used throughout this app's source keeps working
// unchanged because Nuxt's `~` already resolves to this directory, and a
// symlink resolves identically for Vite, Nitro's dev module runner, and
// TypeScript alike, unlike a custom `alias` entry (Nitro's on-demand SSR
// runner in this Nuxt/Vite version does not reliably pick those up).
export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  devtools: { enabled: true },

  runtimeConfig: {
    session: {
      // The iOS/Android native networking layer discards `Secure` cookies over
      // plain HTTP, so the mobile app can never keep a session in local dev
      // (which has no TLS). Production always terminates behind HTTPS.
      cookie: {
        secure: process.env.NODE_ENV === 'production',
      },
    },
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Vora',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3100',
    },
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
  ],

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  googleFonts: {
    families: {
      Roboto: [400, 500, 700, 900],
    },
    display: 'swap',
    download: true,
    base64: false,
  },

  i18n: {
    locales: [
      { code: 'it', language: 'it-IT', name: 'Italiano', file: 'it.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'es', language: 'es-ES', name: 'Español', file: 'es.json' },
      { code: 'fr', language: 'fr-FR', name: 'Français', file: 'fr.json' },
      { code: 'ru', language: 'ru-RU', name: 'Русский', file: 'ru.json' },
      { code: 'zh', language: 'zh-CN', name: '中文', file: 'zh.json' },
      { code: 'ja', language: 'ja-JP', name: '日本語', file: 'ja.json' },
    ],
    defaultLocale: 'it',
    strategy: 'prefix_except_default',
    fallbackLocale: 'it',
  },

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
  },

  app: {
    head: {
      title: 'Vora',
      meta: [
        { name: 'description', content: 'Vora — the calm AI operating system for work.' },
        { name: 'theme-color', content: '#0a0a0a' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icons/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/icons/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/icons/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },
})
