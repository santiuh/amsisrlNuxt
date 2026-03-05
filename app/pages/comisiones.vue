<template>
  <div class="space-y-6">
    <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Mis Comisiones</h2>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin" />
    </div>

    <template v-else>
      <!-- ============ CICLO ACTIVO ============ -->
      <template v-if="cicloActivo">
        <!-- Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            label="Estimado Ciclo Actual"
            :value="formatPrecio(miEstimacion?.monto_total ?? 0)"
            icon="i-heroicons-banknotes"
            color="green"
          />
          <StatsCard
            label="Ventas Concretadas"
            :value="miEstimacion?.cantidad_ventas ?? 0"
            icon="i-heroicons-check-circle"
            color="blue"
          />
          <StatsCard
            v-if="profile?.rol === 'lider' && miEstimacion && miEstimacion.monto_liderazgo > 0"
            label="Bonus Liderazgo"
            :value="formatPrecio(miEstimacion.monto_liderazgo)"
            icon="i-heroicons-user-group"
            color="orange"
          />
        </div>

        <!-- Info del ciclo -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <h3 class="font-semibold text-gray-800 dark:text-gray-100">Ciclo Actual</h3>
              <UBadge color="green" label="Activo" variant="subtle" />
            </div>
          </template>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Fecha inicio</p>
              <p class="font-medium text-gray-800 dark:text-gray-100">{{ formatFecha(cicloActivo.fecha_inicio) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Cierre previsto</p>
              <p class="font-medium text-gray-800 dark:text-gray-100">{{ formatFecha(cicloActivo.fecha_cierre_prevista) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Mi comisión</p>
              <p class="font-medium text-gray-800 dark:text-gray-100">{{ miEstimacion?.porcentaje_aplicado ?? 100 }}% del precio</p>
            </div>
          </div>

          <!-- Desglose líder -->
          <div v-if="profile?.rol === 'lider' && ventasEquipo.length > 0" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">Desglose de mi equipo</h4>
            <div class="overflow-x-auto -mx-4 sm:mx-0">
              <UTable :rows="resumenEquipo" :columns="columnasEquipo">
                <template #monto-data="{ row }">
                  {{ formatPrecio(row.monto) }}
                </template>
              </UTable>
            </div>
            <div class="mt-3 text-sm text-gray-600 dark:text-gray-300">
              <p>Total ventas equipo: <strong class="text-gray-800 dark:text-gray-100">{{ formatPrecio(montoTotalEquipo) }}</strong></p>
              <p>Mi bonus ({{ configPctLider }}%): <strong class="text-orange-600">{{ formatPrecio(miEstimacion?.monto_liderazgo ?? 0) }}</strong></p>
            </div>
          </div>
        </UCard>
      </template>

      <!-- Sin ciclo activo -->
      <UCard v-else>
        <div class="text-center py-6">
          <UIcon name="i-heroicons-clock" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p class="text-gray-500 dark:text-gray-400">No hay ciclo de comisiones activo en este momento.</p>
        </div>
      </UCard>

      <!-- ============ HISTORIAL ============ -->
      <UCard>
        <template #header>
          <h3 class="font-semibold text-gray-800 dark:text-gray-100">Historial de Comisiones</h3>
        </template>
        <div v-if="misPagos.length === 0" class="text-center py-6">
          <p class="text-gray-400 dark:text-gray-500">No tenés ciclos cerrados aún.</p>
        </div>
        <div v-else class="overflow-x-auto -mx-4 sm:mx-0">
          <UTable :rows="misPagosConPeriodo" :columns="columnasHistorial">
            <template #periodo-data="{ row }">
              {{ row.periodo }}
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
              <span v-if="row.monto_liderazgo > 0" class="text-orange-600 font-medium">{{ formatPrecio(row.monto_liderazgo) }}</span>
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
  </div>
</template>

<script setup lang="ts">
import type { CicloComision, CicloPago, EstimacionVendedor } from '~/composables/useComisiones'
import { calcularEstimaciones } from '~/composables/useComisiones'

const client = useSupabaseClient()
const profile = useCurrentProfile()

const loading = ref(true)
const cicloActivo = ref<CicloComision | null>(null)
const misPagos = ref<CicloPago[]>([])
const ciclosCerrados = ref<CicloComision[]>([])
const miEstimacion = ref<EstimacionVendedor | null>(null)
const configPctLider = ref(25)

// Datos para líder
const ventasEquipo = ref<any[]>([])
const montoTotalEquipo = ref(0)

// ——— Columnas ———
const columnasEquipo = [
  { key: 'nombre', label: 'Vendedor' },
  { key: 'ventas', label: 'Ventas' },
  { key: 'monto', label: 'Monto' },
]

const columnasHistorial = [
  { key: 'periodo', label: 'Período' },
  { key: 'cantidad_ventas', label: 'Ventas' },
  { key: 'monto_total_ventas', label: 'Monto Ventas' },
  { key: 'porcentaje_aplicado', label: '%' },
  { key: 'monto_comision', label: 'Comisión' },
  { key: 'monto_liderazgo', label: 'Bonus Líder' },
  { key: 'monto_total', label: 'Total' },
  { key: 'pagado', label: 'Estado' },
]

// ——— Helpers ———
const formatPrecio = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

const resumenEquipo = computed(() => {
  const map: Record<string, { nombre: string; ventas: number; monto: number }> = {}
  ventasEquipo.value.forEach((v: any) => {
    const nombre = v.profiles?.nombre ?? 'Desconocido'
    if (!map[v.vendedor_id]) map[v.vendedor_id] = { nombre, ventas: 0, monto: 0 }
    map[v.vendedor_id].ventas++
    map[v.vendedor_id].monto += Number(v.precio)
  })
  return Object.values(map).sort((a, b) => b.monto - a.monto)
})

const misPagosConPeriodo = computed(() => {
  return misPagos.value.map(p => {
    const ciclo = ciclosCerrados.value.find(c => c.id === p.ciclo_id)
    return {
      ...p,
      periodo: ciclo
        ? `${formatFecha(ciclo.fecha_inicio)} — ${formatFecha(ciclo.fecha_cierre_real!)}`
        : '—',
    }
  })
})

// ——— Carga ———
onMounted(async () => {
  if (!profile.value) {
    loading.value = false
    return
  }

  // Cargar ciclo activo, pagos históricos, ciclos cerrados y config en paralelo
  const [
    { data: cicloData },
    { data: pagosData },
    { data: ciclosData },
    { data: pctLiderData },
    { data: pctGrupoData },
  ] = await Promise.all([
    client.from('ciclos_comision').select('*').eq('estado', 'activo').maybeSingle(),
    client.from('ciclo_pagos').select('*').order('created_at', { ascending: false }),
    client.from('ciclos_comision').select('*').eq('estado', 'cerrado').order('fecha_cierre_real', { ascending: false }),
    client.from('configuracion').select('valor').eq('clave', 'comision_porcentaje_lider').single(),
    client.from('configuracion').select('valor').eq('clave', 'comision_porcentaje_grupo').single(),
  ])

  cicloActivo.value = cicloData as CicloComision | null
  misPagos.value = (pagosData ?? []) as CicloPago[]
  ciclosCerrados.value = (ciclosData ?? []) as CicloComision[]
  configPctLider.value = Number(pctLiderData?.valor ?? 25)
  const pctGrupo = Number(pctGrupoData?.valor ?? 80)

  // Si hay ciclo activo, calcular estimación
  if (cicloActivo.value) {
    const [{ data: ventasData }, { data: profilesData }, { data: gruposData }] = await Promise.all([
      client
        .from('ventas')
        .select('id, vendedor_id, precio, fecha_carga, profiles:vendedor_id(nombre)')
        .eq('estado', 'concretado')
        .gte('fecha_carga', cicloActivo.value.fecha_inicio)
        .lte('fecha_carga', new Date().toISOString()),
      client.from('profiles').select('id, nombre, rol, grupo_id'),
      client.from('grupos').select('id, lider_id'),
    ])

    const todasEstimaciones = calcularEstimaciones(
      ventasData ?? [],
      profilesData ?? [],
      gruposData ?? [],
      { pct_grupo: pctGrupo, pct_lider: configPctLider.value },
    )

    miEstimacion.value = todasEstimaciones.find(e => e.vendedor_id === profile.value!.id) ?? null

    // Para líder: obtener ventas del equipo
    if (profile.value.rol === 'lider') {
      const miGrupo = (gruposData ?? []).find((g: any) => g.lider_id === profile.value!.id)
      if (miGrupo) {
        const miembrosIds = (profilesData ?? [])
          .filter((p: any) => p.grupo_id === miGrupo.id && p.rol === 'vendedor')
          .map((p: any) => p.id)
        ventasEquipo.value = (ventasData ?? []).filter((v: any) => miembrosIds.includes(v.vendedor_id))
        montoTotalEquipo.value = ventasEquipo.value.reduce((sum: number, v: any) => sum + Number(v.precio), 0)
      }
    }
  }

  loading.value = false
})

useHead({ title: 'Mis Comisiones — AMSI SRL' })
</script>
