<template>
  <div class="max-w-3xl mx-auto">
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Cargar Nueva Venta</h2>
      </template>
      <VentaForm
        submit-label="Guardar Venta"
        :show-cancel="true"
        @submit="guardarVenta"
        @cancel="navigateTo('/ventas')"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const profile = useCurrentProfile()
const toast = useToast()

const guardarVenta = async (data: Record<string, any>) => {
  // Extraer campos que no van en la tabla ventas
  const { _extras, extras_ids, ...ventaData } = data

  const { data: ventaCreada, error } = await client
    .from('ventas')
    .insert({ ...ventaData, vendedor_id: profile.value!.id })
    .select('id')
    .single()

  if (error) {
    toast.add({ title: 'Error al guardar', description: error.message, color: 'red' })
    return
  }

  // Insertar extras seleccionados con snapshot de precio
  if (_extras && (_extras as any[]).length > 0) {
    const ventaExtrasRows = (_extras as any[]).map((e: any) => ({
      venta_id: ventaCreada.id,
      extra_id: e.id,
      precio_snapshot: e.precio,
    }))
    const { error: errorExtras } = await client.from('venta_extras').insert(ventaExtrasRows)
    if (errorExtras) {
      toast.add({ title: 'Venta guardada pero error en extras', description: errorExtras.message, color: 'orange' })
    }
  }

  toast.add({ title: 'Venta guardada correctamente', color: 'green' })
  await navigateTo('/ventas')
}

useHead({ title: 'Nueva Venta — AMSI SRL' })
</script>
