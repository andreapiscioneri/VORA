import { getSiteBySlug } from '~/server/utils/microsites'

// Public, unauthenticated lookup for the live site page (pages/site/[slug].vue).
// Only returns published sites — unpublished sites 404 for visitors.
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const site = await getSiteBySlug(slug)

  if (!site || !site.published) {
    throw createError({ statusCode: 404, statusMessage: 'Site not found' })
  }

  return site
})
