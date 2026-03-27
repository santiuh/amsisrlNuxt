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
          v-if="cicloActivo"
          label="Estimado Ciclo Actual"
          :value="formatPrecioDashboard(estimadoTotal)"
          icon="i-heroicons-banknotes"
          color="purple"
          :sub="`${ventasConcretadasCiclo} concretadas`"
        />
        <StatsCard
          v-if="ventasConComentariosPendientes > 0"
          label="Comentarios Pendientes"
          :value="ventasConComentariosPendientes"
          icon="i-heroicons-chat-bubble-left-ellipsis"
          color="orange"
        />
      </div>
      <DashboardDoughnutChart
        v-if="ventasPropias.length > 0"
        title="Distribución de Mis Ventas (Mes)"
        :labels="distribucionEstadosPropias.labels"
        :data="distribucionEstadosPropias.data"
        :colors="distribucionEstadosPropias.colors"
      />
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
          v-if="cicloActivo"
          label="Estimado Ciclo Actual"
          :value="formatPrecioDashboard(estimadoTotal)"
          icon="i-heroicons-banknotes"
          color="purple"
          :sub="`Comisión + Bonus liderazgo`"
        />
      </div>
      <DashboardDoughnutChart
        v-if="ventasPropias.length > 0"
        title="Distribución de Mis Ventas (Mes)"
        :labels="distribucionEstadosPropias.labels"
        :data="distribucionEstadosPropias.data"
        :colors="distribucionEstadosPropias.colors"
      />
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
      <DashboardDoughnutChart
        v-if="ventasEquipo.length > 0"
        title="Distribución del Equipo (Mes)"
        :labels="distribucionEstadosEquipo.labels"
        :data="distribucionEstadosEquipo.data"
        :colors="distribucionEstadosEquipo.colors"
      />
      <UCard>
        <template #header>
          <h3 class="font-semibold text-gray-800 dark:text-gray-100">Ventas de mi Equipo</h3>
        </template>
        <VentaTable :ventas="ventasEquipo" :loading="loading" :show-vendedor="true" :can-export="true" :lecturas="lecturas" />
      </UCard>
    </template>

    <!-- ============ OFICINISTA ============ -->
    <template v-else-if="profile?.rol === 'oficinista'">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          v-if="cicloActivo"
          label="Estimado Ciclo Actual"
          :value="formatPrecioDashboard(estimadoTotal)"
          icon="i-heroicons-banknotes"
          color="purple"
          :sub="`${ventasConcretadasCiclo} concretadas`"
        />
        <StatsCard
          v-if="ventasConComentariosPendientes > 0"
          label="Comentarios Pendientes"
          :value="ventasConComentariosPendientes"
          icon="i-heroicons-chat-bubble-left-ellipsis"
          color="orange"
        />
      </div>
      <div v-if="ventasMes.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <DashboardDoughnutChart
          title="Distribución de Estados (Mes)"
          :labels="distribucionEstados.labels"
          :data="distribucionEstados.data"
          :colors="distribucionEstados.colors"
        />
        <DashboardBarChart
          title="Ventas por Semana (Mes)"
          :labels="ventasPorSemana.labels"
          :datasets="ventasPorSemana.datasets"
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
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <StatsCard
          v-if="cicloActivo"
          label="Comisiones Ciclo"
          :value="formatPrecioDashboard(totalComisionesCiclo)"
          icon="i-heroicons-calculator"
          color="orange"
          :sub="`Cierre: ${formatFecha(fechaCierrePrevista)}`"
        />
      </div>

      <div v-if="ventasMes.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <DashboardDoughnutChart
          title="Distribución de Estados (Mes)"
          :labels="distribucionEstados.labels"
          :data="distribucionEstados.data"
          :colors="distribucionEstados.colors"
        />
        <DashboardBarChart
          title="Ventas por Semana (Mes)"
          :labels="ventasPorSemana.labels"
          :datasets="ventasPorSemana.datasets"
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
import { calcularEstimaciones } from '~/composables/useComisiones'

const client = useSupabaseClient()
const profile = useCurrentProfile()
const loading = ref(true)
const ventas = ref<any[]>([])
const lecturas = ref<Record<string, string>>({})

// Comisiones
const cicloActivo = ref<any>(null)
const estimadoComision = ref(0)
const estimadoTotal = ref(0)
const ventasConcretadasCiclo = ref(0)
const estimadoBonus = ref(0)
const totalComisionesCiclo = ref(0)
const fechaCierrePrevista = ref('')

