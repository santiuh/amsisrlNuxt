<template>
  <div class="space-y-4">
    <!-- Filtros + Exportar -->
    <div class="flex flex-col gap-3">
      <div class="flex items-start justify-between gap-3">
        <VentaFilters
          v-model:filters="filters"
          v-model:remember="recordarFiltros"
          :show-vendedor="showVendedor"
          :vendedores="vendedoresOptions"
          :localidades="localidadesOptions"
          class="flex-1"
        />
        <UButton
          v-if="canExport"
          icon="i-heroicons-arrow-down-tray"
          label="Exportar CSV"
          color="gray"
          variant="outline"
          size="sm"
          class="shrink-0 hidden sm:flex"
          @click="handleExport"
        />
      </div>
      <UButton
        v-if="canExport"
        icon="i-heroicons-arrow-down-tray"
        label="Exportar CSV"
        color="gray"
        variant="outline"
        size="sm"
        class="self-end sm:hidden"
        @click="handleExport"
      />
    </div>

    <!-- Tabla -->
    <div class="overflow-x-auto -mx-4 sm:mx-0">
    <div class="min-w-[700px] sm:min-w-0">
    <UTable
      :rows="ventasFiltradas"
      :columns="columnas"
      :loading="loading"
      :ui="{ tr: { base: 'cursor-pointer' } }"
      @select="abrirVenta"
    >
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
        <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatFecha(row.fecha_carga) }}</span>
      </template>

      <template #fecha_coordinacion-data="{ row }">
        <span class="text-sm text-gray-600 dark:text-gray-300">
          {{ row.estado === 'coordinado' && row.fecha_coordinacion ? formatFechaHora(row.fecha_coordinacion) : '—' }}
        </span>
      </template>

      <template #localidad-data="{ row }">
        <span class="text-sm">{{ row.dir_localidad || '—' }}</span>
      </template>

      <template #paquete-data="{ row }">
        <span>{{ truncateText(row.paquete_nombre, 16) }}</span>
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

    <p v-if="!loading && !ventasFiltradas.length" class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
      No hay ventas que coincidan con los filtros.
    </p>
  </div>
</template>

<script setup lang="ts">
import { exportCsv } from '~/utils/exportCsv'
import { buildVentaWhatsappUrl } from '~/utils/whatsapp'
import type { VentaFilterState } from '~/components/VentaFilters.vue'

const props = defineProps<{
  ventas: any[]
  loading?: boolean
  canExport?: boolean
  showVendedor?: boolean
  lecturas?: Record<string, string>  // venta_id → ultima_lectura ISO
}>()

const STORAGE_REMEMBER_KEY = 'ventas-filtros-recordar'
const STORAGE_FILTERS_KEY = 'ventas-filtros'

const defaultFilters = (): VentaFilterState => ({
  search: '',
  estado: '',
  fechaDesde: '',
  fechaHasta: '',
  vendedor: '',
  localidad: '',
})

const recordarFiltros = ref(false)

const filters = reactive<VentaFilterState>(defaultFilters())

