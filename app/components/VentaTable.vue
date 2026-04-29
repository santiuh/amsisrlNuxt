<template>
  <div class="space-y-4">
    <!-- Filtros + Exportar -->
    <VentaFilters
      v-model:filters="filtersModel"
      v-model:remember="recordarFiltros"
      :show-vendedor="showVendedor"
      :vendedores="vendedoresOptions"
      :localidades="localidadesOptions"
      :can-export="canExport"
      :exporting="exporting"
      @export="$emit('export')"
    />

    <!-- Tabla -->
    <div class="overflow-x-auto -mx-4 sm:mx-0">
    <div class="min-w-[700px] sm:min-w-0">
    <UTable
      :rows="ventas"
      :columns="columnas"
      :loading="loading"
      :sort="sort"
      :ui="{ tr: { base: 'cursor-pointer' } }"
      @update:sort="onSortChange"
      @select="abrirVenta"
    >
      <template #empresa-data="{ row }">
        <UBadge
          :color="row.empresa === 'ultra' ? 'violet' : 'blue'"
          variant="subtle"
          size="xs"
          :label="row.empresa === 'ultra' ? 'Ultra' : 'Express'"
        />
      </template>

      <template #estado-data="{ row }">
        <div class="relative inline-flex">
          <span
            :class="[
              'inline-flex h-7 min-w-[11ch] px-2 items-center justify-center rounded-md text-xs font-semibold ring-1 ring-inset whitespace-nowrap',
              estadoPillClass(row.estado),
            ]"
          >
            {{ estadoLabel(row.estado) }}
          </span>
          <span
            v-if="tieneComentarioNuevo(row)"
            class="absolute -top-1 -right-1 flex h-2.5 w-2.5"
            title="Nuevo comentario"
          >
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
          </span>
        </div>
      </template>

      <template #telefono-data="{ row }">
        <a
          v-if="row.telefono"
          :href="buildWhatsappUrl(row)"
          target="_blank"
          rel="noopener noreferrer"
          class="relative z-10 flex items-center gap-1 text-green-600 dark:text-green-400 hover:underline text-sm"
          @click.stop
          @mousedown.stop
        >
          <UIcon name="i-heroicons-phone" class="w-4 h-4" />
          {{ row.telefono }}
        </a>
        <span v-else class="text-gray-400 dark:text-gray-500">—</span>
      </template>

      <template #precio-data="{ row }">
        <span class="font-medium">{{ formatPrecio(row.precio) }}</span>
      </template>

      <template #fecha_carga-data="{ row }">
        <span class="block text-sm text-gray-600 dark:text-gray-300">{{ formatFecha(row.fecha_carga) }}</span>
        <span class="block text-xs text-gray-400 dark:text-gray-500">{{ formatHora(row.fecha_carga) }}</span>
      </template>

      <template #fecha_coordinacion-data="{ row }">
        <template v-if="row.estado === 'coordinado' && row.fecha_coordinacion">
          <span class="block text-sm text-gray-600 dark:text-gray-300">{{ formatFecha(row.fecha_coordinacion) }}</span>
          <span class="block text-xs text-gray-400 dark:text-gray-500">{{ formatHora(row.fecha_coordinacion) }}</span>
        </template>
        <span v-else class="text-sm text-gray-600 dark:text-gray-300">—</span>
      </template>

      <template #fecha_concretado-data="{ row }">
        <template v-if="row.fecha_concretado">
          <span class="block text-sm text-gray-600 dark:text-gray-300">{{ formatFecha(row.fecha_concretado) }}</span>
          <span class="block text-xs text-gray-400 dark:text-gray-500">{{ formatHora(row.fecha_concretado) }}</span>
        </template>
        <span v-else class="text-sm text-gray-600 dark:text-gray-300">—</span>
      </template>

      <template #localidad-data="{ row }">
        <span class="text-sm">{{ row.dir_localidad || '—' }}</span>
      </template>

      <template #paquete-data="{ row }">
        <span>{{ truncateText(row.paquete_nombre, 16) }}</span>
      </template>

      <template #cliente-data="{ row }">
        <span :title="row.cliente">{{ truncateText(row.cliente, 14) }}</span>
      </template>

      <template #vendedor-data="{ row }">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600">
            <UserAvatar
              :config="row.profiles?.avatar_config ?? null"
              :seed="row.profiles?.nombre ?? ''"
              class="w-full h-full"
            />
          </div>
          <span :title="row.profiles?.nombre ?? ''">{{ formatNombreResumido(row.profiles?.nombre) }}</span>
        </div>
      </template>

    </UTable>
    </div>
    </div>

    <p v-if="!loading && ventas.length === 0" class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
      No hay ventas que coincidan con los filtros.
    </p>

    <!-- Paginación -->
    <div
      v-if="total > 0"
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-200/60 dark:border-white/[0.06]"
    >
      <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <span class="hidden sm:inline">Mostrar</span>
        <USelect
          :model-value="pageSize"
          :options="pageSizeOptions"
          size="xs"
          class="w-[80px]"
          @update:model-value="$emit('update:pageSize', Number($event))"
        />
        <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {{ rangeStart }}–{{ rangeEnd }} de {{ total.toLocaleString('es-AR') }}
        </span>
      </div>

      <UPagination
        :model-value="page"
        :page-count="pageSize"
        :total="total"
        :max="5"
        size="sm"
        @update:model-value="$emit('update:page', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { buildVentaWhatsappUrl } from '~/utils/whatsapp'
