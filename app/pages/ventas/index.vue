<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg sm:text-xl font-semibold text-gray-800 truncate dark:text-white">
        {{ profile?.rol === 'vendedor' ? 'Mis Ventas' : 'Todas las Ventas' }}
      </h2>
      <div class="flex items-center gap-2 flex-shrink-0">
        <UButton
          v-if="cantidadBorradores > 0"
          to="/ventas/borradores"
          icon="i-heroicons-bookmark"
          color="amber"
          variant="outline"
          size="sm"
        >
          Borradores
          <UBadge color="amber" variant="solid" size="xs" :label="String(cantidadBorradores)" class="ml-1" />
        </UButton>
        <UButton
          to="/ventas/nueva"
          icon="i-heroicons-plus"
          label="Nueva Venta"
          size="sm"
        />
      </div>
    </div>

    <UCard>
      <VentaTable
        :ventas="ventas"
        :loading="loading"
        :total="total"
        :page="page"
        :page-size="pageSize"
        :sort="sort"
        :filters="filters"
        :exporting="exporting"
        :show-vendedor="profile?.rol !== 'vendedor'"
        :can-export="profile?.rol !== 'vendedor'"
        :lecturas="lecturas"
        :vendedores-options="vendedoresOptions"
        :localidades-options="localidadesOptions"
        @update:page="page = $event"
        @update:page-size="pageSize = $event"
        @update:sort="sort = $event"
        @export="handleExport"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { exportCsv } from '~/utils/exportCsv'

const client = useSupabaseClient()
const profile = useCurrentProfile()
const toast = useToast()
const { cantidad: cantidadBorradores } = useBorradorVentas()

const {
  filters,
  page,
  pageSize,
  sort,
  ventas,
  lecturas,
  total,
  loading,
  exporting,
  init,
  fetchExport,
  EXPORT_LIMIT,
} = useVentasList()

const vendedoresOptions = ref<{ label: string; value: string }[]>([
  { label: 'Todos los vendedores', value: '' },
])
const localidadesOptions = ref<{ label: string; value: string }[]>([
  { label: 'Todas las localidades', value: '' },
])

async function loadVendedores() {
  if (profile.value?.rol === 'vendedor') return
  const { data } = await client
    .from('profiles')
    .select('id, nombre')
    .eq('rol', 'vendedor')
    .order('nombre')
  vendedoresOptions.value = [
    { label: 'Todos los vendedores', value: '' },
    ...(data ?? []).map((v: any) => ({ label: v.nombre, value: v.id })),
  ]
}

async function loadLocalidades() {
  try {
    const data = await $fetch<string[]>('/api/ventas/localidades')
    localidadesOptions.value = [
      { label: 'Todas las localidades', value: '' },
      ...data.map((l) => ({ label: l, value: l })),
    ]
  } catch {
    localidadesOptions.value = [{ label: 'Todas las localidades', value: '' }]
  }
}

async function handleExport() {
  try {
    const { rows, truncated } = await fetchExport()
    if (rows.length === 0) {
      toast.add({ title: 'No hay ventas para exportar', color: 'gray' })
      return
    }
    const data = rows.map((v: any) => ({
      Fecha: formatFecha(v.fecha_carga),
      Empresa: v.empresa === 'ultra' ? 'Ultra' : 'Express',
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
      Estado: estadoLabelExport(v.estado),
      'Fecha Concretado': v.fecha_concretado ? `${formatFecha(v.fecha_concretado)} ${formatHora(v.fecha_concretado)}` : '',
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
    if (truncated) {
      toast.add({
        title: 'Exportación truncada',
        description: `Se exportaron ${EXPORT_LIMIT.toLocaleString('es-AR')} filas. Refiná los filtros para incluir el resto.`,
        color: 'amber',
      })
    }
  } catch (e: any) {
    toast.add({ title: 'Error al exportar', description: e?.message ?? 'Error desconocido', color: 'red' })
  }
}

function estadoLabelExport(e: string) {
  return ({
    pendiente: 'Pendiente', en_proceso: 'En Proceso', en_conflicto: 'En Conflicto',
    rechazado: 'Rechazado', coordinado: 'Coordinado', concretado: 'Concretado', proxima_zona: 'Próxima Zona',
  } as Record<string, string>)[e] ?? e
}

onMounted(async () => {
  await Promise.all([loadVendedores(), loadLocalidades()])
  await nextTick()
  await init()
})

useHead({ title: 'Ventas — AMSI SRL' })
</script>
