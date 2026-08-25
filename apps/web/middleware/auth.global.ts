const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email']
const LOCALE_PREFIX = /^\/(en|de|es|fr|ru|zh|ja)(?=\/|$)/

export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith('/site/')) return

  const unprefixedPath = to.path.replace(LOCALE_PREFIX, '') || '/'
  if (PUBLIC_ROUTES.includes(unprefixedPath)) return

  const { loggedIn } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