const vendedoresOptions = computed(() => {
  const map = new Map<string, string>()
  props.ventas.forEach(v => {
    if (v.vendedor_id && v.profiles?.nombre) {
      map.set(v.vendedor_id, v.profiles.nombre)
    }
  })
  return [
    { label: 'Todos los vendedores', value: '' },
    ...Array.from(map, ([value, label]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ]
})

const localidadesOptions = computed(() => {
  const set = new Set<string>()
  props.ventas.forEach(v => {
    if (v.dir_localidad) set.add(v.dir_localidad)
  })
  return [
    { label: 'Todas las localidades', value: '' },
    ...[...set].sort().map(l => ({ label: l, value: l })),
  ]
})

const columnas = computed(() => {
  const base = [
    { key: 'fecha_carga', label: 'Fecha' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'dni_cuil', label: 'DNI/CUIL' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'localidad', label: 'Localidad' },
    { key: 'paquete', label: 'Paquete' },
    { key: 'precio', label: 'Precio' },
    { key: 'fecha_coordinacion', label: 'Hora coordinada' },
    { key: 'estado', label: 'Estado' },
  ]
  if (props.showVendedor) {
    base.splice(2, 0, { key: 'vendedor', label: 'Vendedor' })
  }
  return base
})

const ventasFiltradas = computed(() =>
  props.ventas.filter(v => {
    const q = filters.search.toLowerCase()
    const matchSearch = !q ||
      v.cliente?.toLowerCase().includes(q) ||
      v.dni_cuil?.toLowerCase().includes(q)
    const matchEstado = !filters.estado || v.estado === filters.estado
    const fechaVenta = v.fecha_carga?.split('T')[0] ?? ''
    const matchFechaDesde = !filters.fechaDesde || fechaVenta >= filters.fechaDesde
    const matchFechaHasta = !filters.fechaHasta || fechaVenta <= filters.fechaHasta
    const matchVendedor = !filters.vendedor || v.vendedor_id === filters.vendedor
    const matchLocalidad = !filters.localidad || v.dir_localidad === filters.localidad
    return matchSearch && matchEstado && matchFechaDesde && matchFechaHasta && matchVendedor && matchLocalidad
  }),
)

const estadoLabel = (e: string) => ({
  pendiente: 'Pendiente', en_proceso: 'En Proceso', en_conflicto: 'En Conflicto',
  rechazado: 'Rechazado', coordinado: 'Coordinado', concretado: 'Concretado',
}[e] ?? e)

const estadoPillClass = (e: string) => ({
  pendiente: 'bg-gray-100 text-gray-700 ring-gray-300 dark:bg-gray-800/80 dark:text-gray-200 dark:ring-gray-700',
  en_proceso: 'bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:ring-amber-800',
  en_conflicto: 'bg-orange-100 text-orange-800 ring-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:ring-orange-800',
  rechazado: 'bg-rose-100 text-rose-800 ring-rose-300 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-800',
  coordinado: 'bg-cyan-100 text-cyan-800 ring-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-200 dark:ring-cyan-800',
  concretado: 'bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800',
}[e] ?? 'bg-gray-100 text-gray-700 ring-gray-300 dark:bg-gray-800/80 dark:text-gray-200 dark:ring-gray-700')

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
  filters.search = typeof candidate.search === 'string' ? candidate.search : ''
  filters.estado = typeof candidate.estado === 'string' ? candidate.estado : ''
  filters.fechaDesde = typeof candidate.fechaDesde === 'string' ? candidate.fechaDesde : ''
  filters.fechaHasta = typeof candidate.fechaHasta === 'string' ? candidate.fechaHasta : ''
  filters.vendedor = typeof candidate.vendedor === 'string' ? candidate.vendedor : ''
  filters.localidad = typeof candidate.localidad === 'string' ? candidate.localidad : ''
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
    localStorage.setItem(STORAGE_FILTERS_KEY, JSON.stringify(filters))
    return
  }

  localStorage.removeItem(STORAGE_FILTERS_KEY)
})

watch(filters, (next) => {
  if (!import.meta.client || !recordarFiltros.value) return
  localStorage.setItem(STORAGE_FILTERS_KEY, JSON.stringify(next))
}, { deep: true })

const handleExport = () => {
  const data = ventasFiltradas.value.map(v => ({
    Fecha: formatFecha(v.fecha_carga),
    Cliente: v.cliente,
    'DNI/CUIL': v.dni_cuil,
    Dirección: v.dir_calle ?? '',
    'Entre calles': v.dir_entre_calles ?? '',
    Localidad: v.dir_localidad ?? '',
    Aclaración: v.dir_aclaracion ?? '',
    Teléfono: v.telefono ?? '',
    Email: v.mail ?? '',
    Paquete: v.paquete_nombre ?? '',
    Precio: v.precio,
    'Forma de Pago': v.forma_pago,
    Estado: estadoLabel(v.estado),
    Decos: v.decos ?? 1,
    Bocas: v.bocas ?? 1,
    Vendedor: v.profiles?.nombre ?? '',
    'Comentarios Venta': v.comentarios_venta ?? '',
    'Comentarios Gestión': Array.isArray(v.comentarios_gestion)
      ? v.comentarios_gestion.map((e: any) =>
          `[${formatFechaHora(e.fecha_hora)}] ${e.autor}: ${e.texto}`
        ).join(' | ')
      : (v.comentarios_gestion ?? ''),
  }))
  exportCsv(data, `ventas-${new Date().toISOString().split('T')[0]}.csv`)
}
</script>
