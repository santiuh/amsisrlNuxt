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

      <!-- Vista de solo lectura (vendedor) -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-for="campo in camposDetalle" :key="campo.label" class="space-y-1">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ campo.label }}</p>
          <p class="text-gray-900">{{ campo.value || '—' }}</p>
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
    .select('*, profiles:vendedor_id(nombre, rol)')
    .eq('id', route.params.id as string)
    .single()
  venta.value = data
  loading.value = false
})

const actualizar = async (data: Record<string, any>) => {
  // Oficinista solo puede actualizar estado y comentarios_gestion
  const payload = profile.value?.rol === 'oficinista'
    ? { estado: data.estado, comentarios_gestion: data.comentarios_gestion }
    : data

  const { error } = await client
    .from('ventas')
    .update(payload)
    .eq('id', route.params.id as string)

  if (error) {
    toast.add({ title: 'Error al guardar', description: error.message, color: 'red' })
    return
  }
  toast.add({ title: 'Venta actualizada', color: 'green' })
  await navigateTo('/ventas')
}

const estadoLabel = (e: string) => ({
  pendiente: 'Pendiente', en_proceso: 'En Proceso',
  rechazado: 'Rechazado', aceptado: 'Aceptado', concretado: 'Concretado',
}[e] ?? e)

const estadoColor = (e: string): any => ({
  pendiente: 'gray', en_proceso: 'yellow',
  rechazado: 'red', aceptado: 'green', concretado: 'blue',
}[e] ?? 'gray')

const formatFecha = (f: string) =>
  new Date(f).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const camposDetalle = computed(() => [
  { label: 'Cliente', value: venta.value?.cliente },
  { label: 'DNI/CUIL', value: venta.value?.dni_cuil },
  { label: 'Dirección', value: venta.value?.direccion },
  { label: 'Teléfono', value: venta.value?.telefono },
  { label: 'Paquete', value: venta.value?.paquete },
  { label: 'Precio', value: venta.value?.precio ? `$${Number(venta.value.precio).toLocaleString('es-AR')}` : null },
  { label: 'Forma de Pago', value: venta.value?.forma_pago },
  { label: 'Estado', value: estadoLabel(venta.value?.estado) },
  { label: 'Comentarios de Venta', value: venta.value?.comentarios_venta },
  { label: 'Comentarios de Gestión', value: venta.value?.comentarios_gestion },
])

useHead({ title: 'Detalle de Venta — AMSI SRL' })
</script>
