<template>
  <div class="space-y-3">
    <!-- Fila 1: Búsqueda + limpiar + exportar + recordar -->
    <div class="flex items-center gap-2.5">
      <UInput
        :model-value="filters.search"
        placeholder="Buscar cliente o DNI/CUIL..."
        icon="i-heroicons-magnifying-glass"
        class="flex-1 min-w-0"
        @update:model-value="filters.search = $event"
      />
      <Transition name="clear-filters">
        <button
          v-if="countFiltrosActivos > 0"
          type="button"
          class="group inline-flex items-center gap-1.5 px-2.5 h-9 shrink-0 rounded-md
                 bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]
                 ring-1 ring-inset ring-gray-200/80 dark:ring-white/[0.08]
                 hover:ring-gray-300 dark:hover:ring-white/[0.16]
                 text-xs font-medium text-gray-600 dark:text-gray-300
                 transition-all"
          :title="`Limpiar ${countFiltrosActivos} filtro${countFiltrosActivos === 1 ? '' : 's'}`"
          @click="limpiarFiltros"
        >
          <UIcon
            name="i-heroicons-x-mark"
            class="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors"
          />
          <span class="hidden sm:inline">Limpiar</span>
          <span
            class="inline-flex items-center justify-center min-w-[1.25rem] h-[1.125rem] px-1 rounded
                   bg-gray-200/80 dark:bg-white/[0.1]
                   text-[10px] font-semibold tabular-nums text-gray-700 dark:text-gray-200"
          >
            {{ countFiltrosActivos }}
          </span>
        </button>
      </Transition>
      <UButton
        v-if="canExport"
        icon="i-heroicons-arrow-down-tray"
        label="Exportar CSV"
        color="gray"
        variant="outline"
        size="sm"
        class="shrink-0 hidden sm:flex"
        :loading="exporting"
        :disabled="exporting"
        @click="$emit('export')"
      />
      <label class="shrink-0 hidden sm:flex items-center gap-2 cursor-pointer select-none">
        <UToggle v-model="remember" color="primary" size="sm" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">Recordar filtros</span>
      </label>
    </div>

    <!-- Fila 2: Empresa toggle + selects -->
    <div class="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5">
      <EmpresaToggle
        :model-value="filters.empresa"
        :show-todas="true"
        @update:model-value="filters.empresa = $event"
      />
      <USelect
        :model-value="filters.estado"
        :options="estadoOptions"
        class="sm:flex-1 sm:min-w-[140px]"
        @update:model-value="filters.estado = $event"
      />
      <USelect
        v-if="showVendedor"
        :model-value="filters.vendedor"
        :options="vendedores"
        class="sm:flex-1 sm:min-w-[140px]"
        @update:model-value="filters.vendedor = $event"
      />
      <USelect
        v-if="localidades?.length > 1"
        :model-value="filters.localidad"
        :options="localidades"
        class="sm:flex-1 sm:min-w-[140px]"
        @update:model-value="filters.localidad = $event"
      />
    </div>

    <!-- Fila 3: Paneles de fechas lado a lado -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <!-- Fecha de carga -->
      <div class="rounded-lg bg-gray-50/80 dark:bg-white/[0.03] ring-1 ring-gray-200/60 dark:ring-white/[0.06] px-3.5 py-3 space-y-2">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-calendar-days" class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <span class="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Fecha de carga</span>
        </div>
        <div class="grid grid-cols-4 gap-1.5">
          <UButton
            v-for="p in presets"
            :key="'carga-' + p.key"
            :label="p.label"
            size="xs"
            :color="presetCargaActivo === p.key ? 'primary' : 'gray'"
            :variant="presetCargaActivo === p.key ? 'solid' : 'outline'"
            class="justify-center"
            :ui="{ rounded: 'rounded-md' }"
            :aria-pressed="presetCargaActivo === p.key"
            :title="presetCargaActivo === p.key ? 'Click para deseleccionar' : p.label"
            @click="aplicarPresetCarga(p.key)"
          />
        </div>
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <UInput
            :model-value="filters.fechaDesde"
            type="date"
            @update:model-value="setFechaCargaDesde($event)"
          />
          <span class="text-gray-400 dark:text-gray-500 text-xs">a</span>
          <UInput
            :model-value="filters.fechaHasta"
            type="date"
            @update:model-value="setFechaCargaHasta($event)"
          />
        </div>
      </div>

      <!-- Fecha de concretado -->
      <div class="rounded-lg bg-gray-50/80 dark:bg-white/[0.03] ring-1 ring-gray-200/60 dark:ring-white/[0.06] px-3.5 py-3 space-y-2">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-badge" class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <span class="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Fecha de concretado</span>
        </div>
        <div class="grid grid-cols-4 gap-1.5">
          <UButton
            v-for="p in presets"
            :key="'concretado-' + p.key"
            :label="p.label"
            size="xs"
            :color="presetConcretadoActivo === p.key ? 'primary' : 'gray'"
            :variant="presetConcretadoActivo === p.key ? 'solid' : 'outline'"
            class="justify-center"
            :ui="{ rounded: 'rounded-md' }"
            :aria-pressed="presetConcretadoActivo === p.key"
            :title="presetConcretadoActivo === p.key ? 'Click para deseleccionar' : p.label"
            @click="aplicarPresetConcretado(p.key)"
          />
        </div>
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <UInput
            :model-value="filters.fechaConcretadoDesde"
            type="date"
            @update:model-value="setFechaConcretadoDesde($event)"
          />
          <span class="text-gray-400 dark:text-gray-500 text-xs">a</span>
          <UInput
            :model-value="filters.fechaConcretadoHasta"
            type="date"
            @update:model-value="setFechaConcretadoHasta($event)"
          />
        </div>
      </div>
    </div>

    <!-- Fila 4: Acciones (solo mobile) -->
    <div class="flex items-center justify-between sm:hidden">
      <label class="flex items-center gap-2 cursor-pointer select-none">
        <UToggle v-model="remember" color="primary" size="sm" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Recordar filtros</span>
      </label>
      <UButton
        v-if="canExport"
        icon="i-heroicons-arrow-down-tray"
        label="Exportar CSV"
        color="gray"
        variant="outline"
        size="xs"
        :loading="exporting"
        :disabled="exporting"
        @click="$emit('export')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
