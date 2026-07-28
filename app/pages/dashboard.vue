<template>
  <DashboardSkeleton v-if="loading" :role="(profile?.rol as any) ?? 'vendedor'" />

  <div v-else class="space-y-4 md:space-y-8">
    <!-- Cards de ciclo por empresa (solo desktop; en mobile todos los roles ven CicloHeroMobile) -->
    <div
      v-if="ciclosComisiones.length > 0"
      class="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
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
      <!-- Mobile: hero unificado de ciclos -->
      <CicloHeroMobile
        v-if="ciclosComisiones.length > 0"
        :ciclos="ciclosComisiones"
        :mes-data="mesData"
        class="md:hidden"
      />

      <DashboardEstadoBar
        title="Estados de mis ventas del mes"
        :labels="distribucionEstadosPropias.labels"
        :data="distribucionEstadosPropias.data"
        :colors="distribucionEstadosPropias.colors"
      />

      <!-- Desktop: 2 charts apilados -->
      <div v-if="ciclosComisiones.length > 0" class="hidden md:grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DashboardLineChart
          title="Mis ventas creadas por ciclo"
          :labels="creadasPorCiclo.labels"
          :datasets="creadasPorCiclo.datasets"
        />
        <DashboardLineChart
          title="Mis ventas concretadas por ciclo"
          :labels="concretadasPorCiclo.labels"
          :datasets="concretadasPorCiclo.datasets"
        />
      </div>
      <!-- Mobile: un chart con tabs -->
      <DashboardLineChartTabbed
        v-if="ciclosComisiones.length > 0"
        class="md:hidden"
        title-creadas="Mis ventas creadas por ciclo"
        title-concretadas="Mis ventas concretadas por ciclo"
        :creadas="creadasPorCiclo"
        :concretadas="concretadasPorCiclo"
      />

      <!-- Botoneras de atajos -->
      <DashboardShortcuts />

      <!-- Revisitas de prospección pendientes -->
      <DashboardRevisitas />

      <!-- Desktop: tabla -->
      <div class="hidden md:block rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Mis Ventas</h3>
        </div>
        <div class="p-1">
          <VentaTable :ventas="ventasFiltradas" :loading="loading" :show-vendedor="false" :lecturas="lecturas" />
        </div>
      </div>
      <!-- Mobile: lista de cards -->
      <div class="md:hidden">
        <div class="flex items-center justify-between gap-2 px-1 mb-2">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Mis Ventas</h3>
          <NuxtLink
            to="/ventas"
            class="text-xs font-medium text-cyan-600 dark:text-cyan-400 inline-flex items-center gap-1"
          >
            Ver todas
            <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
          </NuxtLink>
        </div>
        <VentaListMobile
          :ventas="ventasFiltradas"
          :loading="loading"
          :show-vendedor="false"
          :lecturas="lecturas"
        />
      </div>
    </template>

    <!-- ============ LIDER ============ -->
    <template v-else-if="profile?.rol === 'lider'">
      <!-- Mobile: hero unificado de ciclos -->
      <CicloHeroMobile
        v-if="ciclosComisiones.length > 0"
        :ciclos="ciclosComisiones"
        :mes-data="mesData"
        class="md:hidden"
      />

      <DashboardEstadoBar
        title="Estados de mis ventas del mes"
        :labels="distribucionEstadosPropias.labels"
        :data="distribucionEstadosPropias.data"
        :colors="distribucionEstadosPropias.colors"
      />

      <!-- Desktop: 2 charts apilados -->
      <div v-if="ciclosComisiones.length > 0" class="hidden md:grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DashboardLineChart
          title="Mis ventas creadas por ciclo"
          :labels="creadasPorCiclo.labels"
          :datasets="creadasPorCiclo.datasets"
        />
        <DashboardLineChart
          title="Mis ventas concretadas por ciclo"
          :labels="concretadasPorCiclo.labels"
          :datasets="concretadasPorCiclo.datasets"
        />
      </div>
      <!-- Mobile: un chart con tabs -->
      <DashboardLineChartTabbed
        v-if="ciclosComisiones.length > 0"
        class="md:hidden"
        title-creadas="Mis ventas creadas por ciclo"
        title-concretadas="Mis ventas concretadas por ciclo"
        :creadas="creadasPorCiclo"
        :concretadas="concretadasPorCiclo"
      />

      <!-- Botoneras de atajos -->
      <DashboardShortcuts />

      <!-- Revisitas de prospección pendientes -->
      <DashboardRevisitas />

      <!-- Desktop: tabla -->
      <div class="hidden md:block rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Mis Ventas</h3>
        </div>
        <div class="p-1">
          <VentaTable :ventas="ventasPropias" :loading="loading" :show-vendedor="false" :lecturas="lecturas" />
        </div>
      </div>
      <!-- Mobile: lista de cards -->
      <div class="md:hidden">
        <div class="flex items-center justify-between gap-2 px-1 mb-2">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Mis Ventas</h3>
          <NuxtLink
            to="/ventas"
            class="text-xs font-medium text-cyan-600 dark:text-cyan-400 inline-flex items-center gap-1"
          >
            Ver todas
            <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
          </NuxtLink>
        </div>
        <VentaListMobile
          :ventas="ventasPropias"
          :loading="loading"
          :show-vendedor="false"
          :lecturas="lecturas"
        />
      </div>

      <DashboardEstadoBar
        title="Estados de ventas del equipo (mes)"
        :labels="distribucionEstadosEquipo.labels"
        :data="distribucionEstadosEquipo.data"
        :colors="distribucionEstadosEquipo.colors"
      />

      <!-- Desktop: tabla equipo -->
      <div class="hidden md:block rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Ventas de mi Equipo</h3>
        </div>
        <div class="p-1">
          <VentaTable :ventas="ventasEquipo" :loading="loading" :show-vendedor="true" :can-export="true" :lecturas="lecturas" />
        </div>
      </div>
      <!-- Mobile: lista de cards equipo -->
      <div class="md:hidden">
        <div class="flex items-center justify-between gap-2 px-1 mb-2">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Ventas de mi Equipo</h3>
          <NuxtLink
            to="/ventas"
            class="text-xs font-medium text-cyan-600 dark:text-cyan-400 inline-flex items-center gap-1"
          >
            Ver todas
            <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
          </NuxtLink>
        </div>
        <VentaListMobile
          :ventas="ventasEquipo"
          :loading="loading"
          :show-vendedor="true"
          :lecturas="lecturas"
        />
      </div>
    </template>

    <!-- ============ OFICINISTA ============ -->
    <template v-else-if="profile?.rol === 'oficinista'">
      <!-- Mobile: hero unificado de ingresos -->
      <CicloHeroMobile
        v-if="ciclosComisiones.length > 0"
        :ciclos="ciclosComisiones"
        :mes-data="mesData"
        class="md:hidden"
      />

      <DashboardEstadoBar
        title="Estados de las ventas del mes"
        :labels="distribucionEstados.labels"
        :data="distribucionEstados.data"
        :colors="distribucionEstados.colors"
      />
      <div v-if="ciclosComisiones.length > 0" class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DashboardLineChart
          title="Ventas creadas por ciclo"
          :labels="creadasPorCiclo.labels"
          :datasets="creadasPorCiclo.datasets"
        />
        <DashboardLineChart
          title="Ventas concretadas por ciclo"
          :labels="concretadasPorCiclo.labels"
          :datasets="concretadasPorCiclo.datasets"
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
      <!-- Mobile: hero unificado de ingresos -->
      <CicloHeroMobile
        v-if="ciclosComisiones.length > 0"
        :ciclos="ciclosComisiones"
        :mes-data="mesData"
        class="md:hidden"
      />

      <DashboardEstadoBar
        title="Estados de las ventas del mes"
        :labels="distribucionEstados.labels"
        :data="distribucionEstados.data"
        :colors="distribucionEstados.colors"
      />
      <div v-if="ciclosComisiones.length > 0" class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DashboardLineChart
          title="Ventas creadas por ciclo"
          :labels="creadasPorCiclo.labels"
          :datasets="creadasPorCiclo.datasets"
        />
        <DashboardLineChart
          title="Ventas concretadas por ciclo"
          :labels="concretadasPorCiclo.labels"
          :datasets="concretadasPorCiclo.datasets"
        />
      </div>

      <!-- Botoneras de atajos -->
      <DashboardShortcuts />

      <!-- Revisitas de prospección pendientes -->
      <DashboardRevisitas />

      <!-- Últimas ventas (preview compacto) -->
      <div class="rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between gap-3">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Últimas ventas</h3>
          <NuxtLink
            to="/ventas"
            class="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 inline-flex items-center gap-1 transition-colors"
          >
            Ver todas
            <UIcon name="i-heroicons-arrow-right" class="w-3.5 h-3.5" />
          </NuxtLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50/50 dark:bg-white/[0.02] text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th class="px-4 py-2 text-left font-medium">Fecha</th>
                <th class="px-4 py-2 text-left font-medium">Empresa</th>
                <th class="px-4 py-2 text-left font-medium">Cliente</th>
                <th class="px-4 py-2 text-left font-medium">Vendedor</th>
                <th class="px-4 py-2 text-right font-medium">Precio</th>
                <th class="px-4 py-2 text-left font-medium">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-white/[0.05]">
              <tr
                v-for="v in ultimasVentas"
                :key="v.id"
                class="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ formatFecha(v.fecha_carga) }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset"
                    :class="EMPRESA_PILL_CLASS[v.empresa] ?? EMPRESA_PILL_CLASS.express"
                  >
                    {{ empresaLabel(v.empresa) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium max-w-[200px] truncate" :title="v.cliente">{{ v.cliente }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600">
                      <UserAvatar :config="v.profiles?.avatar_config" :seed="v.profiles?.nombre || ''" class-name="w-full h-full" />
                    </div>
                    <span class="text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ v.profiles?.nombre || '—' }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-right font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                  {{ formatPrecioARS(v.precio_concretado ?? v.precio) }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset"
                    :class="estadoPillClass(v.estado)"
                  >
                    {{ estadoLabel(v.estado) }}
                  </span>
                </td>
              </tr>
              <tr v-if="ultimasVentas.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No hay ventas todavía.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { calcularEstimaciones } from '~/composables/useComisiones'
import { empresaLabel } from '~/utils/empresa'

const client = useSupabaseClient()
const profile = useCurrentProfile()
// El par v-if/v-else del template tiene que ser el ÚNICO nodo raíz: cualquier otro
// nodo suelto (un comentario también cuenta) convierte la página en un fragmento y
// la transición de Nuxt deja la pantalla en blanco al navegar desde acá a otra página.
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
  // Historial de ciclos cerrados (para gráficos)
  historialCiclos: { label: string; concretadas: number; creadas: number }[]
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

const formatPrecioARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(n) || 0)

const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente', en_proceso: 'En Proceso', en_conflicto: 'En Conflicto',
  rechazado: 'Rechazado', coordinado: 'Coordinado', concretado: 'Concretado', proxima_zona: 'Próxima Zona',
}
const ESTADO_PILL: Record<string, string> = {
  pendiente: 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/40',
  en_proceso: 'bg-amber-50 text-amber-700 ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  en_conflicto: 'bg-orange-50 text-orange-700 ring-orange-200/60 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/20',
  rechazado: 'bg-rose-50 text-rose-700 ring-rose-200/60 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
  coordinado: 'bg-cyan-50 text-cyan-700 ring-cyan-200/60 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/20',
  concretado: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  proxima_zona: 'bg-violet-50 text-violet-700 ring-violet-200/60 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20',
}
const estadoLabel = (e: string) => ESTADO_LABELS[e] ?? e
const estadoPillClass = (e: string) => ESTADO_PILL[e] ?? ESTADO_PILL.pendiente

