<template>
  <div class="space-y-3">
    <!-- Fila 1: búsqueda + selects -->
    <div class="flex flex-wrap items-center gap-3">
      <UInput
        :model-value="filters.search"
        placeholder="Buscar cliente o DNI/CUIL..."
        icon="i-heroicons-magnifying-glass"
        class="w-full sm:w-72"
        @update:model-value="filters.search = $event"
      />
      <USelect
        :model-value="filters.estado"
        :options="estadoOptions"
        class="w-full sm:w-48"
        @update:model-value="filters.estado = $event"
      />
      <USelect
        :model-value="filters.formaPago"
        :options="formaPagoOptions"
        class="w-full sm:w-48"
        @update:model-value="filters.formaPago = $event"
      />
      <USelect
        v-if="showVendedor"
        :model-value="filters.vendedor"
        :options="vendedores"
        class="w-full sm:w-48"
        @update:model-value="filters.vendedor = $event"
      />
    </div>

    <!-- Fila 2: presets de fecha + date pickers -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="flex flex-wrap gap-1.5">
        <UButton
          v-for="p in presets"
          :key="p.key"
          :label="p.label"
          size="xs"
          :color="presetActivo === p.key ? 'primary' : 'gray'"
          :variant="presetActivo === p.key ? 'solid' : 'outline'"
          @click="aplicarPreset(p.key)"
        />
      </div>

      <div class="flex items-center gap-2">
        <UInput
          :model-value="filters.fechaDesde"
          type="date"
          class="w-36"
          @update:model-value="setFechaDesde($event)"
        />
        <span class="text-gray-400 text-sm">a</span>
        <UInput
          :model-value="filters.fechaHasta"
          type="date"
          class="w-36"
          @update:model-value="setFechaHasta($event)"
        />
      </div>

      <UButton
        v-if="tieneAlgunFiltro"
        icon="i-heroicons-x-mark"
        label="Limpiar"
        size="xs"
        color="gray"
        variant="ghost"
        @click="limpiarFiltros"
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
  vendedor: string
  formaPago: string
}

const props = defineProps<{
  showVendedor?: boolean
  vendedores: { label: string; value: string }[]
}>()

const filters = defineModel<VentaFilterState>('filters', { required: true }) as Ref<VentaFilterState>

const presetActivo = ref('')

const estadoOptions = [
  { label: 'Todos los estados', value: '' },
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'En Proceso', value: 'en_proceso' },
  { label: 'En Conflicto', value: 'en_conflicto' },
  { label: 'Rechazado', value: 'rechazado' },
  { label: 'Coordinado', value: 'coordinado' },
  { label: 'Concretado', value: 'concretado' },
]

const formaPagoOptions = [
  { label: 'Todas las formas', value: '' },
  { label: 'Débito', value: 'debito' },
  { label: 'Transferencia', value: 'transferencia' },
  { label: 'Efectivo', value: 'efectivo' },
]

const presets = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Última semana' },
  { key: 'este_mes', label: 'Este mes' },
  { key: 'mes_pasado', label: 'Mes pasado' },
]

const tieneAlgunFiltro = computed(() =>
  filters.value.search || filters.value.estado || filters.value.fechaDesde ||
  filters.value.fechaHasta || filters.value.vendedor || filters.value.formaPago,
)

const yyyy = (d: Date): string => d.toISOString().split('T')[0]!

function aplicarPreset(preset: string) {
  const hoy = new Date()
  presetActivo.value = preset

  switch (preset) {
    case 'hoy':
      filters.value.fechaDesde = yyyy(hoy)
      filters.value.fechaHasta = yyyy(hoy)
      break
    case 'semana': {
      const inicio = new Date(hoy)
      inicio.setDate(hoy.getDate() - 7)
      filters.value.fechaDesde = yyyy(inicio)
      filters.value.fechaHasta = yyyy(hoy)
      break
    }
    case 'este_mes': {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      filters.value.fechaDesde = yyyy(inicio)
      filters.value.fechaHasta = yyyy(hoy)
      break
    }
    case 'mes_pasado': {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
      filters.value.fechaDesde = yyyy(inicio)
      filters.value.fechaHasta = yyyy(fin)
      break
    }
  }
}

function setFechaDesde(val: string) {
  filters.value.fechaDesde = val
  presetActivo.value = ''
}

function setFechaHasta(val: string) {
  filters.value.fechaHasta = val
  presetActivo.value = ''
}

function limpiarFiltros() {
  filters.value.search = ''
  filters.value.estado = ''
  filters.value.fechaDesde = ''
  filters.value.fechaHasta = ''
  filters.value.vendedor = ''
  filters.value.formaPago = ''
  presetActivo.value = ''
}
</script>
