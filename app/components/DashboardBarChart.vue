<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base">{{ title }}</h3>
    </template>
    <Bar :data="chartData" :options="chartOptions" />
  </UCard>
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
const textColor = computed(() => colorMode.value === 'dark' ? '#d1d5db' : '#374151')
const gridColor = computed(() => colorMode.value === 'dark' ? '#374151' : '#e5e7eb')

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map(ds => ({
    ...ds,
    borderRadius: 4,
    borderSkipped: false,
  })),
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  scales: {
    x: {
      ticks: { color: textColor.value },
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: textColor.value,
        stepSize: 1,
        precision: 0,
      },
      grid: { color: gridColor.value },
    },
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: textColor.value,
        padding: 16,
        usePointStyle: true,
        pointStyleWidth: 10,
        font: { size: 12 },
      },
    },
    tooltip: {
      titleColor: '#fff',
      bodyColor: '#fff',
    },
  },
}))
</script>
