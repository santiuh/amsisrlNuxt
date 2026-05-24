<template>
  <div class="space-y-6">
    <!-- Error de acceso -->
    <UCard v-if="errorMsg" class="max-w-xl mx-auto">
      <div class="text-center py-8 space-y-3">
        <UIcon name="i-heroicons-lock-closed" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
        <p class="text-gray-600 dark:text-gray-300">{{ errorMsg }}</p>
        <UButton label="Volver al dashboard" color="gray" variant="outline" to="/dashboard" />
      </div>
    </UCard>

    <template v-else-if="perfil">
      <!-- HEADER -->
      <UCard>
        <div class="flex flex-col sm:flex-row sm:items-center gap-5">
          <button
            type="button"
            class="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg bg-white dark:bg-gray-800 shrink-0 group"
            :class="isSelf ? 'cursor-pointer' : 'cursor-default'"
            :disabled="!isSelf"
            @click="onAvatarClick"
          >
            <UserAvatar :config="perfil.avatar_config" :seed="perfil.nombre" class="w-full h-full rounded-full" />
            <span
              v-if="isSelf"
              class="absolute inset-0 rounded-full bg-black/50 text-white text-[11px] font-semibold flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <UIcon name="i-heroicons-pencil-square" class="w-5 h-5" />
              Editar
            </span>
          </button>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white truncate">{{ perfil.nombre }}</h2>
              <UBadge
                :color="rolColor(perfil.rol)"
                :label="rolLabel(perfil.rol)"
                variant="subtle"
              />
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ perfil.email }}</p>
            <div class="flex items-center gap-2 flex-wrap mt-3">
              <UBadge color="blue" variant="subtle" label="Express" />
              <UBadge v-if="perfil.puede_vender_ultra" color="violet" variant="subtle" label="Ultra" />
              <UBadge v-if="perfil.puede_vender_chipped" color="emerald" variant="subtle" label="Chipped" />
            </div>
          </div>
        </div>
      </UCard>

      <!-- LOADING STATS -->
      <div v-if="loadingStats" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin" />
      </div>

      <template v-else>
        <!-- Sin ciclo activo -->
        <UCard v-if="ciclosStats.length === 0">
          <div class="text-center py-6 text-gray-500 dark:text-gray-400">
            <UIcon name="i-heroicons-clock" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p>No hay ciclo de comisiones activo en este momento.</p>
          </div>
        </UCard>

        <!-- Stats por ciclo activo (uno por empresa) -->
        <template v-for="cc in ciclosStats" :key="cc.empresa">
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <UBadge :color="empresaColor(cc.empresa)" variant="subtle" :label="cc.label" />
              <span class="text-sm text-gray-500 dark:text-gray-400">
                Ciclo {{ formatFecha(cc.fechaInicio) }} — {{ formatFecha(cc.fechaCierre) }}
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatsCard
                label="Ventas creadas"
                :value="cc.creadas"
                icon="i-heroicons-document-plus"
                color="blue"
              />
              <StatsCard
                label="Ventas concretadas"
                :value="cc.concretadas"
                icon="i-heroicons-check-circle"
                color="green"
              />
              <StatsCard
                label="Ingresos del ciclo"
                :value="formatPrecio(cc.ingresos)"
                icon="i-heroicons-banknotes"
                color="teal"
              />
              <StatsCard
                label="Comisión estimada"
                :value="formatPrecio(cc.comisionEstimada)"
                icon="i-heroicons-calculator"
                color="purple"
              />
              <StatsCard
                v-if="perfil.rol === 'lider' && cc.bonusLiderazgo > 0"
                label="Bonus liderazgo"
                :value="formatPrecio(cc.bonusLiderazgo)"
                icon="i-heroicons-user-group"
                color="orange"
              />
            </div>
          </div>
        </template>

        <!-- Distribución de estados del mes -->
        <DashboardEstadoBar
          title="Estados de ventas del mes"
          :labels="distribucionEstados.labels"
          :data="distribucionEstados.data"
          :colors="distribucionEstados.colors"
        />

        <!-- Tendencia por ciclo -->
        <div v-if="tendencias.creadas.labels.length > 0" class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <DashboardLineChart
            title="Ventas creadas por ciclo"
            :labels="tendencias.creadas.labels"
            :datasets="tendencias.creadas.datasets"
          />
          <DashboardLineChart
            title="Ventas concretadas por ciclo"
            :labels="tendencias.concretadas.labels"
            :datasets="tendencias.concretadas.datasets"
          />
        </div>

        <!-- Historial de ciclos pagados -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-gray-800 dark:text-gray-100">Historial de comisiones</h3>
          </template>
          <div v-if="historial.length === 0" class="text-center py-6 text-gray-400 dark:text-gray-500">
            Sin ciclos cerrados todavía.
          </div>
          <div v-else class="overflow-x-auto -mx-4 sm:mx-0">
            <UTable :rows="historial" :columns="columnasHistorial">
              <template #empresa-data="{ row }">
                <UBadge :color="empresaColor(row.empresa)" variant="subtle" :label="empresaLabel(row.empresa)" />
              </template>
              <template #monto_total_ventas-data="{ row }">
                {{ formatPrecio(row.monto_total_ventas) }}
              </template>
              <template #porcentaje_aplicado-data="{ row }">
                {{ row.porcentaje_aplicado }}%
              </template>
              <template #monto_comision-data="{ row }">
                {{ formatPrecio(row.monto_comision) }}
              </template>
              <template #monto_liderazgo-data="{ row }">
                <span v-if="row.monto_liderazgo > 0" class="text-orange-600 font-medium">
                  {{ formatPrecio(row.monto_liderazgo) }}
                </span>
                <span v-else class="text-gray-400">—</span>
              </template>
              <template #monto_total-data="{ row }">
                <span class="font-semibold text-green-600">{{ formatPrecio(row.monto_total) }}</span>
              </template>
              <template #pagado-data="{ row }">
                <UBadge
                  :color="row.pagado ? 'green' : 'gray'"
                  :label="row.pagado ? 'Pagado' : 'Pendiente'"
                  variant="subtle"
                />
              </template>
            </UTable>
          </div>
        </UCard>
      </template>
    </template>

    <!-- Loading inicial del perfil -->
    <div v-else class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
    </div>

    <!-- Modal editor de avatar (solo propio perfil) -->
    <AvatarEditorModal
      v-if="isSelf && perfil"
      v-model="showAvatarModal"
      :initial-config="perfil.avatar_config"
      :seed="perfil.nombre"
      @saved="onAvatarSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { calcularEstimaciones } from '~/composables/useComisiones'
