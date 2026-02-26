<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800">
        {{ profile?.rol === 'vendedor' ? 'Mis Ventas' : 'Todas las Ventas' }}
      </h2>
      <UButton
        to="/ventas/nueva"
        icon="i-heroicons-plus"
        label="Nueva Venta"
        size="sm"
      />
    </div>

    <UCard>
      <VentaTable
        :ventas="ventas"
        :loading="loading"
        :show-vendedor="profile?.rol !== 'vendedor'"
        :can-export="profile?.rol !== 'vendedor'"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const profile = useCurrentProfile()
const loading = ref(true)
const ventas = ref<any[]>([])

onMounted(async () => {
  const { data } = await client
    .from('ventas')
    .select('*, profiles:vendedor_id(nombre)')
    .order('fecha_carga', { ascending: false })
  ventas.value = data ?? []
  loading.value = false
})

useHead({ title: 'Ventas — AMSI SRL' })
</script>
