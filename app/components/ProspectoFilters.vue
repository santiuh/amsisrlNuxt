<template>
  <div class="space-y-2">
    <!-- Búsqueda (solo lista/agenda: busca en filas con acceso completo) -->
    <UInput
      v-if="mostrarBusqueda"
      v-model="filtros.busqueda"
      icon="i-heroicons-magnifying-glass"
      placeholder="Buscar por nombre, teléfono o dirección…"
      size="sm"
      :ui="{ rounded: 'rounded-xl' }"
    />

    <!-- Chips de estado con contadores -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mb-0.5 scrollbar-none">
      <button
        type="button"
        class="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-semibold ring-1 ring-inset transition-colors"
        :class="filtros.estados.length === 0
          ? 'bg-gray-800 text-white ring-gray-800 dark:bg-white dark:text-gray-900 dark:ring-white'
          : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50 dark:bg-white/[0.04] dark:text-slate-300 dark:ring-white/10'"
        @click="filtros.estados = []"
      >
        Todos
        <span class="opacity-60">{{ totalPins }}</span>
      </button>
      <button
        v-for="estado in PROSPECTO_ESTADOS"
        :key="estado"
        type="button"
        class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold ring-1 ring-inset transition-colors"
        :class="filtros.estados.includes(estado)
          ? prospectoEstadoPill(estado) + ' ring-2'
          : 'bg-white text-gray-500 ring-gray-200 hover:bg-gray-50 dark:bg-white/[0.04] dark:text-slate-400 dark:ring-white/10'"
        @click="toggleEstado(estado)"
      >
        <span class="w-2 h-2 rounded-full" :style="{ background: prospectoPinColor(estado) }" />
        {{ prospectoEstadoLabel(estado) }}
        <span class="opacity-60">{{ contadores[estado] ?? 0 }}</span>
      </button>

      <button
        type="button"
        class="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-semibold ring-1 ring-inset transition-colors"
        :class="avanzadosAbiertos || hayAvanzadosActivos
          ? 'bg-cyan-500/10 text-cyan-700 ring-cyan-300/60 dark:text-cyan-300 dark:ring-cyan-500/30'
          : 'bg-white text-gray-500 ring-gray-200 hover:bg-gray-50 dark:bg-white/[0.04] dark:text-slate-400 dark:ring-white/10'"
        @click="avanzadosAbiertos = !avanzadosAbiertos"
      >
        <UIcon name="i-heroicons-funnel" class="w-3.5 h-3.5" />
        Filtros
      </button>

      <button
        v-if="hayFiltrosActivos"
        type="button"
        class="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
        @click="limpiarFiltros(); avanzadosAbiertos = false"
      >
        <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
        Limpiar
      </button>
    </div>

    <!-- Filtros avanzados -->
    <div v-if="avanzadosAbiertos" class="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2">
      <USelect
        v-model="filtros.vendedorId"
        :options="opcionesVendedor"
        size="sm"
        :ui="{ rounded: 'rounded-xl' }"
      />
      <USelect
        v-model="filtros.localidad"
        :options="opcionesLocalidad"
        size="sm"
        :ui="{ rounded: 'rounded-xl' }"
      />
      <USelect
        v-model="sinVisitarModel"
        :options="opcionesSinVisitar"
        size="sm"
        :ui="{ rounded: 'rounded-xl' }"
      />
      <USelect
        v-if="mostrarBusqueda"
        v-model="canalModel"
        :options="opcionesCanal"
        size="sm"
        :ui="{ rounded: 'rounded-xl' }"
      />
      <label class="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-600 dark:text-slate-300 px-1">
        <UToggle v-model="filtros.soloAgendaVencida" size="sm" />
        Revisita vencida
      </label>
      <label class="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-600 dark:text-slate-300 px-1">
        <UToggle v-model="filtros.soloMios" size="sm" />
        Solo míos
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  mostrarBusqueda?: boolean
}>(), { mostrarBusqueda: false })

const {
  pins, contadores, localidades, vendedores, filtros, hayFiltrosActivos, limpiarFiltros,
} = useProspectosMapa()

const avanzadosAbiertos = ref(false)

const totalPins = computed(() =>
  Object.values(contadores.value).reduce((a, b) => a + b, 0),
)

const toggleEstado = (estado: string) => {
  const idx = filtros.value.estados.indexOf(estado)
  if (idx >= 0) filtros.value.estados.splice(idx, 1)
  else filtros.value.estados.push(estado)
}

const hayAvanzadosActivos = computed(() => {
  const f = filtros.value
  return !!f.vendedorId || !!f.localidad || f.sinVisitarDias != null
    || f.soloAgendaVencida || f.soloMios || f.canales.length > 0
})

const opcionesVendedor = computed(() => [
  { label: 'Vendedor: todos', value: '' },
  ...vendedores.value.map(v => ({ label: v.nombre, value: v.id })),
])

const opcionesLocalidad = computed(() => [
  { label: 'Localidad: todas', value: '' },
  ...localidades.value.map(l => ({ label: l, value: l })),
])

const opcionesSinVisitar = [
  { label: 'Sin visitar: cualquiera', value: '' },
  { label: 'Sin visitar hace 7 días', value: '7' },
  { label: 'Sin visitar hace 15 días', value: '15' },
  { label: 'Sin visitar hace 30 días', value: '30' },
  { label: 'Sin visitar hace 60 días', value: '60' },
]

const sinVisitarModel = computed({
  get: () => filtros.value.sinVisitarDias == null ? '' : String(filtros.value.sinVisitarDias),
  set: (v: string) => {
    filtros.value.sinVisitarDias = v === '' ? null : Number(v)
  },
})

const opcionesCanal = computed(() => [
  { label: 'Canal: todos', value: '' },
  ...PROSPECTO_CANALES.map(c => ({ label: CANAL_LABELS[c], value: c })),
])

// v1: un solo canal a la vez desde el select (el array queda por si después
// hace falta multi-select)
const canalModel = computed({
  get: () => filtros.value.canales[0] ?? '',
  set: (v: string) => {
    filtros.value.canales = v ? [v] : []
  },
})

void pins
</script>

<style scoped>
.scrollbar-none {
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