export interface VentaFilterState {
  search: string
  estado: string
  fechaDesde: string
  fechaHasta: string
  fechaConcretadoDesde: string
  fechaConcretadoHasta: string
  vendedor: string
  localidad: string
  empresa: string
}

const props = withDefaults(defineProps<{
  showVendedor?: boolean
  vendedores: { label: string; value: string }[]
  localidades?: { label: string; value: string }[]
  canExport?: boolean
  exporting?: boolean
}>(), {
  localidades: () => [],
})

defineEmits<{
  export: []
}>()

const filters = defineModel<VentaFilterState>('filters', { required: true }) as Ref<VentaFilterState>
const remember = defineModel<boolean>('remember', { default: false })

const presetCargaActivo = ref('')
const presetConcretadoActivo = ref('')

const estadoOptions = [
  { label: 'Todos los estados', value: '' },
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'En Proceso', value: 'en_proceso' },
  { label: 'En Conflicto', value: 'en_conflicto' },
  { label: 'Rechazado', value: 'rechazado' },
  { label: 'Coordinado', value: 'coordinado' },
  { label: 'Concretado', value: 'concretado' },
  { label: 'Próxima Zona', value: 'proxima_zona' },
]

const presets = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Última semana' },
  { key: 'este_mes', label: 'Este mes' },
  { key: 'mes_pasado', label: 'Mes pasado' },
]

const countFiltrosActivos = computed(() => {
  const f = filters.value
  let n = 0
  if (f.search) n++
  if (f.estado) n++
  if (f.fechaDesde || f.fechaHasta) n++
  if (f.fechaConcretadoDesde || f.fechaConcretadoHasta) n++
  if (f.vendedor) n++
  if (f.localidad) n++
  if (f.empresa) n++
  return n
})

const yyyy = (d: Date): string => d.toISOString().split('T')[0]!

function calcularRango(preset: string): { desde: string; hasta: string } {
  const hoy = new Date()
  switch (preset) {
    case 'hoy':
      return { desde: yyyy(hoy), hasta: yyyy(hoy) }
    case 'semana': {
      const inicio = new Date(hoy)
      inicio.setDate(hoy.getDate() - 7)
      return { desde: yyyy(inicio), hasta: yyyy(hoy) }
    }
    case 'este_mes': {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      return { desde: yyyy(inicio), hasta: yyyy(hoy) }
    }
    case 'mes_pasado': {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
      return { desde: yyyy(inicio), hasta: yyyy(fin) }
    }
    default:
      return { desde: '', hasta: '' }
  }
}

function aplicarPresetCarga(preset: string) {
  if (presetCargaActivo.value === preset) {
    presetCargaActivo.value = ''
    filters.value.fechaDesde = ''
    filters.value.fechaHasta = ''
    return
  }
  presetCargaActivo.value = preset
  const { desde, hasta } = calcularRango(preset)
  filters.value.fechaDesde = desde
  filters.value.fechaHasta = hasta
}

function aplicarPresetConcretado(preset: string) {
  if (presetConcretadoActivo.value === preset) {
    presetConcretadoActivo.value = ''
    filters.value.fechaConcretadoDesde = ''
    filters.value.fechaConcretadoHasta = ''
    return
  }
  presetConcretadoActivo.value = preset
  const { desde, hasta } = calcularRango(preset)
  filters.value.fechaConcretadoDesde = desde
  filters.value.fechaConcretadoHasta = hasta
}

function setFechaCargaDesde(val: string) {
  filters.value.fechaDesde = val
  presetCargaActivo.value = ''
}

function setFechaCargaHasta(val: string) {
  filters.value.fechaHasta = val
  presetCargaActivo.value = ''
}

function setFechaConcretadoDesde(val: string) {
  filters.value.fechaConcretadoDesde = val
  presetConcretadoActivo.value = ''
}

function setFechaConcretadoHasta(val: string) {
  filters.value.fechaConcretadoHasta = val
  presetConcretadoActivo.value = ''
}

function limpiarFiltros() {
  filters.value.search = ''
  filters.value.estado = ''
  filters.value.fechaDesde = ''
  filters.value.fechaHasta = ''
  filters.value.fechaConcretadoDesde = ''
  filters.value.fechaConcretadoHasta = ''
  filters.value.vendedor = ''
  filters.value.localidad = ''
  filters.value.empresa = ''
  presetCargaActivo.value = ''
  presetConcretadoActivo.value = ''
}
</script>

<style scoped>
.clear-filters-enter-active,
.clear-filters-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}
.clear-filters-enter-from,
.clear-filters-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>
