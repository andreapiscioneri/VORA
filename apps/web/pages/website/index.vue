<script setup lang="ts">
import type { MicroSite } from '~/shared/types/microsite'

definePageMeta({ layout: 'default' })

const { overview, pending, error, fetchOverview } = useWebsite()
const { sites, pending: sitesPending, hasMore: sitesHasMore, loadingMore: sitesLoadingMore, fetchSites, loadMore: loadMoreSites } = useMicrosites()
await Promise.all([fetchOverview(), fetchSites()])

const featuredProjects = computed(() => overview.value?.projects.filter((p) => p.featured) ?? [])
const otherProjects = computed(() => overview.value?.projects.filter((p) => !p.featured) ?? [])

const showSiteForm = ref(false)
const editingSite = ref<MicroSite | null>(null)

function openNewSite() {
  editingSite.value = null
  showSiteForm.value = true
}

function openEditSite(site: MicroSite) {
  editingSite.value = site
  showSiteForm.value = true
}

function closeSiteForm() {
  showSiteForm.value = false
  editingSite.value = null
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-h1 font-semibold tracking-tight">{{ $t('website.title') }}</h1>
      <p class="text-body text-ink-400 mt-1">{{ $t('website.subtitle') }}</p>
    </div>

    <div v-if="pending" class="space-y-4">
      <div class="h-24 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
      <div class="h-40 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <template v-else-if="overview">
      <div class="rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-5 flex items-center gap-4">
        <span class="flex items-center justify-center size-12 rounded-lg bg-primary/15 text-primary-600 dark:text-primary shrink-0">
          <UiIcon name="globe" :size="22" />
        </span>
        <div class="flex-1 min-w-0">
          <p class="font-medium truncate">{{ overview.siteUrl }}</p>
          <p class="text-body-sm text-ink-400 mt-1">
            <span class="inline-flex items-center gap-1.5">
              <span class="size-1.5 rounded-full" :class="overview.connected ? 'bg-success' : 'bg-danger'" />
              {{ overview.connected ? $t('website.connected') : $t('website.notConnected') }}
            </span>
          </p>
        </div>
        <a
          :href="overview.siteUrl"
          target="_blank"
          rel="noopener"
          class="shrink-0 flex items-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        >
          <UiIcon name="external-link" :size="14" />
          {{ $t('website.visitSite') }}
        </a>
      </div>

      <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
        <div class="rounded-lg border border-ink-100 dark:border-white/10 p-5">
          <p class="text-body-sm font-medium mb-3">{{ $t('website.pages') }} ({{ overview.pages.length }})</p>
          <ul class="space-y-2">
            <li v-for="p in overview.pages" :key="p.file" class="flex items-center justify-between text-body-sm">
              <span class="font-mono text-caption text-ink-500 dark:text-paper-300">{{ p.route }}</span>
              <a :href="overview.siteUrl + p.route" target="_blank" rel="noopener" class="text-caption text-primary-600 dark:text-primary hover:underline">
                {{ $t('website.visitSite') }}
              </a>
            </li>
          </ul>
        </div>

        <div class="rounded-lg border border-ink-100 dark:border-white/10 p-5">
          <p class="text-body-sm font-medium mb-3">{{ $t('website.projects') }} ({{ overview.projects.length }})</p>
          <div v-if="featuredProjects.length" class="mb-4">
            <p class="text-caption text-ink-400 uppercase tracking-wide mb-2">{{ $t('website.featured') }}</p>
            <ul class="space-y-2">
              <li v-for="p in featuredProjects" :key="p.slug" class="flex items-center justify-between text-body-sm">
                <span class="truncate">{{ p.title }} <span class="text-ink-400">· {{ p.client }}</span></span>
                <a :href="`${overview.siteUrl}/work/${p.slug}`" target="_blank" rel="noopener" class="shrink-0 text-caption text-primary-600 dark:text-primary hover:underline ml-2">
                  {{ p.year }}
                </a>
              </li>
            </ul>
          </div>
          <ul class="space-y-2 max-h-64 overflow-y-auto">
            <li v-for="p in otherProjects" :key="p.slug" class="flex items-center justify-between text-body-sm">
              <span class="truncate text-ink-500 dark:text-paper-300">{{ p.title }}</span>
              <a :href="`${overview.siteUrl}/work/${p.slug}`" target="_blank" rel="noopener" class="shrink-0 text-caption text-ink-400 hover:text-primary-600 dark:hover:text-primary ml-2">
                {{ p.year }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <p class="text-caption text-ink-400">{{ $t('website.note') }}</p>
    </template>

    <div class="pt-4 border-t border-ink-100 dark:border-white/10 space-y-4">
      <div class="flex items-center gap-4">
        <div>
          <h2 class="text-h3 font-semibold tracking-tight">{{ $t('website.myWebsites') }}</h2>
          <p class="text-body-sm text-ink-400 mt-1">{{ $t('website.createSite') }}</p>
        </div>
        <button
          class="ml-auto shrink-0 flex items-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
          @click="openNewSite"
        >
          <UiIcon name="plus" :size="16" />
          {{ $t('sites.new') }}
        </button>
      </div>

      <div v-if="sitesPending" class="h-20 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />

      <div v-else-if="sites.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-8 text-center">
        <p class="text-body-sm text-ink-400">{{ $t('sites.empty.subtitle') }}</p>
        <button class="mt-3 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNewSite">
          {{ $t('sites.empty.cta') }}
        </button>
      </div>

      <div v-else class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
        <div
          v-for="s in sites"
          :key="s.id"
          class="rounded-lg border border-ink-100 dark:border-white/10 p-4 flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-colors"
          @click="openEditSite(s)"
        >
          <span class="size-9 rounded-md shrink-0" :style="{ backgroundColor: s.accentColor }" />
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">{{ s.name }}</p>
            <p class="text-caption text-ink-400 font-mono truncate">/site/{{ s.slug }}</p>
          </div>
          <span class="shrink-0 px-2 py-1 rounded-full text-caption font-medium" :class="s.published ? 'bg-success/10 text-success' : 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300'">
            {{ s.published ? $t('sites.published') : $t('sites.draft') }}
          </span>
          <NuxtLink
            v-if="s.published"
            :to="`/site/${s.slug}`"
            target="_blank"
            class="shrink-0 text-ink-400 hover:text-primary-600 dark:hover:text-primary"
            :aria-label="$t('sites.viewLive')"
            @click.stop
          >
            <UiIcon name="external-link" :size="16" />
          </NuxtLink>
        </div>
      </div>

      <div v-if="!sitesPending && sitesHasMore" class="flex justify-center">
        <button
          class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
          :disabled="sitesLoadingMore"
          @click="loadMoreSites"
        >
          {{ sitesLoadingMore ? $t('sites.loadingMore') : $t('sites.loadMore') }}
        </button>
      </div>
    </div>

    <SitesSiteForm v-if="showSiteForm" :site="editingSite" @close="closeSiteForm" @saved="closeSiteForm" @deleted="closeSiteForm" />
  </div>
</template>
