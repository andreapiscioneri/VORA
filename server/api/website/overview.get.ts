import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import type { WebsiteOverview, WebsitePage, WebsiteProject } from '~/shared/types/website'

// Reads real data from the sibling portfolio-andrea project instead of
// duplicating a website builder inside VORA — the public site stays a
// separate Nuxt project (see README §32); this only reflects its actual
// content read-only.
const PORTFOLIO_ROOT = join(process.cwd(), '..', 'portfolio-andrea')
const SITE_URL = 'https://andreapiscioneri.com'

function walkPages(dir: string, base = dir): WebsitePage[] {
  let results: WebsitePage[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return []
  }

  for (const entry of entries) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      results = results.concat(walkPages(full, base))
    } else if (entry.endsWith('.vue')) {
      const rel = relative(base, full).replace(/\.vue$/, '')
      const route = '/' + (rel === 'index' ? '' : rel.replace(/\/index$/, ''))
      results.push({ route: route || '/', file: relative(base, full) })
    }
  }
  return results
}

function parseProjects(): WebsiteProject[] {
  let text: string
  try {
    text = readFileSync(join(PORTFOLIO_ROOT, 'content', 'projects.ts'), 'utf-8')
  } catch {
    return []
  }

  const projects: WebsiteProject[] = []
  const blocks = text.split(/\{\s*\n\s*slug:/).slice(1)
  for (const block of blocks) {
    const slug = block.match(/^\s*'([^']+)'/)?.[1] ?? ''
    const title = block.match(/title:\s*(?:'([^']*)'|"([^"]*)")/)
    const client = block.match(/client:\s*(?:'([^']*)'|"([^"]*)")/)
    const year = block.match(/year:\s*(?:'([^']*)'|"([^"]*)")/)
    const featured = /featured:\s*true/.test(block.split(/\n\s*\{/)[0])
    const titleValue = title?.[1] ?? title?.[2] ?? ''
    if (slug && titleValue) {
      projects.push({
        slug,
        title: titleValue,
        client: client?.[1] ?? client?.[2] ?? '',
        year: year?.[1] ?? year?.[2] ?? '',
        featured,
      })
    }
  }
  return projects
}

export default defineEventHandler((): WebsiteOverview => {
  const pages = walkPages(join(PORTFOLIO_ROOT, 'pages'))
  const projects = parseProjects()

  return {
    siteUrl: SITE_URL,
    connected: pages.length > 0,
    pages: pages.sort((a, b) => a.route.localeCompare(b.route)),
    projects,
  }
})
