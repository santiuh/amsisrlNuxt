<template>
  <div class="max-w-3xl mx-auto">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {{ borradorId ? 'Editar Borrador' : 'Cargar Nueva Venta' }}
          </h2>
          <UBadge v-if="borradorId" color="amber" variant="subtle" label="Borrador" />
        </div>
      </template>
      <VentaForm
        :key="formKey"
        :initial-data="initialData"
        submit-label="Guardar Venta"
        :show-cancel="true"
        :on-submit="guardarVenta"
        :hide-gestion-fields="true"
        @cancel="navigateTo('/ventas')"
      >
        <template #extra-actions="{ formData }">
          <UButton
            label="Guardar borrador"
            color="amber"
            variant="outline"
            icon="i-heroicons-bookmark"
            @click="guardarBorrador(formData)"
          />
        </template>
      </VentaForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const toast = useToast()
const { guardar, obtener, eliminar } = useBorradorVentas()

const borradorId = ref((route.query.borrador as string) || '')
const initialData = ref<Record<string, any> | undefined>(undefined)
const formKey = ref(0)

// Cargar datos del borrador si viene por query
if (borradorId.value) {
  const borrador = obtener(borradorId.value)
  if (borrador) {
    initialData.value = { ...borrador.data }
  } else {
    borradorId.value = ''
  }
}

const guardarBorrador = (formData: Record<string, any>) => {
  const id = guardar(formData, borradorId.value || undefined)
  borradorId.value = id
  toast.add({ title: 'Borrador guardado en el dispositivo', color: 'amber', icon: 'i-heroicons-bookmark' })
}

const guardarVenta = async (data: Record<string, any>) => {
  try {
    const result = await $fetch('/api/ventas', {
      method: 'POST',
      body: data,
    })

    // Si venía de un borrador, eliminarlo al publicar
    if (borradorId.value) {
      eliminar(borradorId.value)
    }

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

useHead({ title: borradorId.value ? 'Editar Borrador — AMSI SRL' : 'Nueva Venta — AMSI SRL' })
</script>
