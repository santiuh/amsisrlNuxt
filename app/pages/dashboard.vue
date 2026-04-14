<template>
  <div class="space-y-8">
    <!-- Cards de ciclo por empresa (compartido entre roles) -->
    <div v-if="ciclosComisiones.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CicloCard
        v-for="cc in ciclosComisiones"
        :key="cc.empresa"
        :empresa="cc.empresa"
        :label="cc.label"
        :fecha-inicio="cc.fechaInicio"
        :fecha-cierre="cc.fechaCierre"
        :ingresos="cc.ingresos"
        :concretadas="cc.concretadas"
        :ventas-creadas="cc.ventasCreadas"
        :ultimo-ciclo="cc.ultimoCiclo"
      />
    </div>

    <!-- ============ VENDEDOR ============ -->
    <template v-if="profile?.rol === 'vendedor'">
      <DashboardDoughnutChart
        v-if="ventasPropiasCiclo.length > 0"
        title="Estados de mis ventas del ciclo"
        :labels="distribucionEstadosPropias.labels"
        :data="distribucionEstadosPropias.data"
        :colors="distribucionEstadosPropias.colors"
      />

      <div class="rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Mis Ventas</h3>
        </div>
        <div class="p-1">
          <VentaTable :ventas="ventasFiltradas" :loading="loading" :show-vendedor="false" :lecturas="lecturas" />
        </div>
      </div>
    </template>

    <!-- ============ LIDER ============ -->
    <template v-else-if="profile?.rol === 'lider'">
      <DashboardDoughnutChart
        v-if="ventasPropiasCiclo.length > 0"
        title="Estados de mis ventas del ciclo"
        :labels="distribucionEstadosPropias.labels"
        :data="distribucionEstadosPropias.data"
        :colors="distribucionEstadosPropias.colors"
      />

      <div class="rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Mis Ventas</h3>
        </div>
        <div class="p-1">
          <VentaTable :ventas="ventasPropias" :loading="loading" :show-vendedor="false" :lecturas="lecturas" />
        </div>
      </div>

      <DashboardDoughnutChart
        v-if="ventasEquipoCiclo.length > 0"
        title="Estados de ventas del equipo"
        :labels="distribucionEstadosEquipo.labels"
        :data="distribucionEstadosEquipo.data"
        :colors="distribucionEstadosEquipo.colors"
      />

      <div class="rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Ventas de mi Equipo</h3>
        </div>
        <div class="p-1">
          <VentaTable :ventas="ventasEquipo" :loading="loading" :show-vendedor="true" :can-export="true" :lecturas="lecturas" />
        </div>
      </div>
    </template>

    <!-- ============ OFICINISTA ============ -->
    <template v-else-if="profile?.rol === 'oficinista'">
      <div v-if="ventasCiclo.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardDoughnutChart
          title="Estados de las ventas del ciclo"
          :labels="distribucionEstados.labels"
          :data="distribucionEstados.data"
          :colors="distribucionEstados.colors"
        />
        <DashboardBarChart
          title="Ventas por ciclo"
          :labels="ventasPorCiclo.labels"
          :datasets="ventasPorCiclo.datasets"
        />
      </div>

      <div class="rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Todas las Ventas</h3>
        </div>
        <div class="p-1">
          <VentaTable :ventas="ventasFiltradas" :loading="loading" :show-vendedor="true" :can-export="true" :lecturas="lecturas" />
        </div>
      </div>
    </template>

    <!-- ============ ADMIN ============ -->
    <template v-else-if="profile?.rol === 'admin'">
      <div v-if="ventasCiclo.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardDoughnutChart
          title="Estados de las ventas del ciclo"
          :labels="distribucionEstados.labels"
          :data="distribucionEstados.data"
          :colors="distribucionEstados.colors"
        />
        <DashboardBarChart
          title="Ventas por ciclo"
          :labels="ventasPorCiclo.labels"
          :datasets="ventasPorCiclo.datasets"
        />
      </div>

      <!-- Rankings por empresa (uno por cada ciclo activo) + actividad oficinistas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="cc in ciclosComisiones"
          :key="`ranking-${cc.empresa}`"
          class="rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] overflow-hidden"
        >
          <div class="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Ranking {{ cc.label }} (Ciclo)
            </h3>
          </div>
          <div class="overflow-x-auto p-1">
            <UTable :rows="cc.ranking" :columns="rankingColumns">
              <template #vendedor-data="{ row }">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600">
                    <UserAvatar :config="row.avatar_config" :seed="row.nombre" class="w-full h-full" />
                  </div>
                  <span :title="row.nombre">{{ row.nombre }}</span>
                </div>
              </template>
            </UTable>
          </div>
        </div>

        <div class="rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Actividad de Oficinistas</h3>
          </div>
          <div class="overflow-x-auto p-1">
            <UTable :rows="actividadOficinistas" :columns="actividadColumns" />
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Todas las Ventas</h3>
        </div>
        <div class="p-1">
          <VentaTable :ventas="ventasFiltradas" :loading="loading" :show-vendedor="true" :can-export="true" :lecturas="lecturas" />
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