import { empresaLabel, empresaColor } from '~/utils/empresa'

definePageMeta({ middleware: ['perfil'] })

interface PerfilCompleto {
  id: string
  nombre: string
  email: string
  rol: 'vendedor' | 'lider' | 'oficinista' | 'admin'
  grupo_id: string | null
  puede_vender_ultra: boolean
  puede_vender_chipped: boolean
  avatar_config: any
  must_change_password?: boolean
  created_at?: string
}

interface CicloStats {
  empresa: string
  label: string
  fechaInicio: string
  fechaCierre: string
  creadas: number
  concretadas: number
  ingresos: number
  comisionEstimada: number
  bonusLiderazgo: number
}

const route = useRoute()
const client = useSupabaseClient()
const currentProfile = useCurrentProfile()

const targetId = computed(() => route.params.id as string)

const perfil = ref<PerfilCompleto | null>(null)
const errorMsg = ref('')
const loadingStats = ref(true)
const showAvatarModal = ref(false)

const ventasAjenas = ref<any[]>([])

const isSelf = computed(() => currentProfile.value?.id === targetId.value)

const onAvatarClick = () => {
  if (!isSelf.value) return
  showAvatarModal.value = true
}

const onAvatarSaved = (cfg: any) => {
  if (perfil.value) {
    perfil.value.avatar_config = cfg
  }
}

const rolLabel = (r: string) =>
  ({ vendedor: 'Vendedor', lider: 'Líder', oficinista: 'Oficinista', admin: 'Administrador' }[r] ?? r)
const rolColor = (r: string): any =>
  ({ admin: 'red', oficinista: 'yellow', vendedor: 'blue', lider: 'orange' }[r] ?? 'gray')

