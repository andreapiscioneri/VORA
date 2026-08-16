<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 32 })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="100" height="100" rx="22" fill="#0a0a0a" />
    <g fill="none" stroke="#39FF14" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 26 L48 74" stroke-width="8.5" opacity="0.55" />
      <path d="M78 26 L52 74" stroke-width="8.5" opacity="0.55" />
      <path d="M50 20 L50 74" stroke-width="8.5" />
    </g>
  </svg>
</template>
