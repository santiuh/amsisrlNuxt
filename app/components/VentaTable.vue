<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-3 flex-wrap">
        <UInput
          v-model="search"
          placeholder="Buscar por cliente o DNI/CUIL..."
          icon="i-heroicons-magnifying-glass"
          class="w-72"
        />
        <USelect
          v-model="filtroEstado"
          :options="estadoOptions"
          class="w-48"
        />
      </div>
      <UButton
        v-if="canExport"
        icon="i-heroicons-arrow-down-tray"
        label="Exportar CSV"
        color="gray"
        variant="outline"
        size="sm"
        @click="handleExport"
      />
    </div>

    <!-- Tabla -->
    <UTable :rows="ventasFiltradas" :columns="columnas" :loading="loading">
      <template #estado-data="{ row }">
        <UBadge :color="estadoColor(row.estado)" :label="estadoLabel(row.estado)" variant="subtle" />
      </template>

      <template #telefono-data="{ row }">
        <a
          v-if="row.telefono"
          :href="`https://wa.me/549${row.telefono.replace(/\D/g, '')}`"
          target="_blank"
          class="flex items-center gap-1 text-green-600 hover:underline text-sm"
        >
          <UIcon name="i-heroicons-phone" class="w-4 h-4" />
          {{ row.telefono }}
        </a>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #precio-data="{ row }">
        <span class="font-medium">{{ formatPrecio(row.precio) }}</span>
      </template>

      <template #fecha_carga-data="{ row }">
        <span class="text-sm text-gray-600">{{ formatFecha(row.fecha_carga) }}</span>
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
        <NuxtLink :to="`/ventas/${row.id}`">
          <UButton icon="i-heroicons-eye" size="xs" color="gray" variant="ghost" />
        </NuxtLink>
      </template>
    </UTable>

    <p v-if="!loading && !ventasFiltradas.length" class="text-center py-8 text-gray-400 text-sm">
      No hay ventas que coincidan con los filtros.
    </p>
  </div>
</template>

<script setup lang="ts">
import { exportCsv } from '~/utils/exportCsv'

const props = defineProps<{
  ventas: any[]
  loading?: boolean
  canExport?: boolean
  showVendedor?: boolean
}>()

const search = ref('')
const filtroEstado = ref('')

const estadoOptions = [
  { label: 'Todos los estados', value: '' },
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'En Proceso', value: 'en_proceso' },
  { label: 'En Conflicto', value: 'en_conflicto' },
  { label: 'Rechazado', value: 'rechazado' },
  { label: 'Coordinado', value: 'coordinado' },
  { label: 'Concretado', value: 'concretado' },
]

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
    const q = search.value.toLowerCase()
    const matchSearch = !q ||
      v.cliente?.toLowerCase().includes(q) ||
      v.dni_cuil?.toLowerCase().includes(q)
    const matchEstado = !filtroEstado.value || v.estado === filtroEstado.value
    return matchSearch && matchEstado
  })
)

const estadoLabel = (e: string) => ({
  pendiente: 'Pendiente', en_proceso: 'En Proceso', en_conflicto: 'En Conflicto',
  rechazado: 'Rechazado', coordinado: 'Coordinado', concretado: 'Concretado',
}[e] ?? e)

const estadoColor = (e: string): any => ({
  pendiente: 'gray', en_proceso: 'yellow', en_conflicto: 'orange',
  rechazado: 'red', coordinado: 'teal', concretado: 'blue',
}[e] ?? 'gray')

const formatPrecio = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

const formatFecha = (f: string) =>
  new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

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
    Paquete: v.paquete_nombre ?? '',
    Precio: v.precio,
    'Forma de Pago': v.forma_pago,
    Estado: estadoLabel(v.estado),
    Vendedor: v.profiles?.nombre ?? '',
    'Comentarios Venta': v.comentarios_venta ?? '',
    'Comentarios Gestión': Array.isArray(v.comentarios_gestion)
      ? v.comentarios_gestion.map((e: any) =>
          `[${new Date(e.fecha_hora).toLocaleString('es-AR')}] ${e.autor}: ${e.texto}`
        ).join(' | ')
      : (v.comentarios_gestion ?? ''),
  }))
  exportCsv(data, `ventas-${new Date().toISOString().split('T')[0]}.csv`)
}
</script>
