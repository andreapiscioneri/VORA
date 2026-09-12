<script setup lang="ts">
import type { MicroSite } from '~/shared/types/microsite'

definePageMeta({ layout: 'public' })

const route = useRoute()
const { data: site, error } = await useFetch<MicroSite>(`/api/microsites/public/${route.params.slug}`)

// Propagate the real HTTP status (Nuxt's own error page, not a 200 with a
// "not found" message baked into the body) — a search engine or link
// checker hitting an unpublished/removed slug should see an actual 404.
if (error.value) {
  throw createError({ statusCode: error.value.statusCode ?? 404, statusMessage: 'Site not found', fatal: true })
}

if (site.value) {
  useHead({
    title: site.value.name,
    meta: [{ name: 'description', content: site.value.tagline }],
  })
}
</script>

<template>
  <div v-if="site" class="max-w-3xl mx-auto px-6 py-20 tablet:py-32">
    <header class="mb-16">
      <div class="size-14 rounded-xl mb-6" :style="{ backgroundColor: site.accentColor }" />
      <h1 class="text-display font-semibold tracking-tight">{{ site.name }}</h1>
      <p v-if="site.tagline" class="text-h4 text-ink-400 mt-3">{{ site.tagline }}</p>
    </header>

    <section v-if="site.about" class="mb-16">
      <p class="text-body-lg whitespace-pre-line leading-relaxed">{{ site.about }}</p>
    </section>

    <footer v-if="site.contactEmail" class="pt-8 border-t border-ink-100 dark:border-white/10">
      <a
        :href="`mailto:${site.contactEmail}`"
        class="inline-flex items-center gap-2 px-5 py-3 rounded-md text-body-sm font-medium text-ink-950 transition-opacity hover:opacity-90"
        :style="{ backgroundColor: site.accentColor }"
      >
        {{ site.contactEmail }}
      </a>
    </footer>

    <p class="mt-20 text-caption text-ink-300 dark:text-ink-600">{{ $t('sites.generatedBy') }}</p>
  </div>
</template>
