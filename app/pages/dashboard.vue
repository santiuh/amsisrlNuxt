<template>
  <div class="space-y-8">
    <!-- ============ VENDEDOR ============ -->
    <template v-if="profile?.rol === 'vendedor'">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          label="Concretadas"
          :value="stats.misConcretadasMes"
          icon="i-heroicons-banknotes"
          color="green"
          :sub="stats.misConcretadasMes > 0 ? formatCompact(stats.misIngresosMes) + ' en ingresos' : 'Sin concretadas aún'"
        />
        <StatsCard
          label="Ventas del Mes"
          :value="stats.misVentasMes"
          icon="i-heroicons-chart-bar"
          color="blue"
        />
        <StatsCard
          label="Coordinadas"
          :value="stats.misAceptadas"
          icon="i-heroicons-check-circle"
          color="teal"
        />
        <StatsCard
          v-if="cicloActivo"
          label="Estimado Ciclo"
          :value="formatCompact(estimadoTotal)"
          icon="i-heroicons-calculator"
          color="purple"
          :sub="`${ventasConcretadasCiclo} concretadas`"
        />
        <StatsCard
          v-if="ventasConComentariosPendientes > 0"
          label="Comentarios"
          :value="ventasConComentariosPendientes"
          icon="i-heroicons-chat-bubble-left-ellipsis"
          color="orange"
          sub="Pendientes de lectura"
        />
      </div>

      <DashboardDoughnutChart
        v-if="ventasPropiasMes.length > 0"
        title="Distribución de Mis Ventas (Mes)"
        :labels="distribucionEstadosPropias.labels"
        :data="distribucionEstadosPropias.data"
        :colors="distribucionEstadosPropias.colors"
      />

      <div class="rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900/50 dark:ring-white/5 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-white/5">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Mis Ventas</h3>
        </div>
        <div class="p-1">
          <VentaTable :ventas="ventas" :loading="loading" :show-vendedor="false" :lecturas="lecturas" />
        </div>
      </div>
    </template>

    <!-- ============ LIDER ============ -->
    <template v-else-if="profile?.rol === 'lider'">
      <!-- Mis Ventas -->
      <div>
        <div class="flex items-center gap-2 mb-3">
          <div class="h-6 w-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-user" class="w-3.5 h-3.5 text-blue-400" />
          </div>
          <h3 class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Mis Ventas</h3>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            label="Concretadas"
            :value="stats.misConcretadasMes"
            icon="i-heroicons-banknotes"
            color="green"
            :sub="stats.misConcretadasMes > 0 ? formatCompact(stats.misIngresosMes) + ' en ingresos' : undefined"
          />
          <StatsCard
            label="Ventas del Mes"
            :value="stats.misVentasMes"
            icon="i-heroicons-chart-bar"
            color="blue"
          />
          <StatsCard
            label="Coordinadas"
            :value="stats.misAceptadas"
            icon="i-heroicons-check-circle"
            color="teal"
          />
          <StatsCard
            v-if="cicloActivo"
            label="Estimado Ciclo"
            :value="formatCompact(estimadoTotal)"
            icon="i-heroicons-calculator"
            color="purple"
            sub="Comisión + Bonus"
          />
        </div>
      </div>

      <DashboardDoughnutChart
        v-if="ventasPropiasMes.length > 0"
        title="Distribución de Mis Ventas (Mes)"
        :labels="distribucionEstadosPropias.labels"
        :data="distribucionEstadosPropias.data"
        :colors="distribucionEstadosPropias.colors"
      />

      <div class="rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900/50 dark:ring-white/5 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-white/5">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Mis Ventas</h3>
        </div>
        <div class="p-1">
          <VentaTable :ventas="ventasPropias" :loading="loading" :show-vendedor="false" :lecturas="lecturas" />
        </div>
      </div>

      <!-- Mi Equipo -->
      <div class="pt-2">
        <div class="flex items-center gap-2 mb-3">
          <div class="h-6 w-6 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-users" class="w-3.5 h-3.5 text-orange-400" />
          </div>
          <h3 class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Mi Equipo</h3>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <StatsCard
            label="Concretadas"
            :value="stats.equipoConcretadas"
            icon="i-heroicons-banknotes"
            color="green"
            :sub="stats.equipoConcretadas > 0 ? formatCompact(stats.equipoIngresos) + ' en ingresos' : undefined"
          />
          <StatsCard
            label="Ventas del Mes"
            :value="stats.equipoMes"
            icon="i-heroicons-users"
            color="orange"
          />
          <StatsCard
            label="Coordinadas"
            :value="stats.equipoAceptadas"
            icon="i-heroicons-check-badge"
            color="teal"
          />
        </div>
      </div>

      <DashboardDoughnutChart
        v-if="ventasEquipoMes.length > 0"
        title="Distribución del Equipo (Mes)"
        :labels="distribucionEstadosEquipo.labels"
        :data="distribucionEstadosEquipo.data"
        :colors="distribucionEstadosEquipo.colors"
      />

      <div class="rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900/50 dark:ring-white/5 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-white/5">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Ventas de mi Equipo</h3>
        </div>
        <div class="p-1">
          <VentaTable :ventas="ventasEquipo" :loading="loading" :show-vendedor="true" :can-export="true" :lecturas="lecturas" />
        </div>
      </div>
    </template>

    <!-- ============ OFICINISTA ============ -->
    <template v-else-if="profile?.rol === 'oficinista'">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          label="Concretadas"
          :value="stats.concretadas"
          icon="i-heroicons-banknotes"
          color="green"
          :sub="stats.concretadas > 0 ? formatCompact(stats.ingresosMes) + ' en ingresos' : undefined"
        />
        <StatsCard
          label="Ventas del Mes"
          :value="stats.totalMes"
          icon="i-heroicons-chart-bar"
          color="blue"
        />
        <StatsCard
          label="Coordinadas"
          :value="stats.aceptadas"
          icon="i-heroicons-check-circle"
          color="teal"
          :sub="`${stats.porcentajeConversion}% conversión`"
        />
        <StatsCard
          v-if="ventasConComentariosPendientes > 0"
          label="Comentarios"
          :value="ventasConComentariosPendientes"
          icon="i-heroicons-chat-bubble-left-ellipsis"
          color="orange"
          sub="Pendientes de lectura"
        />
        <StatsCard
          v-if="cicloActivo"
          label="Estimado Ciclo"
          :value="formatCompact(estimadoTotal)"
          icon="i-heroicons-calculator"
          color="purple"
          :sub="`${ventasConcretadasCiclo} concretadas`"
        />
      </div>

      <div v-if="ventasMes.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      <div class="rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900/50 dark:ring-white/5 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-white/5">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Todas las Ventas</h3>
        </div>
        <div class="p-1">
          <VentaTable :ventas="ventas" :loading="loading" :show-vendedor="true" :can-export="true" :lecturas="lecturas" />
        </div>
      </div>
    </template>

    <!-- ============ ADMIN ============ -->
    <template v-else-if="profile?.rol === 'admin'">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          label="Ingresos Concretados"
          :value="formatCompact(stats.ingresosMes)"
          icon="i-heroicons-banknotes"
          color="green"
          :sub="`${stats.concretadas} ventas concretadas`"
        />
        <StatsCard
          label="Ventas del Mes"
          :value="stats.totalMes"
          icon="i-heroicons-chart-bar"
          color="blue"
        />
        <StatsCard
          label="Conversión"
          :value="`${stats.porcentajeConversion}%`"
          icon="i-heroicons-arrow-trending-up"
          color="teal"
          :sub="`${stats.aceptadas} coord. / ${stats.totalMes} total`"
        />
        <StatsCard
          v-if="cicloActivo"
          label="Comisiones Ciclo"
          :value="formatCompact(totalComisionesCiclo)"
          icon="i-heroicons-calculator"
          color="purple"
          :sub="`Cierre: ${formatFecha(fechaCierrePrevista)}`"
        />
      </div>

      <div v-if="ventasMes.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      <!-- Rankings -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900/50 dark:ring-white/5 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-white/5">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Ranking de Vendedores (Mes)</h3>
          </div>
          <div class="overflow-x-auto p-1">
            <UTable :rows="rankingVendedores" :columns="rankingColumns" />
          </div>
        </div>

        <div class="rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900/50 dark:ring-white/5 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-white/5">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Actividad de Oficinistas</h3>
          </div>
          <div class="overflow-x-auto p-1">
            <UTable :rows="actividadOficinistas" :columns="actividadColumns" />
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900/50 dark:ring-white/5 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-white/5">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Todas las Ventas</h3>
        </div>
        <div class="p-1">
          <VentaTable :ventas="ventas" :loading="loading" :show-vendedor="true" :can-export="true" :lecturas="lecturas" />
        </div>
      </div>
    </template>

    <!-- Loading -->
    <div v-if="loading && !profile" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-500 animate-spin" />
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

