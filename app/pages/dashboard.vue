<template>
  <div class="space-y-6">
    <!-- ============ VENDEDOR ============ -->
    <template v-if="profile?.rol === 'vendedor'">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatsCard
          label="Mis Ventas del Mes"
          :value="stats.misVentasMes"
          icon="i-heroicons-chart-bar"
          color="blue"
        />
        <StatsCard
          label="Mis Ventas Coordinadas"
          :value="stats.misAceptadas"
          icon="i-heroicons-check-circle"
          color="green"
        />
      </div>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">Mis Ventas</h3>
          </div>
        </template>
        <VentaTable :ventas="ventas" :loading="loading" :show-vendedor="false" />
      </UCard>
    </template>

    <!-- ============ LIDER ============ -->
    <template v-else-if="profile?.rol === 'lider'">
      <!-- Mis Ventas -->
      <h3 class="text-base font-semibold text-gray-600 uppercase tracking-wide">Mis Ventas</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatsCard
          label="Mis Ventas del Mes"
          :value="stats.misVentasMes"
          icon="i-heroicons-chart-bar"
          color="blue"
        />
        <StatsCard
          label="Mis Ventas Coordinadas"
          :value="stats.misAceptadas"
          icon="i-heroicons-check-circle"
          color="green"
        />
      </div>
      <UCard>
        <template #header>
          <h3 class="font-semibold text-gray-800">Mis Ventas</h3>
        </template>
        <VentaTable :ventas="ventasPropias" :loading="loading" :show-vendedor="false" />
      </UCard>

      <!-- Mi Equipo -->
      <h3 class="text-base font-semibold text-gray-600 uppercase tracking-wide mt-2">Mi Equipo</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatsCard
          label="Ventas del Equipo (Mes)"
          :value="stats.equipoMes"
          icon="i-heroicons-users"
          color="orange"
        />
        <StatsCard
          label="Coordinadas del Equipo"
          :value="stats.equipoAceptadas"
          icon="i-heroicons-check-badge"
          color="teal"
        />
      </div>
      <UCard>
        <template #header>
          <h3 class="font-semibold text-gray-800">Ventas de mi Equipo</h3>
        </template>
        <VentaTable :ventas="ventasEquipo" :loading="loading" :show-vendedor="true" :can-export="true" />
      </UCard>
    </template>

    <!-- ============ OFICINISTA ============ -->
    <template v-else-if="profile?.rol === 'oficinista'">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatsCard
          label="Ventas del Mes"
          :value="stats.totalMes"
          icon="i-heroicons-chart-bar"
          color="blue"
        />
        <StatsCard
          label="Ventas Coordinadas"
          :value="stats.aceptadas"
          icon="i-heroicons-check-circle"
          color="green"
        />
      </div>
      <UCard>
        <template #header>
          <h3 class="font-semibold text-gray-800">Todas las Ventas</h3>
        </template>
        <VentaTable :ventas="ventas" :loading="loading" :show-vendedor="true" :can-export="true" />
      </UCard>
    </template>

    <!-- ============ ADMIN ============ -->
    <template v-else-if="profile?.rol === 'admin'">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="Total Ventas del Mes"
          :value="stats.totalMes"
          icon="i-heroicons-chart-bar"
          color="blue"
        />
        <StatsCard
          label="% Conversión"
          :value="`${stats.porcentajeConversion}%`"
          icon="i-heroicons-arrow-trending-up"
          color="green"
          :sub="`${stats.aceptadas} coordinadas / ${stats.totalMes} total`"
        />
        <StatsCard
          label="Ventas Concretadas"
          :value="stats.concretadas"
          icon="i-heroicons-banknotes"
          color="purple"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Ranking vendedores -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-gray-800">Ranking de Vendedores (Mes Actual)</h3>
          </template>
          <UTable :rows="rankingVendedores" :columns="rankingColumns" />
        </UCard>

        <!-- Actividad oficinistas -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-gray-800">Actividad de Oficinistas</h3>
          </template>
          <UTable :rows="actividadOficинistas" :columns="actividadColumns" />
        </UCard>
      </div>

      <UCard>
        <template #header>
          <h3 class="font-semibold text-gray-800">Todas las Ventas</h3>
        </template>
        <VentaTable :ventas="ventas" :loading="loading" :show-vendedor="true" :can-export="true" />
      </UCard>
    </template>

    <!-- Loading -->
    <div v-if="loading && !profile" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
    </div>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const profile = useCurrentProfile()