const empresaFiltro = ref('')

// Comisiones — una entrada por empresa con ciclo activo
interface CicloComisionData {
  empresa: string
  label: string
  color: string
  fechaInicio: string
  fechaCierre: string
  // Stats role-appropriate (admin: totales, otros: personales)
  ingresos: number
  concretadas: number
  ventasCreadas: number
  // Commission estimates
  estimadoComision: number
  estimadoTotal: number
  ventasConcretadas: number
  estimadoBonus: number
  totalComisiones: number
  // Equipo stats (lider only)
  equipoVentasCreadas: number
  equipoConcretadas: number
  equipoIngresos: number
  // Último ciclo cerrado
  ultimoCiclo: { ingresos: number; concretadas: number; creadas: number } | null
  // Historial de ciclos cerrados (para bar chart)
  historialCiclos: { label: string; concretadas: number }[]
  // Ranking de vendedores (rol vendedor/lider) alineado con calcularEstimaciones
  ranking: Array<{
    vendedor_id: string
    nombre: string
    avatar_config: any
    creadas: number
    concretadas: number
    ingresos: string
    comision: string
    _orden: number
  }>
}
const ciclosComisiones = ref<CicloComisionData[]>([])

const formatCompact = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `$${Math.round(n / 1_000)}k`
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

