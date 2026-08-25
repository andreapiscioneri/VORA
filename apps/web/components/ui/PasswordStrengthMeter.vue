<script setup lang="ts">
import { scorePassword } from '~/shared/validation/password'

const props = defineProps<{ password: string }>()

const strength = computed(() => scorePassword(props.password))

const labels = ['auth.strength.veryWeak', 'auth.strength.weak', 'auth.strength.fair', 'auth.strength.good', 'auth.strength.strong']
const barColors = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-info', 'bg-success']
</script>

<template>
  <div v-if="password" class="mt-1.5">
    <div class="flex gap-1">
      <div
        v-for="i in 4"
        :key="i"
        class="h-1 flex-1 rounded-full transition-colors"
        :class="i <= strength.score + 1 ? barColors[strength.score] : 'bg-ink-100 dark:bg-white/10'"
      />
    </div>
    <p class="text-caption mt-1" :class="strength.weak ? 'text-danger' : 'text-ink-400'">
      {{ $t(labels[strength.score]) }}
    </p>
  </div>
</template>