const loading = ref(true)
const ventas = ref<any[]>([])

const rankingColumns = [
  { key: 'nombre', label: 'Vendedor' },
  { key: 'total', label: 'Total Ventas' },
  { key: 'aceptadas', label: 'Coordinadas' },
]
const actividadColumns = [
  { key: 'nombre', label: 'Oficinista' },
  { key: 'gestionadas', label: 'Ventas Gestionadas' },
]

onMounted(async () => {
  const { data } = await client
    .from('ventas')
    .select('*, profiles:vendedor_id(nombre, rol)')
    .order('fecha_carga', { ascending: false })
  ventas.value = data ?? []
  loading.value = false
})

const ahora = new Date()
const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()

const ventasMes = computed(() =>
  ventas.value.filter(v => v.fecha_carga >= inicioMes)
)

const ventasPropias = computed(() =>
  ventas.value.filter(v => v.vendedor_id === profile.value?.id)
)
const ventasEquipo = computed(() =>
  ventas.value.filter(v => v.vendedor_id !== profile.value?.id)
)

const stats = computed(() => {
  const propias = ventas.value.filter(v => v.vendedor_id === profile.value?.id)
  const propiasMes = propias.filter(v => v.fecha_carga >= inicioMes)
  const equipo = ventas.value.filter(v => v.vendedor_id !== profile.value?.id)
  const equipoMes = equipo.filter(v => v.fecha_carga >= inicioMes).length
  const equipoAceptadas = equipo.filter(v => v.fecha_carga >= inicioMes && v.estado === 'coordinado').length
  const total = ventasMes.value.length
  const aceptadas = ventasMes.value.filter(v => v.estado === 'coordinado').length
  const concretadas = ventasMes.value.filter(v => v.estado === 'concretado').length
  return {
    misVentasMes: propiasMes.length,
    misAceptadas: propias.filter(v => v.estado === 'coordinado').length,
    totalMes: total,
    aceptadas,
    concretadas,
    porcentajeConversion: total > 0 ? Math.round((aceptadas / total) * 100) : 0,
    equipoMes,
    equipoAceptadas,
  }
})

const rankingVendedores = computed(() => {
  const map: Record<string, { nombre: string; total: number; aceptadas: number }> = {}
  ventasMes.value.forEach(v => {
    const nombre = v.profiles?.nombre ?? 'Desconocido'
    if (!map[nombre]) map[nombre] = { nombre, total: 0, aceptadas: 0 }
    map[nombre].total++
    if (v.estado === 'coordinado') map[nombre].aceptadas++
  })
  return Object.values(map).sort((a, b) => b.total - a.total)
})

// Actividad de oficinistas: ventas que pasaron de pendiente a otro estado
const actividadOficинistas = computed(() => {
  const map: Record<string, { nombre: string; gestionadas: number }> = {}
  ventas.value.forEach(v => {
    if (v.profiles?.rol === 'oficinista' && v.estado !== 'pendiente') {
      const nombre = v.profiles.nombre
      if (!map[nombre]) map[nombre] = { nombre, gestionadas: 0 }
      map[nombre].gestionadas++
    }
  })
  return Object.values(map).sort((a, b) => b.gestionadas - a.gestionadas)
})

useHead({ title: 'Dashboard — AMSI SRL' })
</script>
