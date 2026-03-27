<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base">{{ title }}</h3>
    </template>
    <div class="flex justify-center">
      <div class="w-full max-w-xs">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </UCard>
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
const textColor = computed(() => colorMode.value === 'dark' ? '#d1d5db' : '#374151')

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.data,
      backgroundColor: props.colors,
      borderColor: colorMode.value === 'dark' ? '#1f2937' : '#ffffff',
      borderWidth: 2,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
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
