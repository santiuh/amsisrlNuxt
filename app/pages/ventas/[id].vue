<template>
  <div class="max-w-3xl mx-auto space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <UButton
        icon="i-heroicons-arrow-left"
        color="gray"
        variant="ghost"
        size="sm"
        @click="navigateTo('/ventas')"
      />
      <h2 class="text-lg font-semibold text-gray-800">
        {{ canEdit ? 'Editar Venta' : 'Detalle de Venta' }}
      </h2>
      <UBadge
        v-if="venta"
        :color="estadoColor(venta.estado)"
        :label="estadoLabel(venta.estado)"
        variant="subtle"
      />
    </div>

    <!-- Cargando -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
    </div>

    <UCard v-else-if="venta">
      <!-- Metadata -->
      <div class="mb-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 grid grid-cols-2 gap-2">
        <div>
          <span class="font-medium">Vendedor:</span> {{ venta.profiles?.nombre ?? '—' }}
        </div>
        <div>
          <span class="font-medium">Fecha de carga:</span> {{ formatFecha(venta.fecha_carga) }}
        </div>
      </div>

      <!-- Formulario editable (oficinista/admin) -->
      <VentaForm
        v-if="canEdit"
        :initial-data="venta"
        submit-label="Guardar Cambios"
        :show-cancel="true"
        @submit="actualizar"
        @cancel="navigateTo('/ventas')"
      />

      <!-- Vista de solo lectura (vendedor/lider) -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-for="campo in camposDetalle" :key="campo.label" class="space-y-1">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ campo.label }}</p>
          <p class="text-gray-900">{{ campo.value || '—' }}</p>
        </div>

        <!-- Extras seleccionados -->
        <div v-if="venta.venta_extras?.length" class="sm:col-span-2 space-y-1">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Extras</p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="ve in venta.venta_extras"
              :key="ve.extra_id"
              color="blue"
              variant="subtle"
            >
              {{ ve.extras?.nombre }} — {{ formatPrecio(ve.precio_snapshot) }}
            </UBadge>
          </div>
        </div>

        <!-- Registro de gestión (read-only) -->
        <div v-if="logGestion.length > 0" class="sm:col-span-2 space-y-1">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Registro de Gestión</p>
          <div class="border border-gray-200 rounded-lg divide-y divide-gray-100 bg-gray-50">
            <div v-for="(entry, i) in logGestion" :key="i" class="px-3 py-2 text-sm">
              <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                <span class="text-xs text-gray-400">{{ formatFecha(entry.fecha_hora) }}</span>
                <span class="text-xs font-medium text-gray-600">{{ entry.autor }}</span>
                <UBadge
                  v-if="entry.tipo === 'estado'"
                  color="teal"
                  variant="subtle"
                  size="xs"
                  label="Estado"
                />
              </div>
              <p class="text-gray-800">{{ entry.texto }}</p>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <UAlert
      v-else
      icon="i-heroicons-exclamation-triangle"
      color="red"
      title="Venta no encontrada"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const client = useSupabaseClient()
const profile = useCurrentProfile()
const toast = useToast()
const loading = ref(true)
const venta = ref<any>(null)

const canEdit = computed(() =>
  ['oficinista', 'admin'].includes(profile.value?.rol ?? '')
)

onMounted(async () => {
  const { data } = await client
    .from('ventas')
    .select('*, profiles:vendedor_id(nombre, rol), venta_extras(extra_id, precio_snapshot, extras(nombre))')
    .eq('id', route.params.id as string)
    .single()
  venta.value = data
  loading.value = false
})

const actualizar = async (data: Record<string, any>) => {
  const { _extras, extras_ids, ...ventaData } = data

  // Oficinista solo puede actualizar estado y comentarios_gestion
  const payload = profile.value?.rol === 'oficinista'
    ? { estado: ventaData.estado, comentarios_gestion: ventaData.comentarios_gestion }
    : ventaData

  const { error } = await client
    .from('ventas')
    .update(payload)
    .eq('id', route.params.id as string)

  if (error) {
    toast.add({ title: 'Error al guardar', description: error.message, color: 'red' })
    return
  }

  // Si es admin, actualizar también los extras
  if (profile.value?.rol === 'admin' && _extras !== undefined) {
    await client.from('venta_extras').delete().eq('venta_id', route.params.id as string)
    if ((_extras as any[]).length > 0) {
      await client.from('venta_extras').insert(
        (_extras as any[]).map((e: any) => ({
          venta_id: route.params.id as string,
          extra_id: e.id,
          precio_snapshot: e.precio,
        }))
      )
    }
  }

  toast.add({ title: 'Venta actualizada', color: 'green' })
  await navigateTo('/ventas')
}

const estadoLabel = (e: string) => ({
  pendiente: 'Pendiente', en_proceso: 'En Proceso',
  rechazado: 'Rechazado', coordinado: 'Coordinado', concretado: 'Concretado',
}[e] ?? e)

const estadoColor = (e: string): any => ({
  pendiente: 'gray', en_proceso: 'yellow',
  rechazado: 'red', coordinado: 'teal', concretado: 'blue',
}[e] ?? 'gray')

const formatFecha = (f: string) =>
  new Date(f).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const formatPrecio = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n ?? 0)

const logGestion = computed(() => {
  const log = venta.value?.comentarios_gestion
  return Array.isArray(log) ? log : []
})

const camposDetalle = computed(() => [
  { label: 'Cliente', value: venta.value?.cliente },
  { label: 'DNI/CUIL', value: venta.value?.dni_cuil },
  { label: 'Teléfono', value: venta.value?.telefono },
  { label: 'Dirección', value: venta.value?.dir_calle },
  { label: 'Entre calles', value: venta.value?.dir_entre_calles },
  { label: 'Localidad', value: venta.value?.dir_localidad },
  { label: 'Aclaración', value: venta.value?.dir_aclaracion },
  { label: 'Paquete', value: venta.value?.paquete_nombre },
  { label: 'Precio Total', value: venta.value?.precio ? formatPrecio(Number(venta.value.precio)) : null },
  { label: 'Forma de Pago', value: venta.value?.forma_pago },
  { label: 'Estado', value: estadoLabel(venta.value?.estado) },
  { label: 'Fecha de Coordinación', value: venta.value?.fecha_coordinacion ? formatFecha(venta.value.fecha_coordinacion) : null },
  { label: 'Comentarios de Venta', value: venta.value?.comentarios_venta },
])

useHead({ title: 'Detalle de Venta — AMSI SRL' })
</script>
