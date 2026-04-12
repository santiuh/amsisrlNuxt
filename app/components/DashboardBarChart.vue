<template>
  <div class="rounded-2xl bg-white shadow-card ring-1 ring-gray-100 p-5 dark:bg-white/[0.03] dark:ring-white/[0.06]">
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
      ticks: { color: isDark.value ? '#64748b' : '#94a3b8', font: { size: 11 } },
      grid: { display: false },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: { color: isDark.value ? '#64748b' : '#94a3b8', stepSize: 1, precision: 0, font: { size: 11 } },
      grid: { color: isDark.value ? 'rgba(51,65,85,0.3)' : 'rgba(226,232,240,0.5)' },
      border: { display: false },
    },
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: isDark.value ? '#94a3b8' : '#64748b',
        padding: 14,
        usePointStyle: true,
        pointStyleWidth: 8,
        font: { size: 11, weight: '500' },
      },
    },
    tooltip: {
      backgroundColor: isDark.value ? '#1e293b' : '#ffffff',
      titleColor: isDark.value ? '#f1f5f9' : '#0f172a',
      bodyColor: isDark.value ? '#94a3b8' : '#475569',
      borderColor: isDark.value ? '#334155' : '#e2e8f0',
      borderWidth: 1,
      cornerRadius: 10,
      padding: 10,
    },
  },
}))
</script>
