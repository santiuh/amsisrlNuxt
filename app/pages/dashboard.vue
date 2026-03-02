<template>
  <div class="space-y-6">
    <!-- ============ VENDEDOR ============ -->
    <template v-if="profile?.rol === 'vendedor'">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <StatsCard
          v-if="ventasConComentariosPendientes > 0"
          label="Comentarios Pendientes"
          :value="ventasConComentariosPendientes"
          icon="i-heroicons-chat-bubble-left-ellipsis"
          color="orange"
        />
      </div>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800 dark:text-gray-100">Mis Ventas</h3>
          </div>
        </template>
        <VentaTable :ventas="ventas" :loading="loading" :show-vendedor="false" :lecturas="lecturas" />
      </UCard>
    </template>

    <!-- ============ LIDER ============ -->
    <template v-else-if="profile?.rol === 'lider'">
      <!-- Mis Ventas -->
      <h3 class="text-base font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Mis Ventas</h3>
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
          <h3 class="font-semibold text-gray-800 dark:text-gray-100">Mis Ventas</h3>
        </template>
        <VentaTable :ventas="ventasPropias" :loading="loading" :show-vendedor="false" :lecturas="lecturas" />
      </UCard>

      <!-- Mi Equipo -->
      <h3 class="text-base font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mt-2">Mi Equipo</h3>
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
          <h3 class="font-semibold text-gray-800 dark:text-gray-100">Ventas de mi Equipo</h3>
        </template>
        <VentaTable :ventas="ventasEquipo" :loading="loading" :show-vendedor="true" :can-export="true" :lecturas="lecturas" />
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
        <StatsCard
          v-if="ventasConComentariosPendientes > 0"
          label="Comentarios Pendientes"
          :value="ventasConComentariosPendientes"
          icon="i-heroicons-chat-bubble-left-ellipsis"
          color="orange"
        />
      </div>
      <UCard class="shadow-sm ring-1 ring-gray-200 dark:ring-white/10">
        <template #header>
          <h3 class="text-3xl leading-none font-bold text-gray-900 dark:text-gray-100">Todas las Ventas</h3>
        </template>
        <VentaTable :ventas="ventas" :loading="loading" :show-vendedor="true" :can-export="true" :lecturas="lecturas" />
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

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <!-- Ranking vendedores -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base">Ranking de Vendedores (Mes)</h3>
          </template>
          <div class="overflow-x-auto -mx-4 sm:mx-0">
            <UTable :rows="rankingVendedores" :columns="rankingColumns" />
          </div>
        </UCard>

        <!-- Actividad oficinistas -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base">Actividad de Oficinistas</h3>
          </template>
          <div class="overflow-x-auto -mx-4 sm:mx-0">
            <UTable :rows="actividadOficinistas" :columns="actividadColumns" />
          </div>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <h3 class="font-semibold text-gray-800 dark:text-gray-100">Todas las Ventas</h3>
        </template>
        <VentaTable :ventas="ventas" :loading="loading" :show-vendedor="true" :can-export="true" :lecturas="lecturas" />
      </UCard>
    </template>

    <!-- Loading -->
    <div v-if="loading && !profile" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin" />
    </div>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const profile = useCurrentProfile()
const loading = ref(true)
const ventas = ref<any[]>([])
const lecturas = ref<Record<string, string>>({})

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
  const [{ data }, { data: lecturasData }] = await Promise.all([
    client
      .from('ventas')
      .select('*, profiles:vendedor_id(nombre, rol)')
      .order('fecha_carga', { ascending: false }),
    client
      .from('venta_lecturas')
      .select('venta_id, ultima_lectura'),
  ])
  ventas.value = data ?? []
  lecturas.value = Object.fromEntries(
    (lecturasData ?? []).map((l: any) => [l.venta_id, l.ultima_lectura])
  )
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

const tieneComentarioNuevo = (venta: any): boolean => {
  const log = venta.comentarios_gestion
  if (!Array.isArray(log) || log.length === 0) return false
  // Solo contar comentarios reales, no cambios de estado
  const comentarios = log.filter((e: any) => e.tipo === 'comentario')
  if (comentarios.length === 0) return false
  const ultimoComentario = comentarios[0]?.fecha_hora
  if (!ultimoComentario) return false
  const ultimaLectura = lecturas.value[venta.id]
  if (!ultimaLectura) return true
  return new Date(ultimoComentario) > new Date(ultimaLectura)
}

const ventasConComentariosPendientes = computed(() =>
  ventas.value.filter(v => tieneComentarioNuevo(v)).length
)

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
const actividadOficinistas = computed(() => {
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
