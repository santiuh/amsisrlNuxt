<template>
  <div
    class="relative overflow-hidden rounded-2xl p-5"
    :class="theme.card"
  >
    <div class="relative">
      <div class="flex items-center justify-between gap-2">
        <SkeletonBox variant="text" :tone="theme.tone" width="68%" height="11" />
        <SkeletonBox variant="rect" :tone="theme.tone" width="32" height="32" rounded="rounded-lg" />
      </div>
      <SkeletonBox variant="rect" :tone="theme.tone" width="62%" height="28" class="mt-3" rounded="rounded-md" />
    </div>
  </div>
</template>

<script setup lang="ts">
type Color = 'blue' | 'green' | 'purple' | 'teal' | 'amber'
type Tone = 'neutral' | 'cyan' | 'purple' | 'violet' | 'emerald' | 'amber'

const props = withDefaults(defineProps<{
  color?: Color
}>(), {
  color: 'blue',
})

const THEMES: Record<Color, { card: string; tone: Tone }> = {
  blue: {
    card: 'bg-white shadow-card ring-1 ring-blue-100 dark:bg-blue-500/[0.06] dark:ring-blue-500/15',
    tone: 'cyan',
  },
  green: {
    card: 'bg-white shadow-card ring-1 ring-emerald-100 dark:bg-emerald-500/[0.06] dark:ring-emerald-500/15',
    tone: 'emerald',
  },
  purple: {
    card: 'bg-white shadow-card ring-1 ring-purple-100 dark:bg-purple-500/[0.06] dark:ring-purple-500/15',
    tone: 'purple',
  },
  teal: {
    card: 'bg-white shadow-card ring-1 ring-teal-100 dark:bg-teal-500/[0.06] dark:ring-teal-500/15',
    tone: 'cyan',
  },
  amber: {
    card: 'bg-white shadow-card ring-1 ring-amber-100 dark:bg-amber-500/[0.06] dark:ring-amber-500/15',
    tone: 'amber',
  },
}

const theme = computed(() => THEMES[props.color])
</script>