const formatFecha = (f: string) => {
  if (!f) return ''
  const date = f.length === 10 ? new Date(`${f}T12:00:00`) : new Date(f)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

const rankingColumns = [
  { key: 'vendedor', label: 'Vendedor' },
  { key: 'creadas', label: 'Creadas' },
  { key: 'concretadas', label: 'Concretadas' },
  { key: 'ingresos', label: 'Ingresos' },
  { key: 'comision', label: 'Comisión' },
]
const actividadColumns = [
  { key: 'nombre', label: 'Oficinista' },
  { key: 'gestionadas', label: 'Gestionadas' },
]

// Cargar comisiones de TODAS las empresas con ciclo activo
const EMPRESAS_CONFIG: Record<string, { label: string; color: string }> = {
  express: { label: 'Express', color: 'purple' },
  ultra: { label: 'Ultra', color: 'violet' },
}

const cargarComisiones = async () => {
  ciclosComisiones.value = []
  if (!profile.value) return

  const isGlobal = ['admin', 'oficinista'].includes(profile.value.rol)
  const myId = profile.value.id

  // Obtener todos los ciclos activos (uno por empresa max)
  const { data: ciclosData } = await client
    .from('ciclos_comision')
    .select('*')
    .eq('estado', 'activo')

  if (!ciclosData || ciclosData.length === 0) return

  // Datos compartidos
  const [{ data: profilesData }, { data: gruposData }] = await Promise.all([
    client.from('profiles').select('id, nombre, rol, grupo_id, avatar_config'),
    client.from('grupos').select('id, lider_id'),
  ])

  // Determinar miembros del equipo para lider
  const isLider = profile.value.rol === 'lider'
  let equipoMemberIds: string[] = []
  if (isLider && gruposData && profilesData) {
    const miGrupo = gruposData.find((g: any) => g.lider_id === myId)
    if (miGrupo) {
      equipoMemberIds = profilesData
        .filter((p: any) => p.grupo_id === miGrupo.id && p.id !== myId)
        .map((p: any) => p.id)
    }
  }

  // Procesar cada ciclo en paralelo
  const resultados = await Promise.all(
    ciclosData.map(async (ciclo) => {
      const empresa = ciclo.empresa ?? 'express'

      // Fetch: concretadas del ciclo + config + último ciclo cerrado
      const [
        { data: ventasCicloData },
        { data: pctGrupoData },
        { data: pctLiderData },
        { data: lastCicloData },
      ] = await Promise.all([
        client.from('ventas').select('id, vendedor_id, precio, precio_concretado, fecha_concretado')
          .eq('estado', 'concretado')
          .eq('empresa', empresa)
          .gte('fecha_concretado', ciclo.fecha_inicio)
          .lte('fecha_concretado', new Date().toISOString()),
        client.from('configuracion').select('valor').eq('clave', 'comision_porcentaje_grupo').eq('empresa', empresa).single(),
        client.from('configuracion').select('valor').eq('clave', 'comision_porcentaje_lider').eq('empresa', empresa).single(),
        client.from('ciclos_comision').select('id, fecha_inicio, fecha_cierre_real')
          .eq('empresa', empresa)
          .eq('estado', 'cerrado')
          .order('fecha_cierre_real', { ascending: false })
          .limit(4),
      ])

      // Calcular comisiones
      const pctGrupo = Number(pctGrupoData?.valor ?? 80)
      const pctLider = Number(pctLiderData?.valor ?? 25)
      const estimaciones = calcularEstimaciones(
        ventasCicloData ?? [],
        profilesData ?? [],
        gruposData ?? [],
        { pct_grupo: pctGrupo, pct_lider: pctLider },
      )
      const miEstimacion = estimaciones.find(e => e.vendedor_id === myId)
      const cfg = EMPRESAS_CONFIG[empresa] ?? { label: empresa, color: 'gray' }

      // Ranking por empresa: usa estimaciones (alineado con comisiones) + "creadas" por fecha_carga
      const ranking = estimaciones
        .filter(e => e.rol === 'vendedor' || e.rol === 'lider')
        .map((e) => {
          const perfil = profilesData?.find((p: any) => p.id === e.vendedor_id)
          const creadas = ventas.value.filter(v =>
            v.empresa === empresa &&
            v.vendedor_id === e.vendedor_id &&
            v.fecha_carga >= ciclo.fecha_inicio,
          ).length
          return {
            vendedor_id: e.vendedor_id,
            nombre: e.nombre,
            avatar_config: (perfil as any)?.avatar_config ?? null,
            creadas,
            concretadas: e.cantidad_ventas,
            ingresos: formatCompact(e.monto_total_ventas),
            comision: formatCompact(e.monto_total),
            _orden: e.monto_total,
          }
        })
        .sort((a, b) => b._orden - a._orden || b.concretadas - a.concretadas)

      // Stats del ciclo actual (según rol)
      const allConcretadas = ventasCicloData ?? []
      const myConcretadas = allConcretadas.filter(v => v.vendedor_id === myId)

      const ingresos = isGlobal
        ? allConcretadas.reduce((sum, v) => sum + Number(v.precio_concretado ?? v.precio), 0)
        : myConcretadas.reduce((sum, v) => sum + Number(v.precio_concretado ?? v.precio), 0)
      const concretadas = isGlobal ? allConcretadas.length : myConcretadas.length

      // Ventas creadas en el período del ciclo (desde ventas ya cargadas)
      const ventasCreadas = ventas.value.filter(v =>
        v.empresa === empresa &&
        v.fecha_carga >= ciclo.fecha_inicio &&
        (isGlobal || v.vendedor_id === myId),
      ).length

      // Equipo stats para lider
      let equipoVentasCreadas = 0
      let equipoConcretadasCount = 0
      let equipoIngresosAmount = 0
      if (isLider && equipoMemberIds.length > 0) {
        const equipoConcretadasList = allConcretadas.filter(v => equipoMemberIds.includes(v.vendedor_id))
        equipoConcretadasCount = equipoConcretadasList.length
        equipoIngresosAmount = equipoConcretadasList.reduce((sum, v) => sum + Number(v.precio_concretado ?? v.precio), 0)
        equipoVentasCreadas = ventas.value.filter(v =>
          v.empresa === empresa &&
          v.fecha_carga >= ciclo.fecha_inicio &&
          equipoMemberIds.includes(v.vendedor_id),
        ).length
      }

      // Ciclos cerrados — historial + último ciclo
      let ultimoCiclo: CicloComisionData['ultimoCiclo'] = null
      const historialCiclos: CicloComisionData['historialCiclos'] = []
      const closedCiclos = lastCicloData ?? []

      if (closedCiclos.length > 0) {
        // Fetch pagos de todos los ciclos cerrados en una sola query
        const closedIds = closedCiclos.map((c: any) => c.id)
        const { data: allPagos } = await client
          .from('ciclo_pagos')
          .select('ciclo_id, cantidad_ventas, monto_total_ventas, vendedor_id')
          .in('ciclo_id', closedIds)
        const pagosAll = allPagos ?? []

        // Último ciclo cerrado (para CicloCard)
        const lastClosed = closedCiclos[0]
        const lastPagos = pagosAll.filter((p: any) => p.ciclo_id === lastClosed.id)

        if (isGlobal) {
          ultimoCiclo = {
            ingresos: lastPagos.reduce((sum: number, p: any) => sum + (p.monto_total_ventas || 0), 0),
            concretadas: lastPagos.reduce((sum: number, p: any) => sum + (p.cantidad_ventas || 0), 0),
            creadas: ventas.value.filter(v =>
              v.empresa === empresa &&
              v.fecha_carga >= lastClosed.fecha_inicio &&
              lastClosed.fecha_cierre_real && v.fecha_carga <= lastClosed.fecha_cierre_real,
            ).length,
          }
        } else {
          const miPago = lastPagos.find((p: any) => p.vendedor_id === myId)
          if (miPago) {
            ultimoCiclo = {
              ingresos: miPago.monto_total_ventas || 0,
              concretadas: miPago.cantidad_ventas || 0,
              creadas: ventas.value.filter(v =>
                v.empresa === empresa &&
                v.vendedor_id === myId &&
                v.fecha_carga >= lastClosed.fecha_inicio &&
                lastClosed.fecha_cierre_real && v.fecha_carga <= lastClosed.fecha_cierre_real,
              ).length,
            }
          }
        }

        // Historial de concretadas por ciclo (para bar chart)
        for (const cc of closedCiclos) {
          const ccPagos = pagosAll.filter((p: any) => p.ciclo_id === cc.id)
          const totalConc = isGlobal
            ? ccPagos.reduce((sum: number, p: any) => sum + (p.cantidad_ventas || 0), 0)
            : (ccPagos.find((p: any) => p.vendedor_id === myId)?.cantidad_ventas ?? 0)
          const fInicio = new Date(cc.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
          const fCierre = cc.fecha_cierre_real
            ? new Date(cc.fecha_cierre_real).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
            : '?'
          historialCiclos.push({ label: `${fInicio} - ${fCierre}`, concretadas: totalConc })
        }
        // Orden cronológico (más antiguo primero)
        historialCiclos.reverse()
      }

      return {
        empresa,
        label: cfg.label,
        color: cfg.color,
        fechaInicio: ciclo.fecha_inicio,
        fechaCierre: ciclo.fecha_cierre_prevista,
        ingresos,
        concretadas,
        ventasCreadas,
        equipoVentasCreadas,
        equipoConcretadas: equipoConcretadasCount,
        equipoIngresos: equipoIngresosAmount,
        estimadoComision: miEstimacion?.monto_comision ?? 0,
        estimadoTotal: miEstimacion?.monto_total ?? 0,
        ventasConcretadas: miEstimacion?.cantidad_ventas ?? 0,
        estimadoBonus: miEstimacion?.monto_liderazgo ?? 0,
        totalComisiones: estimaciones.reduce((sum, e) => sum + e.monto_total, 0),
        ultimoCiclo,
        historialCiclos,
        ranking,
      } satisfies CicloComisionData
    }),
  )

  // Ordenar Express primero
  ciclosComisiones.value = resultados.sort((a, b) => a.empresa === 'express' ? -1 : 1)
}

// Totales agregados desde ciclosComisiones (respeta filtro de empresa y fechas por ciclo)
const statsCicloTotal = computed(() => {
  const ciclos = empresaFiltro.value
    ? ciclosComisiones.value.filter(c => c.empresa === empresaFiltro.value)
    : ciclosComisiones.value
  return {
    ventasCreadas: ciclos.reduce((sum, c) => sum + c.ventasCreadas, 0),
    concretadas: ciclos.reduce((sum, c) => sum + c.concretadas, 0),
    ingresos: ciclos.reduce((sum, c) => sum + c.ingresos, 0),
    equipoVentasCreadas: ciclos.reduce((sum, c) => sum + (c.equipoVentasCreadas ?? 0), 0),
    equipoConcretadas: ciclos.reduce((sum, c) => sum + (c.equipoConcretadas ?? 0), 0),
    equipoIngresos: ciclos.reduce((sum, c) => sum + (c.equipoIngresos ?? 0), 0),
  }
})

onMounted(async () => {
  const [{ data }, { data: lecturasData }] = await Promise.all([
    client
      .from('ventas')
      .select('*, profiles:vendedor_id(nombre, rol, avatar_config)')
      .order('fecha_carga', { ascending: false }),
    client
      .from('venta_lecturas')
      .select('venta_id, ultima_lectura'),
  ])
  ventas.value = data ?? []
  lecturas.value = Object.fromEntries(
    (lecturasData ?? []).map((l: any) => [l.venta_id, l.ultima_lectura])
  )

  await cargarComisiones()
  loading.value = false
})

// Inicio del período: fecha más temprana de ciclos activos, o inicio del mes si no hay ciclo
const inicioPeriodo = computed(() => {
  if (ciclosComisiones.value.length > 0) {
    return ciclosComisiones.value
      .map(c => c.fechaInicio)
      .sort()[0] // más antiguo
  }
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
})

// Ventas filtradas por empresa seleccionada
const ventasFiltradas = computed(() => {
  if (!empresaFiltro.value) return ventas.value
  return ventas.value.filter(v => v.empresa === empresaFiltro.value)
})

const enCiclo = (v: any) => {
  const ciclo = ciclosComisiones.value.find(c => c.empresa === v.empresa)
  return ciclo && v.fecha_carga >= ciclo.fechaInicio
}
const ventasCiclo = computed(() =>
  ventasFiltradas.value.filter(enCiclo)
)
const ventasPropias = computed(() =>
  ventasFiltradas.value.filter(v => v.vendedor_id === profile.value?.id)
)
const ventasPropiasCiclo = computed(() =>
  ventasPropias.value.filter(enCiclo)
)
const ventasEquipo = computed(() =>
  ventasFiltradas.value.filter(v => v.vendedor_id !== profile.value?.id)
)
const ventasEquipoCiclo = computed(() =>
  ventasEquipo.value.filter(enCiclo)
)

const stats = computed(() => {
  const propiasCiclo = ventasPropiasCiclo.value
  const equipoCiclo = ventasEquipoCiclo.value
  const total = ventasCiclo.value.length
  const aceptadas = ventasCiclo.value.filter(v => v.estado === 'coordinado').length
  const concretadas = ventasCiclo.value.filter(v => v.estado === 'concretado').length
  const ingresos = ventasCiclo.value
    .filter(v => v.estado === 'concretado')
    .reduce((sum: number, v: any) => sum + (Number(v.precio_concretado ?? v.precio) || 0), 0)
  const misConcretadas = propiasCiclo.filter(v => v.estado === 'concretado').length
  const misIngresos = propiasCiclo
    .filter(v => v.estado === 'concretado')
    .reduce((sum: number, v: any) => sum + (Number(v.precio_concretado ?? v.precio) || 0), 0)
  const equipoConcretadas = equipoCiclo.filter(v => v.estado === 'concretado').length
  const equipoIngresos = equipoCiclo
    .filter(v => v.estado === 'concretado')
    .reduce((sum: number, v: any) => sum + (Number(v.precio_concretado ?? v.precio) || 0), 0)

  return {
    misVentasCiclo: propiasCiclo.length,
    misAceptadas: ventasPropias.value.filter(v => v.estado === 'coordinado').length,
    misConcretadas,
    misIngresos,
    totalCiclo: total,
    aceptadas,
    concretadas,
    ingresos,
    porcentajeConversion: total > 0 ? Math.round((aceptadas / total) * 100) : 0,
    equipoCiclo: equipoCiclo.length,
    equipoAceptadas: equipoCiclo.filter(v => v.estado === 'coordinado').length,
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
  ventasFiltradas.value.filter(v => tieneComentarioNuevo(v)).length
)

const actividadOficinistas = computed(() => {
  const map: Record<string, { nombre: string; gestionadas: number }> = {}
  ventasFiltradas.value.forEach(v => {
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
  { key: 'concretado',   label: 'Concretadas',   color: '#10b981' },
  { key: 'coordinado',   label: 'Coordinadas',   color: '#06b6d4' },
  { key: 'en_proceso',   label: 'En Proceso',    color: '#3b82f6' },
  { key: 'pendiente',    label: 'Pendientes',    color: '#64748b' },
  { key: 'en_conflicto', label: 'En Conflicto',  color: '#f97316' },
  { key: 'rechazado',    label: 'Rechazadas',    color: '#ef4444' },
  { key: 'proxima_zona', label: 'Próxima Zona',  color: '#8b5cf6' },
]

function buildDistribucion(source: any[]) {
  const labels = ESTADOS_CONFIG.map(e => e.label)
  const data = ESTADOS_CONFIG.map(e => source.filter(v => v.estado === e.key).length)
  const colors = ESTADOS_CONFIG.map(e => e.color)
  return { labels, data, colors }
}

const distribucionEstados = computed(() => buildDistribucion(ventasCiclo.value))
const distribucionEstadosPropias = computed(() => buildDistribucion(ventasPropiasCiclo.value))
const distribucionEstadosEquipo = computed(() => buildDistribucion(ventasEquipoCiclo.value))

const ventasPorCiclo = computed(() => {
  if (ciclosComisiones.value.length === 0) return { labels: [], datasets: [] }

  const labels: string[] = []
  const data: number[] = []

  // Ciclos cerrados (historial) — usar labels del primer empresa, sumar across all
  const ref = ciclosComisiones.value[0]
  for (let i = 0; i < ref.historialCiclos.length; i++) {
    labels.push(ref.historialCiclos[i].label)
    const total = ciclosComisiones.value.reduce((sum, cc) =>
      sum + (cc.historialCiclos[i]?.concretadas ?? 0), 0)
    data.push(total)
  }

  // Ciclo actual
  const fI = new Date(ref.fechaInicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  const fC = new Date(ref.fechaCierre).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  labels.push(`${fI} - ${fC} *`)
  data.push(ciclosComisiones.value.reduce((sum, cc) => sum + cc.concretadas, 0))

  return {
    labels,
    datasets: [
      { label: 'Concretadas', data, backgroundColor: '#10b981' },
    ],
  }
})

useHead({ title: 'Dashboard — AMSI SRL' })
</script>
