<template>
  <div class="rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div>
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Actividad del Personal</h3>
        <p v-if="subtituloHistorial" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {{ subtituloHistorial }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <USelect
          v-model="preset"
          :options="presetOptions"
          size="sm"
          class="w-36"
        />
        <template v-if="preset === 'custom'">
          <UInput v-model="customFrom" type="date" size="sm" />
          <span class="text-xs text-gray-400">→</span>
          <UInput v-model="customTo" type="date" size="sm" />
        </template>
        <USelect
          v-model="oficinistaIdModel"
          :options="oficinistaOptions"
          size="sm"
          class="w-44"
        />
      </div>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="flex justify-center py-6">
      <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-gray-400 animate-spin" />
    </div>
    <div v-else-if="error" class="px-5 py-6 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </div>

    <template v-else>
      <!-- Tabla resumen -->
      <div class="overflow-x-auto p-1">
        <UTable :rows="summaryWithToday" :columns="columns">
          <template #usuario-data="{ row }">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600">
                <UserAvatar :config="row.avatar_config" :seed="row.nombre" class="w-full h-full" />
              </div>
              <span :title="row.nombre">{{ row.nombre }}</span>
              <span
                class="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded"
                :class="rolChipClass(row.rol)"
              >
                {{ rolLabel(row.rol) }}
              </span>
            </div>
          </template>
          <template #accionesHoy-data="{ row }">
            <span :class="row.accionesHoy > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-300 dark:text-gray-600'">
              {{ row.accionesHoy }}
            </span>
          </template>
          <template #horarioHoy-data="{ row }">
            <span class="text-xs font-mono" :class="row.horarioHoy !== '—' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'">
              {{ row.horarioHoy }}
            </span>
          </template>
          <template #ultimaActividad-data="{ row }">
            <span v-if="row.ultimaActividad" :title="formatFullDate(row.ultimaActividad)" class="text-gray-700 dark:text-gray-300">
              {{ formatRelative(row.ultimaActividad) }}
            </span>
            <span v-else class="text-gray-400 dark:text-gray-500">—</span>
          </template>
        </UTable>
      </div>

      <!-- Sesiones de trabajo -->
      <ActividadSesiones :sessions="workingSessions" :oficinistas="oficinistas" />

      <!-- Heatmap horario -->
      <div class="px-5 pt-5 pb-4 border-t border-gray-100 dark:border-white/[0.06] mt-2">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Horario de trabajo (día × hora)
          </h4>
          <span class="text-xs text-gray-400">
            {{ oficinistaIdModel ? nombrePorId(oficinistaIdModel) : 'Todo el personal' }}
          </span>
        </div>
        <div v-if="heatmapMax === 0" class="text-xs text-gray-400 dark:text-gray-500 py-4 text-center">
          Sin actividad en este rango.
        </div>
        <div v-else class="overflow-x-auto">
          <div class="inline-block min-w-full">
            <!-- Header de horas -->
            <div class="grid" :style="{ gridTemplateColumns: '2.5rem repeat(24, minmax(1rem, 1fr))' }">
              <div></div>
              <div
                v-for="h in 24"
                :key="`hh-${h}`"
                class="text-[10px] text-gray-400 dark:text-gray-500 text-center"
              >
                {{ (h - 1).toString().padStart(2, '0') }}
              </div>
            </div>
            <!-- Filas por día -->
            <div
              v-for="(dayLabel, d) in diasLabel"
              :key="`row-${d}`"
              class="grid gap-0.5 mt-0.5"
              :style="{ gridTemplateColumns: '2.5rem repeat(24, minmax(1rem, 1fr))' }"
            >
              <div class="text-[10px] text-gray-500 dark:text-gray-400 flex items-center">
                {{ dayLabel }}
              </div>
              <div
                v-for="h in 24"
                :key="`c-${d}-${h - 1}`"
                class="aspect-square rounded-sm"
                :class="cellClass(heatmapGrid[d][h - 1], heatmapMax)"
                :title="`${dayLabel} ${(h - 1).toString().padStart(2, '0')}:00 — ${heatmapGrid[d][h - 1]} accion${heatmapGrid[d][h - 1] === 1 ? '' : 'es'}`"
              />
            </div>
          </div>
        </div>
        <!-- Leyenda -->
        <div class="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400 dark:text-gray-500">
          <span>Menos</span>
          <div class="w-3 h-3 rounded-sm bg-gray-100 dark:bg-white/[0.05]" />
          <div class="w-3 h-3 rounded-sm bg-indigo-100 dark:bg-indigo-900/40" />
          <div class="w-3 h-3 rounded-sm bg-indigo-300 dark:bg-indigo-700/60" />
          <div class="w-3 h-3 rounded-sm bg-indigo-500 dark:bg-indigo-500" />
          <div class="w-3 h-3 rounded-sm bg-indigo-700 dark:bg-indigo-400" />
          <span>Más</span>
        </div>
      </div>

      <!-- Bar chart timeline -->
      <div v-if="timeline.labels.length > 0" class="px-5 pb-5 pt-2">
        <DashboardBarChart
          title="Acciones por día"
          :labels="timeline.labels"
          :datasets="timeline.datasets"
          :stacked="true"
        />
      </div>
      <!-- Feed de actividad -->
      <ActividadFeed :feed="activityFeed" />
    </template>
  </div>
</template>

<script setup lang="ts">
const {
  preset,
  customFrom,
  customTo,
  oficinistaId,
  oficinistas,
  loading,
  error,
  fetchData,
  summary,
  heatmap,
  timeline,
  inicioHistorial,
  activityFeed,
  workingSessions,
  todayStats,
} = useOficinistaActivity()

// Cargar al montar
onMounted(() => {
  fetchData()
})

const presetOptions = [
  { label: 'Hoy', value: 'hoy' },
  { label: 'Últimos 7 días', value: '7dias' },
  { label: 'Últimos 30 días', value: '30dias' },
  { label: 'Ciclo actual', value: 'ciclo' },
  { label: 'Personalizado', value: 'custom' },
]

const oficinistaOptions = computed(() => [
  { label: 'Todo el personal', value: '' },
  ...oficinistas.value.map(o => ({
    label: `${o.nombre}${o.rol === 'admin' ? ' (admin)' : ''}`,
    value: o.id,
  })),
])

// USelect del filtro: usa string vacío como "todas" pero el composable maneja null
const oficinistaIdModel = computed({
  get: () => oficinistaId.value ?? '',
  set: (val: string) => { oficinistaId.value = val || null },
})

const nombrePorId = (id: string) => oficinistas.value.find(o => o.id === id)?.nombre ?? ''

const columns = [
  { key: 'usuario', label: 'Usuario' },
  { key: 'accionesHoy', label: 'Hoy', sortable: true },
  { key: 'horarioHoy', label: 'Horario hoy' },
  { key: 'acciones', label: 'Acciones', sortable: true },
  { key: 'turnosCoordinados', label: 'Turnos coord.', sortable: true },
  { key: 'ventasConcretadas', label: 'Concretadas', sortable: true },
  { key: 'cargaActual', label: 'Carga actual', sortable: true },
  { key: 'ultimaActividad', label: 'Última actividad' },
]

// Enriquecer summary con datos de hoy
const summaryWithToday = computed(() => {
  return summary.value.map(row => {
    const stat = row.id ? todayStats.value.get(row.id) : null
    const accionesHoy = stat?.acciones ?? 0
    let horarioHoy = '—'
    if (stat?.firstAction && stat?.lastAction) {
      const f = new Date(stat.firstAction).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      const l = new Date(stat.lastAction).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      horarioHoy = f === l ? f : `${f} - ${l}`
    }
    return { ...row, accionesHoy, horarioHoy }
  })
})

const rolLabel = (rol: string) => {
  if (rol === 'admin') return 'Admin'
  if (rol === 'oficinista') return 'Oficinista'
  return 'Eliminado'
}

const rolChipClass = (rol: string) => {
  if (rol === 'admin') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  if (rol === 'oficinista') return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300'
  return 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400'
}

const diasLabel = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// Heatmap: depende del oficinista seleccionado (o todas)
const heatmapData = computed(() => heatmap(oficinistaId.value))
const heatmapGrid = computed(() => heatmapData.value.grid)
const heatmapMax = computed(() => heatmapData.value.max)

const cellClass = (n: number, max: number) => {
  if (max === 0 || n === 0) return 'bg-gray-100 dark:bg-white/[0.04]'
  const ratio = n / max
  if (ratio <= 0.2) return 'bg-indigo-100 dark:bg-indigo-900/40'
  if (ratio <= 0.4) return 'bg-indigo-200 dark:bg-indigo-800/60'
  if (ratio <= 0.6) return 'bg-indigo-300 dark:bg-indigo-700/70'
  if (ratio <= 0.8) return 'bg-indigo-500 dark:bg-indigo-500'
  return 'bg-indigo-700 dark:bg-indigo-400'
}

const formatRelative = (iso: string) => {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'hace <1 min'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `hace ${diffH} h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `hace ${diffD} d`
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

const formatFullDate = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const subtituloHistorial = computed(() => {
  if (!inicioHistorial.value) return null
  const d = new Date(inicioHistorial.value)
  return `Desde ${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
})
</script>
