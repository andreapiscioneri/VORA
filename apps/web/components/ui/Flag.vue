<script setup lang="ts">
withDefaults(defineProps<{ code: string; size?: number }>(), { size: 20 })
</script>

<template>
  <span class="inline-block overflow-hidden rounded-[2px] align-middle shrink-0 ring-1 ring-inset ring-black/30" :style="{ width: `${size}px`, height: `${size * (16 / 24)}px` }">
    <svg :width="size" :height="size * (16 / 24)" viewBox="0 0 24 16" class="block" aria-hidden="true">
      <template v-if="code === 'it'">
        <rect x="0" y="0" width="8" height="16" fill="#008C45" />
        <rect x="8" y="0" width="8" height="16" fill="#F4F5F0" />
        <rect x="16" y="0" width="8" height="16" fill="#CD212A" />
      </template>
      <template v-else-if="code === 'en'">
        <rect width="24" height="16" fill="#012169" />
        <line x1="0" y1="0" x2="24" y2="16" stroke="#FFFFFF" stroke-width="3.4" />
        <line x1="24" y1="0" x2="0" y2="16" stroke="#FFFFFF" stroke-width="3.4" />
        <line x1="0" y1="0" x2="24" y2="16" stroke="#C8102E" stroke-width="1.1" />
        <line x1="24" y1="0" x2="0" y2="16" stroke="#C8102E" stroke-width="1.1" />
        <rect x="0" y="5.6" width="24" height="4.8" fill="#FFFFFF" />
        <rect x="9.2" y="0" width="5.6" height="16" fill="#FFFFFF" />
        <rect x="0" y="6.9" width="24" height="2.2" fill="#C8102E" />
        <rect x="10.6" y="0" width="2.8" height="16" fill="#C8102E" />
      </template>
      <template v-else-if="code === 'de'">
        <rect x="0" y="0" width="24" height="5.33" fill="#000000" />
        <rect x="0" y="5.33" width="24" height="5.33" fill="#DD0000" />
        <rect x="0" y="10.66" width="24" height="5.34" fill="#FFCE00" />
      </template>
      <template v-else-if="code === 'es'">
        <rect x="0" y="0" width="24" height="4" fill="#AA151B" />
        <rect x="0" y="4" width="24" height="8" fill="#F1BF00" />
        <rect x="0" y="12" width="24" height="4" fill="#AA151B" />
      </template>
      <template v-else-if="code === 'fr'">
        <rect x="0" y="0" width="8" height="16" fill="#0055A4" />
        <rect x="8" y="0" width="8" height="16" fill="#FFFFFF" />
        <rect x="16" y="0" width="8" height="16" fill="#EF4135" />
      </template>
      <template v-else-if="code === 'ru'">
        <rect x="0" y="0" width="24" height="5.33" fill="#FFFFFF" />
        <rect x="0" y="5.33" width="24" height="5.33" fill="#0039A6" />
        <rect x="0" y="10.66" width="24" height="5.34" fill="#D52B1E" />
      </template>
      <template v-else-if="code === 'zh'">
        <rect width="24" height="16" fill="#DE2910" />
        <path d="M5 2.6 5.7 4.7 7.9 4.7 6.1 6 6.8 8.1 5 6.8 3.2 8.1 3.9 6 2.1 4.7 4.3 4.7Z" fill="#FFDE00" />
        <circle cx="9.5" cy="2" r="0.5" fill="#FFDE00" />
        <circle cx="11" cy="3.6" r="0.5" fill="#FFDE00" />
        <circle cx="11" cy="5.8" r="0.5" fill="#FFDE00" />
        <circle cx="9.5" cy="7.2" r="0.5" fill="#FFDE00" />
      </template>
      <template v-else-if="code === 'ja'">
        <rect width="24" height="16" fill="#FFFFFF" />
        <circle cx="12" cy="8" r="4.6" fill="#BC002D" />
      </template>
    </svg>
  </span>
</template>
