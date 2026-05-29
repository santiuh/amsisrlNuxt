<template>
  <div class="space-y-2">
    <div
      v-for="(width, i) in WIDTHS"
      :key="i"
      class="block rounded-xl bg-white ring-1 ring-gray-100 px-3 py-2.5 dark:bg-white/[0.03] dark:ring-white/[0.06]"
    >
      <div class="flex items-center justify-between gap-2 mb-1.5">
        <div class="flex items-center gap-1.5 min-w-0">
          <SkeletonBox variant="pill" :tone="PILL_TONES[i % PILL_TONES.length]" width="56" height="16" />
          <SkeletonBox variant="text" width="38" height="11" />
        </div>
        <SkeletonBox variant="pill" :tone="ESTADO_TONES[i % ESTADO_TONES.length]" width="74" height="18" />
      </div>

      <SkeletonBox variant="text" :width="width.cliente" height="14" />

      <div class="flex items-center justify-between gap-2 mt-1.5">
        <SkeletonBox variant="text" :width="width.sub" height="11" />
        <SkeletonBox variant="text" width="58" height="13" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Tone = 'purple' | 'violet' | 'emerald' | 'amber' | 'cyan' | 'neutral' | 'green' | 'red' | 'sky'

withDefaults(defineProps<{
  count?: number
}>(), {
  count: 5,
})

const PILL_TONES: Tone[] = ['green', 'red', 'sky']
const ESTADO_TONES: Tone[] = ['emerald', 'cyan', 'amber', 'neutral', 'violet']

const WIDTHS = [
  { cliente: '70%', sub: '55%' },
  { cliente: '54%', sub: '42%' },
  { cliente: '78%', sub: '60%' },
  { cliente: '48%', sub: '38%' },
  { cliente: '66%', sub: '52%' },
]
</script>
