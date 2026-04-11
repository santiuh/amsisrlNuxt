<template>
  <div class="rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900/50 dark:ring-white/5 p-5">
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{{ title }}</h3>
    <div class="flex flex-col sm:flex-row items-center gap-6">
      <div class="w-40 h-40 shrink-0">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>
      <div class="flex flex-col gap-2">
        <template v-for="(label, i) in labels" :key="i">
          <div v-if="data[i] > 0" class="flex items-center gap-2 text-sm">
            <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: colors[i] }" />
            <span class="text-gray-600 dark:text-gray-400">{{ label }}</span>
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
      borderColor: 'transparent',
      borderWidth: 2,
      hoverOffset: 6,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  cutout: '68%',
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: isDark.value ? '#1f2937' : '#ffffff',
      titleColor: isDark.value ? '#f3f4f6' : '#111827',
      bodyColor: isDark.value ? '#d1d5db' : '#374151',
      borderColor: isDark.value ? '#374151' : '#e5e7eb',
      borderWidth: 1,
      cornerRadius: 8,
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
