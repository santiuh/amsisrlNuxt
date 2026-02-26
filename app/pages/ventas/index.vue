<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg sm:text-xl font-semibold text-gray-800 truncate">
        {{ profile?.rol === 'vendedor' ? 'Mis Ventas' : 'Todas las Ventas' }}
      </h2>
      <UButton
        to="/ventas/nueva"
        icon="i-heroicons-plus"
        label="Nueva Venta"
        size="sm"
        class="flex-shrink-0"
      />
    </div>

    <UCard>
      <VentaTable
        :ventas="ventas"
        :loading="loading"
        :show-vendedor="profile?.rol !== 'vendedor'"
        :can-export="profile?.rol !== 'vendedor'"
        :lecturas="lecturas"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const profile = useCurrentProfile()
const loading = ref(true)
const ventas = ref<any[]>([])
const lecturas = ref<Record<string, string>>({})

onMounted(async () => {
  const [{ data }, { data: lecturasData }] = await Promise.all([
    client.from('ventas')
      .select('*, profiles:vendedor_id(nombre)')
      .order('fecha_carga', { ascending: false }),
    client.from('venta_lecturas')
      .select('venta_id, ultima_lectura'),
  ])
  ventas.value = data ?? []
  lecturas.value = Object.fromEntries(
    (lecturasData ?? []).map((l: any) => [l.venta_id, l.ultima_lectura])
  )
  loading.value = false
})

useHead({ title: 'Ventas — AMSI SRL' })
</script>
