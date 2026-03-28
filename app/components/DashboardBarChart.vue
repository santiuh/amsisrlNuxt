<template>
  <div class="rounded-2xl bg-gray-900/50 ring-1 ring-white/5 p-5">
    <h3 class="text-sm font-semibold text-gray-300 mb-4">{{ title }}</h3>
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
      ticks: { color: '#6b7280', font: { size: 11 } },
      grid: { display: false },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: { color: '#6b7280', stepSize: 1, precision: 0, font: { size: 11 } },
      grid: { color: '#1f2937' },
      border: { display: false },
    },
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: '#9ca3af',
        padding: 14,
        usePointStyle: true,
        pointStyleWidth: 8,
        font: { size: 11, weight: '500' },
      },
    },
    tooltip: {
      backgroundColor: '#1f2937',
      titleColor: '#f3f4f6',
      bodyColor: '#d1d5db',
      borderColor: '#374151',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 10,
    },
  },
}))
</script>
