<template>
  <div class="rounded-2xl bg-white shadow-card ring-1 ring-gray-100 p-5 dark:bg-white/[0.03] dark:ring-white/[0.06]">
    <div class="flex items-center justify-between gap-3 mb-4">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ title }}</h3>
      <div
        class="inline-flex items-center rounded-full bg-gray-100 dark:bg-white/[0.06] p-0.5 ring-1 ring-gray-200/60 dark:ring-white/[0.08]"
      >
        <button
          type="button"
          class="px-2.5 py-1 text-[11px] font-semibold rounded-full transition-colors"
          :class="modo === 'separadas'
            ? 'bg-white text-gray-800 shadow-sm dark:bg-white/[0.12] dark:text-gray-100'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
          @click="modo = 'separadas'"
        >
          Separadas
        </button>
        <button
          type="button"
          class="px-2.5 py-1 text-[11px] font-semibold rounded-full transition-colors"
          :class="modo === 'combinadas'
            ? 'bg-white text-gray-800 shadow-sm dark:bg-white/[0.12] dark:text-gray-100'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
          @click="modo = 'combinadas'"
        >
          Combinadas
        </button>
      </div>
    </div>
    <div v-if="isEmpty" class="flex h-48 items-center justify-center text-xs font-medium text-gray-400 dark:text-gray-500">
      Sin actividad en los ciclos registrados
    </div>
    <Line v-else :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'

interface Dataset {
  label: string
  data: number[]
  color: string
}

const props = defineProps<{
  title: string
  labels: string[]
  datasets: Dataset[]
}>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const modo = ref<'separadas' | 'combinadas'>('separadas')

const isEmpty = computed(() =>
  props.labels.length === 0
  || props.datasets.length === 0
  || props.datasets.every(ds => ds.data.every(v => !v)),
)

const chartData = computed(() => {
  if (modo.value === 'combinadas') {
    const len = props.labels.length
    const sum = Array.from({ length: len }, (_, i) =>
      props.datasets.reduce((acc, ds) => acc + (ds.data[i] ?? 0), 0),
    )
    return {
      labels: props.labels,
      datasets: [{
        label: 'Total',
        data: sum,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6,182,212,0.12)',
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3.5,
        pointHoverRadius: 5,
        pointBackgroundColor: '#06b6d4',
        fill: false,
      }],
    }
  }

  return {
    labels: props.labels,
    datasets: props.datasets.map(ds => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color,
      backgroundColor: ds.color + '20',
      tension: 0.35,
      borderWidth: 2,
      pointRadius: 3.5,
      pointHoverRadius: 5,
      pointBackgroundColor: ds.color,
      fill: false,
    })),
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  interaction: { mode: 'index' as const, intersect: false },
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
        boxWidth: 8,
        boxHeight: 8,
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