// Cargar comisiones de TODAS las empresas con ciclo activo
const EMPRESAS_CONFIG: Record<string, { label: string; color: string }> = {
  express: { label: 'Express', color: 'purple' },
  ultra: { label: 'Ultra', color: 'green' },
  chipped: { label: 'Chipped', color: 'red' },
  fibertec: { label: 'Fibertec', color: 'sky' },
}

const EMPRESA_PILL_CLASS: Record<string, string> = {
  express: 'bg-blue-50 text-blue-700 ring-blue-200/60 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20',
  ultra: 'bg-green-50 text-green-700 ring-green-200/60 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-500/20',
  chipped: 'bg-red-50 text-red-700 ring-red-200/60 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20',
  fibertec: 'bg-sky-50 text-sky-700 ring-sky-200/60 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20',
}

const EMPRESA_ORDER: Record<string, number> = { express: 0, ultra: 1, chipped: 2, fibertec: 3 }

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

        // Historial de concretadas + creadas por ciclo (para gráficos)
        for (const cc of closedCiclos) {
          const ccPagos = pagosAll.filter((p: any) => p.ciclo_id === cc.id)
          const totalConc = isGlobal
            ? ccPagos.reduce((sum: number, p: any) => sum + (p.cantidad_ventas || 0), 0)
            : (ccPagos.find((p: any) => p.vendedor_id === myId)?.cantidad_ventas ?? 0)
          const totalCreadas = ventas.value.filter(v =>
            v.empresa === empresa &&
            v.fecha_carga >= cc.fecha_inicio &&
            cc.fecha_cierre_real && v.fecha_carga <= cc.fecha_cierre_real &&
            (isGlobal || v.vendedor_id === myId),
          ).length
          const fInicio = new Date(cc.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
          const fCierre = cc.fecha_cierre_real
            ? new Date(cc.fecha_cierre_real).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
            : '?'
          historialCiclos.push({ label: `${fInicio} - ${fCierre}`, concretadas: totalConc, creadas: totalCreadas })
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

  // Ordenar: Express → Ultra → Chipped
  ciclosComisiones.value = resultados.sort(
    (a, b) => (EMPRESA_ORDER[a.empresa] ?? 99) - (EMPRESA_ORDER[b.empresa] ?? 99),
  )
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

// Agregado del mes para CicloHeroMobile (vista "MES" consolidada AMSI)
const mesData = computed(() => {
  if (ciclosComisiones.value.length === 0 || !profile.value) return null
  const ciclos = ciclosComisiones.value
  const isVendedorOLider = profile.value.rol === 'vendedor' || profile.value.rol === 'lider'

  if (isVendedorOLider) {
    const comision = ciclos.reduce((sum, c) => sum + (c.estimadoComision ?? 0), 0)
    const bonus = ciclos.reduce((sum, c) => sum + (c.estimadoBonus ?? 0), 0)
    return {
      valorPrincipal: comision + bonus,
      tipo: 'comisiones' as const,
      comision,
      bonus,
      concretadas: ciclos.reduce((sum, c) => sum + c.concretadas, 0),
      ventasCreadas: ciclos.reduce((sum, c) => sum + c.ventasCreadas, 0),
      porEmpresa: ciclos.map(c => ({
        empresa: c.empresa,
        label: c.label,
        monto: c.estimadoTotal ?? 0,
      })),
    }
  }
  return {
    valorPrincipal: ciclos.reduce((sum, c) => sum + c.ingresos, 0),
    tipo: 'ingresos' as const,
    concretadas: ciclos.reduce((sum, c) => sum + c.concretadas, 0),
    ventasCreadas: ciclos.reduce((sum, c) => sum + c.ventasCreadas, 0),
    porEmpresa: ciclos.map(c => ({
      empresa: c.empresa,
      label: c.label,
      monto: c.ingresos,
    })),
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

const ultimasVentas = computed(() => ventas.value.slice(0, 8))

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

// Ventas del mes actual (todas las empresas)
const inicioMes = computed(() => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
})
const enMes = (v: any) => v.fecha_carga >= inicioMes.value
const ventasMes = computed(() => ventasFiltradas.value.filter(enMes))
const ventasPropiasMes = computed(() =>
  ventasMes.value.filter(v => v.vendedor_id === profile.value?.id),
)
const ventasEquipoMes = computed(() =>
  ventasMes.value.filter(v => v.vendedor_id !== profile.value?.id),
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

const distribucionEstados = computed(() => buildDistribucion(ventasMes.value))
const distribucionEstadosPropias = computed(() => buildDistribucion(ventasPropiasMes.value))
const distribucionEstadosEquipo = computed(() => buildDistribucion(ventasEquipoMes.value))

const EMPRESA_LINE_COLOR: Record<string, string> = {
  express: '#a855f7',
  ultra: '#22c55e',
  chipped: '#ef4444',
  fibertec: '#0ea5e9',
}

function buildPorCiclo(getValue: (h: { concretadas: number; creadas: number }) => number, getActual: (cc: CicloComisionData) => number) {
  if (ciclosComisiones.value.length === 0) return { labels: [] as string[], datasets: [] as { label: string; data: number[]; color: string }[] }

  // Empresa con más historial → fuente de labels (típicamente Express)
  const ref = [...ciclosComisiones.value].sort(
    (a, b) => b.historialCiclos.length - a.historialCiclos.length,
  )[0]

  const labels: string[] = ref.historialCiclos.map(h => h.label)
  const fI = new Date(ref.fechaInicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  const fC = new Date(ref.fechaCierre).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  labels.push(`${fI} - ${fC} *`)

  const datasets = ciclosComisiones.value.map((cc) => {
    const pad = ref.historialCiclos.length - cc.historialCiclos.length
    const data = [
      ...Array(pad).fill(0),
      ...cc.historialCiclos.map(getValue),
      getActual(cc),
    ]
    return {
      label: cc.label,
      data,
      color: EMPRESA_LINE_COLOR[cc.empresa] ?? '#64748b',
    }
  })

  return { labels, datasets }
}

const concretadasPorCiclo = computed(() =>
  buildPorCiclo(h => h.concretadas, cc => cc.concretadas),
)
const creadasPorCiclo = computed(() =>
  buildPorCiclo(h => h.creadas, cc => cc.ventasCreadas),
)

useHead({ title: 'Dashboard — AMSI SRL' })
</script>
