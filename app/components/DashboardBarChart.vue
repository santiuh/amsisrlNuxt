<template>
  <div class="rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900/50 dark:ring-white/5 p-5">
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{{ title }}</h3>
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'

interface Dataset {
  label: string
  data: number[]
  backgroundColor: string
}

const props = defineProps<{
  title: string
  labels: string[]
  datasets: Dataset[]
}>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map(ds => ({
    ...ds,
    borderRadius: 6,
    borderSkipped: false,
  })),
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  scales: {
    x: {
      ticks: { color: isDark.value ? '#6b7280' : '#6b7280', font: { size: 11 } },
      grid: { display: false },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: { color: isDark.value ? '#6b7280' : '#6b7280', stepSize: 1, precision: 0, font: { size: 11 } },
      grid: { color: isDark.value ? '#1f2937' : '#f3f4f6' },
      border: { display: false },
    },
  },
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
    },
  },
}))
</script>
