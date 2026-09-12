// vue-i18n bundle options (as opposed to the Nuxt module's own routing/locale
// list config in nuxt.config.ts) — this version of @nuxtjs/i18n only accepts
// a file path for `vueI18n`, not an inline object, so `fallbackLocale` lives
// here instead of alongside `defaultLocale`/`locales` in nuxt.config.ts.
export default defineI18nConfig(() => ({
  fallbackLocale: 'it',
}))