const formatCompact = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `$${Math.round(n / 1_000)}k`
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

const formatFecha = (f: string) => {
  if (!f) return ''
  return new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

const rankingColumns = [
  { key: 'nombre', label: 'Vendedor' },
  { key: 'total', label: 'Total' },
  { key: 'concretadas', label: 'Concretadas' },
  { key: 'ingresos', label: 'Ingresos' },
]
const actividadColumns = [
  { key: 'nombre', label: 'Oficinista' },
  { key: 'gestionadas', label: 'Gestionadas' },
]

onMounted(async () => {
  const [{ data }, { data: lecturasData }, { data: cicloData }] = await Promise.all([
    client
      .from('ventas')
      .select('*, profiles:vendedor_id(nombre, rol, avatar_config)')
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
const ventasPropiasMes = computed(() =>
  ventasPropias.value.filter(v => v.fecha_carga >= inicioMes)
)
const ventasEquipo = computed(() =>
  ventas.value.filter(v => v.vendedor_id !== profile.value?.id)
)
const ventasEquipoMes = computed(() =>
  ventasEquipo.value.filter(v => v.fecha_carga >= inicioMes)
)

const stats = computed(() => {
  const propias = ventas.value.filter(v => v.vendedor_id === profile.value?.id)
  const propiasMes = propias.filter(v => v.fecha_carga >= inicioMes)
  const equipo = ventas.value.filter(v => v.vendedor_id !== profile.value?.id)
  const equipoMes = equipo.filter(v => v.fecha_carga >= inicioMes)
  const total = ventasMes.value.length
  const aceptadas = ventasMes.value.filter(v => v.estado === 'coordinado').length
  const concretadas = ventasMes.value.filter(v => v.estado === 'concretado').length
  const ingresosMes = ventasMes.value
    .filter(v => v.estado === 'concretado')
    .reduce((sum: number, v: any) => sum + (Number(v.precio) || 0), 0)
  const misConcretadasMes = propiasMes.filter(v => v.estado === 'concretado').length
  const misIngresosMes = propiasMes
    .filter(v => v.estado === 'concretado')
    .reduce((sum: number, v: any) => sum + (Number(v.precio) || 0), 0)
  const equipoConcretadas = equipoMes.filter(v => v.estado === 'concretado').length
  const equipoIngresos = equipoMes
    .filter(v => v.estado === 'concretado')
    .reduce((sum: number, v: any) => sum + (Number(v.precio) || 0), 0)

  return {
    misVentasMes: propiasMes.length,
    misAceptadas: propias.filter(v => v.estado === 'coordinado').length,
    misConcretadasMes,
    misIngresosMes,
    totalMes: total,
    aceptadas,
    concretadas,
    ingresosMes,
    porcentajeConversion: total > 0 ? Math.round((aceptadas / total) * 100) : 0,
    equipoMes: equipoMes.length,
    equipoAceptadas: equipoMes.filter(v => v.estado === 'coordinado').length,
    equipoConcretadas,
    equipoIngresos,
  }
})

const tieneComentarioNuevo = (venta: any): boolean => {
  const log = venta.comentarios_gestion
  if (!Array.isArray(log) || log.length === 0) return false
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
  const map: Record<string, { nombre: string; total: number; concretadas: number; ingresos: string }> = {}
  ventasMes.value.forEach(v => {
    const nombre = v.profiles?.nombre ?? 'Desconocido'
    if (!map[nombre]) map[nombre] = { nombre, total: 0, concretadas: 0, ingresos: '' }
    map[nombre].total++
    if (v.estado === 'concretado') map[nombre].concretadas++
  })
  const result = Object.values(map)
  result.forEach(r => {
    const ingreso = ventasMes.value
      .filter(v => (v.profiles?.nombre ?? 'Desconocido') === r.nombre && v.estado === 'concretado')
      .reduce((sum: number, v: any) => sum + (Number(v.precio) || 0), 0)
    r.ingresos = formatCompact(ingreso)
  })
  return result.sort((a, b) => b.concretadas - a.concretadas || b.total - a.total)
})

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
  { key: 'concretado',   label: 'Concretadas',  color: '#10b981' },
  { key: 'coordinado',   label: 'Coordinadas',  color: '#06b6d4' },
  { key: 'en_proceso',   label: 'En Proceso',   color: '#3b82f6' },
  { key: 'pendiente',    label: 'Pendientes',   color: '#64748b' },
  { key: 'en_conflicto', label: 'En Conflicto', color: '#f97316' },
  { key: 'rechazado',    label: 'Rechazadas',   color: '#ef4444' },
]

function buildDistribucion(source: any[]) {
  const labels = ESTADOS_CONFIG.map(e => e.label)
  const data = ESTADOS_CONFIG.map(e => source.filter(v => v.estado === e.key).length)
  const colors = ESTADOS_CONFIG.map(e => e.color)
  return { labels, data, colors }
}

const distribucionEstados = computed(() => buildDistribucion(ventasMes.value))
const distribucionEstadosPropias = computed(() => buildDistribucion(ventasPropiasMes.value))
const distribucionEstadosEquipo = computed(() => buildDistribucion(ventasEquipoMes.value))

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
      { label: 'Concretadas',  data: labels.map(s => semanas[s].concretadas),  backgroundColor: '#10b981' },
      { label: 'Coordinadas',  data: labels.map(s => semanas[s].coordinadas),  backgroundColor: '#06b6d4' },
      { label: 'Rechazadas',   data: labels.map(s => semanas[s].rechazadas),   backgroundColor: '#ef4444' },
    ],
  }
})

useHead({ title: 'Dashboard — AMSI SRL' })
</script>
