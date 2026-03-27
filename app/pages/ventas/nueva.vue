<template>
  <div class="max-w-3xl mx-auto">
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Cargar Nueva Venta</h2>
      </template>
      <VentaForm
        submit-label="Guardar Venta"
        :show-cancel="true"
        :on-submit="guardarVenta"
        @cancel="navigateTo('/ventas')"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
const toast = useToast()

const guardarVenta = async (data: Record<string, any>) => {
  try {
    const result = await $fetch('/api/ventas', {
      method: 'POST',
      body: data,
    })

    if (result.warning) {
      toast.add({ title: 'Venta guardada pero error en extras', description: result.warning, color: 'orange' })
    } else {
      toast.add({ title: 'Venta guardada correctamente', color: 'green' })
    }
    await navigateTo('/ventas')
  } catch (err: any) {
    toast.add({ title: 'Error al guardar', description: err.data?.statusMessage || err.message, color: 'red' })
  }
}

useHead({ title: 'Nueva Venta — AMSI SRL' })
</script>
