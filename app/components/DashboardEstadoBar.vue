<template>
  <div class="rounded-2xl bg-white shadow-card ring-1 ring-gray-100 p-5 dark:bg-white/[0.03] dark:ring-white/[0.06]">
    <div class="flex items-baseline justify-between gap-3 mb-4">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ title }}</h3>
      <span class="text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
        {{ total }} {{ total === 1 ? 'venta' : 'ventas' }}
      </span>
    </div>

    <div
      v-if="total > 0"
      class="flex h-6 w-full overflow-hidden rounded-full ring-1 ring-gray-100 dark:ring-white/[0.08] bg-gray-50 dark:bg-white/[0.04]"
    >
      <div
        v-for="seg in segmentos"
        :key="seg.label"
        :style="{ width: seg.pct + '%', backgroundColor: seg.color }"
        :title="`${seg.label}: ${seg.value} (${seg.pct}%)`"
        class="h-full transition-[width] duration-500 ease-out first:rounded-l-full last:rounded-r-full hover:brightness-110"
      />
    </div>

    <div
      v-else
      class="flex h-6 w-full items-center justify-center rounded-full bg-gray-50 dark:bg-white/[0.04] text-[11px] font-medium text-gray-400 dark:text-gray-500"
    >
      Sin ventas en el período
    </div>

    <div
      v-if="segmentos.length > 0"
      class="mt-4 grid gap-x-4 gap-y-2"
      style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))"
    >
      <div
        v-for="seg in segmentos"
        :key="seg.label"
        class="flex items-center gap-2 text-sm min-w-0"
      >
        <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: seg.color }" />
        <span class="text-gray-500 dark:text-slate-400 truncate">{{ seg.label }}</span>
        <span class="font-semibold text-gray-800 dark:text-gray-200 ml-auto">{{ seg.value }}</span>
        <span class="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{{ seg.pct }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  labels: string[]
  data: number[]
  colors: string[]
}>()

const total = computed(() => props.data.reduce((a, b) => a + b, 0))

const segmentos = computed(() => {
  const t = total.value
  if (t === 0) return []
  return props.labels
    .map((label, i) => ({
      label,
      value: props.data[i] ?? 0,
      color: props.colors[i] ?? '#94a3b8',
      pct: Math.round(((props.data[i] ?? 0) / t) * 100),
    }))
    .filter(s => s.value > 0)
})
</script>