const formatPrecio = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0)
const formatFecha = (f: string) => {
  if (!f) return ''
  const d = f.length === 10 ? new Date(`${f}T12:00:00`) : new Date(f)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

// ===== Carga del perfil =====
const cargarPerfil = async () => {
  errorMsg.value = ''
  perfil.value = null
  loadingStats.value = true

  try {
    const data = await $fetch<PerfilCompleto>(`/api/profile/${targetId.value}`)
    perfil.value = data
  } catch (err: any) {
    const code = err?.statusCode ?? err?.data?.statusCode
    if (code === 403) {
      errorMsg.value = 'No tenés acceso a este perfil.'
    } else if (code === 404) {
      errorMsg.value = 'Perfil no encontrado.'
    } else {
      errorMsg.value = 'Error al cargar el perfil.'
    }
    loadingStats.value = false
    return
  }

  await cargarStats()
  loadingStats.value = false
}

// ===== Stats =====
const ciclosStats = ref<CicloStats[]>([])
const historial = ref<any[]>([])

const ESTADOS_CONFIG = [
  { key: 'concretado',   label: 'Concretadas',   color: '#10b981' },
  { key: 'coordinado',   label: 'Coordinadas',   color: '#06b6d4' },
  { key: 'en_proceso',   label: 'En Proceso',    color: '#3b82f6' },
  { key: 'pendiente',    label: 'Pendientes',    color: '#64748b' },
  { key: 'en_conflicto', label: 'En Conflicto',  color: '#f97316' },
  { key: 'rechazado',    label: 'Rechazadas',    color: '#ef4444' },
  { key: 'proxima_zona', label: 'Próxima Zona',  color: '#8b5cf6' },
]

const EMPRESA_LINE_COLOR: Record<string, string> = {
  express: '#a855f7',
  ultra: '#8b5cf6',
  chipped: '#10b981',
}

const distribucionEstados = ref({
  labels: ESTADOS_CONFIG.map(e => e.label),
  data: ESTADOS_CONFIG.map(() => 0),
  colors: ESTADOS_CONFIG.map(e => e.color),
})

const tendencias = ref<{
  creadas: { labels: string[]; datasets: { label: string; data: number[]; color: string }[] }
  concretadas: { labels: string[]; datasets: { label: string; data: number[]; color: string }[] }
}>({ creadas: { labels: [], datasets: [] }, concretadas: { labels: [], datasets: [] } })

const columnasHistorial = [
  { key: 'empresa', label: 'Empresa' },
  { key: 'periodo', label: 'Período' },
  { key: 'cantidad_ventas', label: 'Ventas' },
  { key: 'monto_total_ventas', label: 'Monto Ventas' },
  { key: 'porcentaje_aplicado', label: '%' },
  { key: 'monto_comision', label: 'Comisión' },
  { key: 'monto_liderazgo', label: 'Bonus Líder' },
  { key: 'monto_total', label: 'Total' },
  { key: 'pagado', label: 'Estado' },
]

const cargarStats = async () => {
  if (!perfil.value) return
  const vendedorId = perfil.value.id

  // Cargar ventas del vendedor — propia si es self, ajenas vía RLS si no
  const [{ data: ventasData }, { data: profilesData }, { data: gruposData }, { data: ciclosActivos }] = await Promise.all([
    client
      .from('ventas')
      .select('id, vendedor_id, empresa, estado, precio, precio_concretado, fecha_carga, fecha_concretado')
      .eq('vendedor_id', vendedorId)
      .order('fecha_carga', { ascending: false }),
    client.from('profiles').select('id, nombre, rol, grupo_id'),
    client.from('grupos').select('id, lider_id'),
    client.from('ciclos_comision').select('*').eq('estado', 'activo'),
  ])
  ventasAjenas.value = ventasData ?? []

  // Distribución de estados (ventas del mes en curso)
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const ventasMes = (ventasData ?? []).filter((v: any) => v.fecha_carga >= inicioMes)
  distribucionEstados.value = {
    labels: ESTADOS_CONFIG.map(e => e.label),
    data: ESTADOS_CONFIG.map(e => ventasMes.filter((v: any) => v.estado === e.key).length),
    colors: ESTADOS_CONFIG.map(e => e.color),
  }

  // KPIs por ciclo activo (uno por empresa)
  ciclosStats.value = []
  for (const ciclo of ciclosActivos ?? []) {
    const empresa = ciclo.empresa ?? 'express'

    const [{ data: ventasConcretadasCiclo }, { data: pctGrupoData }, { data: pctLiderData }] = await Promise.all([
      client.from('ventas')
        .select('id, vendedor_id, precio, precio_concretado, fecha_concretado')
        .eq('estado', 'concretado')
        .eq('empresa', empresa)
        .gte('fecha_concretado', ciclo.fecha_inicio)
        .lte('fecha_concretado', new Date().toISOString()),
      client.from('configuracion').select('valor').eq('clave', 'comision_porcentaje_grupo').eq('empresa', empresa).single(),
      client.from('configuracion').select('valor').eq('clave', 'comision_porcentaje_lider').eq('empresa', empresa).single(),
    ])

    const pctGrupo = Number(pctGrupoData?.valor ?? 80)
    const pctLider = Number(pctLiderData?.valor ?? 25)

    const estimaciones = calcularEstimaciones(
      ventasConcretadasCiclo ?? [],
      profilesData ?? [],
      gruposData ?? [],
      { pct_grupo: pctGrupo, pct_lider: pctLider },
    )
    const miEst = estimaciones.find(e => e.vendedor_id === vendedorId)

    const propiasCiclo = (ventasConcretadasCiclo ?? []).filter((v: any) => v.vendedor_id === vendedorId)
    const ingresos = propiasCiclo.reduce((sum: number, v: any) => sum + Number(v.precio_concretado ?? v.precio), 0)

    const creadasCiclo = (ventasData ?? []).filter((v: any) =>
      v.empresa === empresa && v.fecha_carga >= ciclo.fecha_inicio,
    ).length

    ciclosStats.value.push({
      empresa,
      label: empresaLabel(empresa),
      fechaInicio: ciclo.fecha_inicio,
      fechaCierre: ciclo.fecha_cierre_prevista,
      creadas: creadasCiclo,
      concretadas: propiasCiclo.length,
      ingresos,
      comisionEstimada: miEst?.monto_comision ?? 0,
      bonusLiderazgo: miEst?.monto_liderazgo ?? 0,
    })
  }
  // Orden empresa
  const order: Record<string, number> = { express: 0, ultra: 1, chipped: 2 }
  ciclosStats.value.sort((a, b) => (order[a.empresa] ?? 99) - (order[b.empresa] ?? 99))

  // Historial de ciclos pagados del vendedor + tendencia por ciclo
  const { data: pagos } = await client
    .from('ciclo_pagos')
    .select('*')
    .eq('vendedor_id', vendedorId)
    .order('created_at', { ascending: false })

  const { data: ciclosCerrados } = await client
    .from('ciclos_comision')
    .select('id, empresa, fecha_inicio, fecha_cierre_real')
    .eq('estado', 'cerrado')
    .order('fecha_cierre_real', { ascending: false })

  const cicloById = Object.fromEntries((ciclosCerrados ?? []).map((c: any) => [c.id, c]))

  historial.value = (pagos ?? []).map((p: any) => {
    const c = cicloById[p.ciclo_id]
    return {
      ...p,
      empresa: p.empresa ?? c?.empresa ?? 'express',
      periodo: c
        ? `${formatFecha(c.fecha_inicio)} — ${formatFecha(c.fecha_cierre_real ?? '')}`
        : '—',
    }
  })

  // Tendencia line chart: agrupar por empresa, ordenar por ciclo crono
  const empresas = Array.from(new Set([
    ...ciclosStats.value.map(c => c.empresa),
    ...(ciclosCerrados ?? []).map((c: any) => c.empresa ?? 'express'),
  ]))

  const buildTendencia = (getValue: (info: { creadas: number; concretadas: number }) => number) => {
    if (empresas.length === 0) return { labels: [] as string[], datasets: [] as { label: string; data: number[]; color: string }[] }

    // Para cada empresa, juntar ciclos cerrados (ordenados crono) + ciclo activo si existe
    type Bucket = { label: string; creadas: number; concretadas: number }
    const perEmpresa: Record<string, Bucket[]> = {}
    for (const empresa of empresas) {
      const cerrados = (ciclosCerrados ?? [])
        .filter((c: any) => (c.empresa ?? 'express') === empresa)
        .slice(0, 6)
        .reverse() // crono asc
      const buckets: Bucket[] = cerrados.map((c: any) => {
        const pago = (pagos ?? []).find((p: any) => p.ciclo_id === c.id)
        const concretadas = pago?.cantidad_ventas ?? 0
        const creadas = (ventasData ?? []).filter((v: any) =>
          v.empresa === empresa
          && v.fecha_carga >= c.fecha_inicio
          && c.fecha_cierre_real && v.fecha_carga <= c.fecha_cierre_real,
        ).length
        return {
          label: `${formatFecha(c.fecha_inicio)}-${formatFecha(c.fecha_cierre_real ?? '')}`,
          creadas,
          concretadas,
        }
      })
      const activo = ciclosStats.value.find(s => s.empresa === empresa)
      if (activo) {
        buckets.push({
          label: `${formatFecha(activo.fechaInicio)}-${formatFecha(activo.fechaCierre)} *`,
          creadas: activo.creadas,
          concretadas: activo.concretadas,
        })
      }
      perEmpresa[empresa] = buckets
    }

    const ref = Object.values(perEmpresa).sort((a, b) => b.length - a.length)[0] ?? []
    const labels = ref.map(b => b.label)
    const datasets = empresas.map((empresa) => {
      const buckets = perEmpresa[empresa] ?? []
      const pad = labels.length - buckets.length
      const data = [...Array(pad).fill(0), ...buckets.map(getValue)]
      return {
        label: empresaLabel(empresa),
        data,
        color: EMPRESA_LINE_COLOR[empresa] ?? '#64748b',
      }
    })
    return { labels, datasets }
  }

  tendencias.value = {
    creadas: buildTendencia(b => b.creadas),
    concretadas: buildTendencia(b => b.concretadas),
  }
}

watch(targetId, cargarPerfil, { immediate: true })

const pageTitle = computed(() => {
  if (!perfil.value) return 'Perfil — AMSI SRL'
  return isSelf.value ? 'Mi Perfil — AMSI SRL' : `${perfil.value.nombre} — AMSI SRL`
})
useHead({ title: () => pageTitle.value })
</script>
