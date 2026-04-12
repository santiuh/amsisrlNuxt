<template>
  <div class="rounded-2xl bg-white shadow-card ring-1 ring-gray-100 p-5 dark:bg-white/[0.03] dark:ring-white/[0.06]">
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{{ title }}</h3>
    <div class="flex flex-col sm:flex-row items-center gap-6">
      <div class="w-40 h-40 shrink-0">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>
      <div class="flex flex-col gap-2">
        <template v-for="(label, i) in labels" :key="i">
          <div v-if="data[i] > 0" class="flex items-center gap-2 text-sm">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: colors[i] }" />
            <span class="text-gray-500 dark:text-slate-400">{{ label }}</span>
            <span class="font-semibold text-gray-800 dark:text-gray-200">{{ data[i] }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'

const props = defineProps<{
  title: string
  labels: string[]
  data: number[]
  colors: string[]
}>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.data,
      backgroundColor: props.colors,
      borderColor: isDark.value ? 'rgba(17,24,39,0.8)' : '#ffffff',
      borderWidth: 2,
      hoverOffset: 6,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  cutout: '70%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: isDark.value ? '#1e293b' : '#ffffff',
      titleColor: isDark.value ? '#f1f5f9' : '#0f172a',
      bodyColor: isDark.value ? '#94a3b8' : '#475569',
      borderColor: isDark.value ? '#334155' : '#e2e8f0',
      borderWidth: 1,
      cornerRadius: 10,
      padding: 10,
      callbacks: {
        label: (ctx: any) => {
          const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0
          return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`
        },
      },
    },
  },
}))
</script>