const formatPrecioDashboard = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

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
  const [{ data }, { data: lecturasData }, { data: cicloData }] = await Promise.all([
    client
      .from('ventas')
      .select('*, profiles:vendedor_id(nombre, rol)')
      .order('fecha_carga', { ascending: false }),
    client
      .from('venta_lecturas')
      .select('venta_id, ultima_lectura'),
    client
      .from('ciclos_comision')
      .select('*')
      .eq('estado', 'activo')
      .maybeSingle(),
  ])
  ventas.value = data ?? []
  lecturas.value = Object.fromEntries(
    (lecturasData ?? []).map((l: any) => [l.venta_id, l.ultima_lectura])
  )
  cicloActivo.value = cicloData

  // Calcular estimación de comisiones si hay ciclo activo
  if (cicloData && profile.value) {
    fechaCierrePrevista.value = cicloData.fecha_cierre_prevista
    const [{ data: ventasCicloData }, { data: profilesData }, { data: gruposData }, { data: pctGrupoData }, { data: pctLiderData }] = await Promise.all([
      client.from('ventas').select('id, vendedor_id, precio, fecha_carga')
        .eq('estado', 'concretado')
        .gte('fecha_carga', cicloData.fecha_inicio)
        .lte('fecha_carga', new Date().toISOString()),
      client.from('profiles').select('id, nombre, rol, grupo_id'),
      client.from('grupos').select('id, lider_id'),
      client.from('configuracion').select('valor').eq('clave', 'comision_porcentaje_grupo').single(),
      client.from('configuracion').select('valor').eq('clave', 'comision_porcentaje_lider').single(),
    ])
    const pctGrupo = Number(pctGrupoData?.valor ?? 80)
    const pctLider = Number(pctLiderData?.valor ?? 25)
    const estimaciones = calcularEstimaciones(
      ventasCicloData ?? [],
      profilesData ?? [],
      gruposData ?? [],
      { pct_grupo: pctGrupo, pct_lider: pctLider },
    )
    const miEstimacion = estimaciones.find(e => e.vendedor_id === profile.value!.id)
    if (miEstimacion) {
      estimadoComision.value = miEstimacion.monto_comision
      estimadoTotal.value = miEstimacion.monto_total
      ventasConcretadasCiclo.value = miEstimacion.cantidad_ventas
      estimadoBonus.value = miEstimacion.monto_liderazgo
    }
    totalComisionesCiclo.value = estimaciones.reduce((sum, e) => sum + e.monto_total, 0)
  }

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

// ============ GRÁFICOS ============

const ESTADOS_CONFIG = [
  { key: 'coordinado',   label: 'Coordinadas',  color: '#06b6d4' },
  { key: 'concretado',   label: 'Concretadas',  color: '#10b981' },
  { key: 'rechazado',    label: 'Rechazadas',   color: '#ef4444' },
  { key: 'en_conflicto', label: 'En Conflicto', color: '#f97316' },
  { key: 'en_proceso',   label: 'En Proceso',   color: '#3b82f6' },
  { key: 'pendiente',    label: 'Pendientes',   color: '#94a3b8' },
]

function buildDistribucion(source: any[]) {
  const labels = ESTADOS_CONFIG.map(e => e.label)
  const data = ESTADOS_CONFIG.map(e => source.filter(v => v.estado === e.key).length)
  const colors = ESTADOS_CONFIG.map(e => e.color)
  return { labels, data, colors }
}

const distribucionEstados = computed(() => buildDistribucion(ventasMes.value))

const distribucionEstadosPropias = computed(() =>
  buildDistribucion(ventasPropias.value.filter(v => v.fecha_carga >= inicioMes))
)

const distribucionEstadosEquipo = computed(() =>
  buildDistribucion(ventasEquipo.value.filter(v => v.fecha_carga >= inicioMes))
)

const ventasPorSemana = computed(() => {
  const semanas: Record<string, { coordinadas: number; concretadas: number; rechazadas: number }> = {}
  ventasMes.value.forEach(v => {
    const dia = new Date(v.fecha_carga).getDate()
    const sem = `Sem ${Math.ceil(dia / 7)}`
    if (!semanas[sem]) semanas[sem] = { coordinadas: 0, concretadas: 0, rechazadas: 0 }
    if (v.estado === 'coordinado') semanas[sem].coordinadas++
    if (v.estado === 'concretado') semanas[sem].concretadas++
    if (v.estado === 'rechazado' || v.estado === 'en_conflicto') semanas[sem].rechazadas++
  })
  const labels = Object.keys(semanas).sort()
  return {
    labels,
    datasets: [
      { label: 'Coordinadas',  data: labels.map(s => semanas[s].coordinadas),  backgroundColor: '#06b6d4' },
      { label: 'Concretadas',  data: labels.map(s => semanas[s].concretadas),  backgroundColor: '#10b981' },
      { label: 'Rechazadas',   data: labels.map(s => semanas[s].rechazadas),   backgroundColor: '#ef4444' },
    ],
  }
})

useHead({ title: 'Dashboard — AMSI SRL' })
</script>
