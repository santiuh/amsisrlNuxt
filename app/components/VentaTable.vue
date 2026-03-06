<template>
  <div class="space-y-4">
    <!-- Filtros + Exportar -->
    <div class="flex flex-col gap-3">
      <div class="flex items-start justify-between gap-3">
        <VentaFilters
          v-model:filters="filters"
          :show-vendedor="showVendedor"
          :vendedores="vendedoresOptions"
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
    <UTable :rows="ventasFiltradas" :columns="columnas" :loading="loading">
      <template #estado-data="{ row }">
        <UBadge :color="estadoColor(row.estado)" :label="estadoLabel(row.estado)" variant="subtle" />
      </template>

      <template #telefono-data="{ row }">
        <a
          v-if="row.telefono"
          :href="`https://wa.me/549${row.telefono.replace(/\D/g, '')}`"
          target="_blank"
          class="flex items-center gap-1 text-green-600 dark:text-green-400 hover:underline text-sm"
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
        <span class="text-sm text-gray-600 dark:text-gray-300">{{ formatFecha(row.fecha_carga) }}</span>
      </template>

      <template #paquete-data="{ row }">
        <span>{{ row.paquete_nombre ?? '—' }}</span>
      </template>

      <template #forma_pago-data="{ row }">
        <span class="capitalize">{{ row.forma_pago }}</span>
      </template>

      <template #vendedor-data="{ row }">
        <span>{{ row.profiles?.nombre ?? '—' }}</span>
      </template>

      <template #acciones-data="{ row }">
        <div class="flex items-center gap-1">
          <span
            v-if="tieneComentarioNuevo(row)"
            class="relative flex h-2.5 w-2.5"
            title="Nuevo comentario"
          >
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
          </span>
          <NuxtLink :to="`/ventas/${row.id}`">
            <UButton icon="i-heroicons-eye" size="xs" color="gray" variant="ghost" />
          </NuxtLink>
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
import type { VentaFilterState } from '~/components/VentaFilters.vue'

const props = defineProps<{
  ventas: any[]
  loading?: boolean
  canExport?: boolean
  showVendedor?: boolean
  lecturas?: Record<string, string>  // venta_id → ultima_lectura ISO
}>()

const filters = reactive<VentaFilterState>({
  search: '',
  estado: '',
  fechaDesde: '',
  fechaHasta: '',
  vendedor: '',
  formaPago: '',
})

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

const columnas = computed(() => {
  const base = [
    { key: 'fecha_carga', label: 'Fecha' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'dni_cuil', label: 'DNI/CUIL' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'paquete', label: 'Paquete' },
    { key: 'precio', label: 'Precio' },
    { key: 'forma_pago', label: 'Forma de Pago' },
    { key: 'estado', label: 'Estado' },
    { key: 'acciones', label: '' },
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
    const matchFormaPago = !filters.formaPago || v.forma_pago === filters.formaPago
    return matchSearch && matchEstado && matchFechaDesde && matchFechaHasta && matchVendedor && matchFormaPago
  }),
)

const estadoLabel = (e: string) => ({
  pendiente: 'Pendiente', en_proceso: 'En Proceso', en_conflicto: 'En Conflicto',
  rechazado: 'Rechazado', coordinado: 'Coordinado', concretado: 'Concretado',
}[e] ?? e)

const estadoColor = (e: string): any => ({
  pendiente: 'gray', en_proceso: 'yellow', en_conflicto: 'orange',
  rechazado: 'red', coordinado: 'teal', concretado: 'blue',
}[e] ?? 'gray')

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
