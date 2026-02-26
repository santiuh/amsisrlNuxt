<template>
  <div class="max-w-3xl mx-auto">
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-gray-800">Cargar Nueva Venta</h2>
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
  const { error } = await client.from('ventas').insert({
    ...data,
    vendedor_id: profile.value!.id,
  })
  if (error) {
    toast.add({ title: 'Error al guardar', description: error.message, color: 'red' })
    return
  }
  toast.add({ title: 'Venta guardada correctamente', color: 'green' })
  await navigateTo('/ventas')
}

useHead({ title: 'Nueva Venta — AMSI SRL' })
</script>