import type { VentaFilterState } from '~/components/VentaFilters.vue'
import type { VentasSortState } from '~/composables/useVentasList'

const props = defineProps<{
  ventas: any[]
  loading?: boolean
  total: number
  page: number
  pageSize: number
  sort: VentasSortState
  filters: VentaFilterState
  exporting?: boolean
  canExport?: boolean
  showVendedor?: boolean
  lecturas?: Record<string, string>
  vendedoresOptions: { label: string; value: string }[]
  localidadesOptions: { label: string; value: string }[]
}>()

const emit = defineEmits<{
  'update:page': [value: number]
  'update:pageSize': [value: number]
  'update:sort': [value: VentasSortState]
  export: []
}>()

const STORAGE_REMEMBER_KEY = 'ventas-filtros-recordar'
const STORAGE_FILTERS_KEY = 'ventas-filtros'

const recordarFiltros = ref(false)

const filtersModel = toRef(props, 'filters')

const pageSizeOptions = [
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
]

const rangeStart = computed(() =>
  props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1,
)
const rangeEnd = computed(() =>
  Math.min(props.page * props.pageSize, props.total),
)

const columnas = computed(() => {
  const base = [
    { key: 'fecha_carga', label: 'Fecha', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
    { key: 'empresa', label: 'Empresa', sortable: true },
    { key: 'cliente', label: 'Cliente', sortable: true },
    { key: 'dni_cuil', label: 'DNI/CUIL', sortable: true },
    { key: 'telefono', label: 'Teléfono', sortable: true },
    { key: 'localidad', label: 'Localidad', sortable: true },
    { key: 'paquete', label: 'Paquete', sortable: true },
    { key: 'precio', label: 'Precio', sortable: true },
    { key: 'fecha_coordinacion', label: 'Turno', sortable: true },
    { key: 'fecha_concretado', label: 'Concretado', sortable: true },
  ]
  if (props.showVendedor) {
    base.splice(2, 0, { key: 'vendedor', label: 'Vendedor', sortable: true })
  }
  return base
})

function onSortChange(next: { column: string; direction: 'asc' | 'desc' }) {
  emit('update:sort', { column: next.column, direction: next.direction })
}

const estadoLabel = (e: string) => ({
  pendiente: 'Pendiente', en_proceso: 'En Proceso', en_conflicto: 'En Conflicto',
  rechazado: 'Rechazado', coordinado: 'Coordinado', concretado: 'Concretado', proxima_zona: 'Próxima Zona',
}[e] ?? e)

const estadoPillClass = (e: string) => ({
  pendiente: 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/40',
  en_proceso: 'bg-amber-50 text-amber-700 ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  en_conflicto: 'bg-orange-50 text-orange-700 ring-orange-200/60 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/20',
  rechazado: 'bg-rose-50 text-rose-700 ring-rose-200/60 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
  coordinado: 'bg-cyan-50 text-cyan-700 ring-cyan-200/60 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/20',
  concretado: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  proxima_zona: 'bg-violet-50 text-violet-700 ring-violet-200/60 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20',
}[e] ?? 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/40')

const tieneComentarioNuevo = (venta: any): boolean => {
  if (!props.lecturas) return false
  const log = venta.comentarios_gestion
  if (!Array.isArray(log) || log.length === 0) return false
  const comentarios = log.filter((e: any) => e.tipo === 'comentario')
  if (comentarios.length === 0) return false
  const ultimoComentario = comentarios[0]?.fecha_hora
  if (!ultimoComentario) return false
  const ultimaLectura = props.lecturas[venta.id]
  if (!ultimaLectura) return true
  return new Date(ultimoComentario) > new Date(ultimaLectura)
}

const formatPrecio = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

const truncateText = (value: unknown, max = 16) => {
  const text = typeof value === 'string' ? value : ''
  if (!text) return '—'
  return text.length > max ? `${text.slice(0, max)}…` : text
}

const buildWhatsappUrl = (row: any) => {
  return buildVentaWhatsappUrl(row) || '#'
}

const abrirVenta = (row: any) => {
  if (!row?.id) return
  navigateTo(`/ventas/${row.id}`)
}

const formatNombreResumido = (value: unknown) => {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return '—'
  const parts = text.split(/\s+/).filter(Boolean)
  if (parts.length < 2) return parts[0]
  const [nombre, apellido = ''] = parts
  return `${nombre} ${apellido.charAt(0)}.`
}

const applySavedFilters = (raw: unknown) => {
  if (!raw || typeof raw !== 'object') return
  const candidate = raw as Partial<VentaFilterState>
  const f = props.filters
  f.search = typeof candidate.search === 'string' ? candidate.search : ''
  f.estado = typeof candidate.estado === 'string' ? candidate.estado : ''
  f.fechaDesde = typeof candidate.fechaDesde === 'string' ? candidate.fechaDesde : ''
  f.fechaHasta = typeof candidate.fechaHasta === 'string' ? candidate.fechaHasta : ''
  f.fechaConcretadoDesde = typeof candidate.fechaConcretadoDesde === 'string' ? candidate.fechaConcretadoDesde : ''
  f.fechaConcretadoHasta = typeof candidate.fechaConcretadoHasta === 'string' ? candidate.fechaConcretadoHasta : ''
  f.vendedor = typeof candidate.vendedor === 'string' ? candidate.vendedor : ''
  f.localidad = typeof candidate.localidad === 'string' ? candidate.localidad : ''
  f.empresa = typeof candidate.empresa === 'string' ? candidate.empresa : ''
}

onMounted(() => {
  if (!import.meta.client) return

  recordarFiltros.value = localStorage.getItem(STORAGE_REMEMBER_KEY) === '1'
  if (!recordarFiltros.value) return

  try {
    const saved = localStorage.getItem(STORAGE_FILTERS_KEY)
    if (!saved) return
    applySavedFilters(JSON.parse(saved))
  } catch {
    localStorage.removeItem(STORAGE_FILTERS_KEY)
  }
})

watch(recordarFiltros, (enabled) => {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_REMEMBER_KEY, enabled ? '1' : '0')

  if (enabled) {
    localStorage.setItem(STORAGE_FILTERS_KEY, JSON.stringify(props.filters))
    return
  }

  localStorage.removeItem(STORAGE_FILTERS_KEY)
})

watch(
  () => ({ ...props.filters }),
  (next) => {
    if (!import.meta.client || !recordarFiltros.value) return
    localStorage.setItem(STORAGE_FILTERS_KEY, JSON.stringify(next))
  },
  { deep: true },
)
</script>
