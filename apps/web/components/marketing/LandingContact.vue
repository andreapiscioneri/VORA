<script setup lang="ts">
const { t } = useI18n()

const CONTACT_EMAIL = 'andrypiscioneri@gmail.com'

const form = reactive({ name: '', email: '', message: '' })

function submit() {
  const subject = t('landing.contact.mailSubject')
  const body = [
    `${t('landing.contact.form.name')}: ${form.name}`,
    `${t('landing.contact.form.email')}: ${form.email}`,
    '',
    form.message,
  ].join('\n')

  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
</script>

<template>
  <section id="contact" class="relative bg-[#0a0f08] scroll-mt-24 py-20 sm:py-28 px-5 sm:px-8 md:px-12">
    <div class="max-w-3xl mx-auto">
      <p class="text-xs sm:text-sm font-semibold tracking-[0.12em] text-primary uppercase">{{ t('landing.contact.eyebrow') }}</p>
      <h2 class="text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-[-0.03em] text-white mt-3 max-w-2xl">{{ t('landing.contact.title') }}</h2>
      <p class="text-sm sm:text-base text-white/70 leading-relaxed mt-4 max-w-xl">{{ t('landing.contact.subtitle') }}</p>

      <form class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 sm:mt-12" @submit.prevent="submit">
        <div class="flex flex-col gap-1.5">
          <label for="contact-name" class="text-xs font-medium text-white/60">{{ t('landing.contact.form.name') }}</label>
          <input
            id="contact-name"
            v-model="form.name"
            type="text"
            required
            :placeholder="t('landing.contact.form.namePlaceholder')"
            class="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
          >
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="contact-email" class="text-xs font-medium text-white/60">{{ t('landing.contact.form.email') }}</label>
          <input
            id="contact-email"
            v-model="form.email"
            type="email"
            required
            :placeholder="t('landing.contact.form.emailPlaceholder')"
            class="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
          >
        </div>
        <div class="flex flex-col gap-1.5 sm:col-span-2">
          <label for="contact-message" class="text-xs font-medium text-white/60">{{ t('landing.contact.form.message') }}</label>
          <textarea
            id="contact-message"
            v-model="form.message"
            rows="4"
            required
            :placeholder="t('landing.contact.form.messagePlaceholder')"
            class="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 resize-none"
          />
        </div>

        <div class="sm:col-span-2">
          <button
            type="submit"
            class="inline-flex px-7 py-3 rounded-full bg-primary text-ink-950 text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            {{ t('landing.contact.form.submit') }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
