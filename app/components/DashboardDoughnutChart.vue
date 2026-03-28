<template>
  <div class="rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900/50 dark:ring-white/5 p-5">
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{{ title }}</h3>
    <div class="flex justify-center">
      <div class="w-full max-w-[240px]">
        <Doughnut :data="chartData" :options="chartOptions" />
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
      position: 'bottom' as const,
      labels: {
        color: isDark.value ? '#9ca3af' : '#4b5563',
        padding: 14,
        usePointStyle: true,
        pointStyleWidth: 8,
        font: { size: 11, weight: '500' },
      },
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
