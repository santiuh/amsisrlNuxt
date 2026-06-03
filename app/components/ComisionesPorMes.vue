<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin" />
    </div>

    <template v-else>
      <!-- Vacío -->
      <UCard v-if="meses.length === 0">
        <div class="text-center py-8">
          <UIcon name="i-heroicons-calendar-days" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p class="text-gray-500 dark:text-gray-400">No hay ventas concretadas aún.</p>
        </div>
      </UCard>

      <!-- Lista de meses -->
      <UCard v-else>
        <template #header>
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 class="font-semibold text-gray-800 dark:text-gray-100">Generado por mes</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Ventas concretadas por vendedor, sumando todas las empresas.</p>
            </div>
          </div>
        </template>

        <div class="space-y-3">
          <UCard
            v-for="mes in meses"
            :key="mes.key"
            class="cursor-pointer hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600 transition-all"
            @click="toggleMes(mes.key)"
          >
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-3">
                <UIcon
                  :name="mesExpandido === mes.key ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                  class="w-4 h-4 text-gray-400"
                />
                <p class="font-medium text-gray-800 dark:text-gray-100">{{ mes.label }}</p>
              </div>
              <div class="flex items-center gap-4 text-sm">
                <div class="text-right">
                  <p class="text-gray-500 dark:text-gray-400">Ventas</p>
                  <p class="font-semibold text-gray-800 dark:text-gray-100">{{ mes.cantidad_ventas }}</p>
                </div>
                <div class="text-right">
                  <p class="text-gray-500 dark:text-gray-400">Generado</p>
                  <p class="font-semibold text-gray-800 dark:text-gray-100">{{ formatPrecio(mes.monto_total_ventas) }}</p>
                </div>
                <div class="text-right">
                  <p class="text-gray-500 dark:text-gray-400">Comisiones</p>
                  <p class="font-semibold text-green-600">{{ formatPrecio(mes.monto_comision) }}</p>
                </div>
              </div>
            </div>

            <!-- Detalle: vendedores del mes -->
            <div v-if="mesExpandido === mes.key" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700" @click.stop>
              <ul class="space-y-2">
                <li
                  v-for="vendedor in mes.vendedores"
                  :key="vendedor.vendedor_id"
                  class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40"
                >
                  <div
                    class="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                    @click="toggleVendedor(mes.key, vendedor.vendedor_id)"
                  >
                    <UIcon
                      :name="vendedorExpandido === `${mes.key}-${vendedor.vendedor_id}` ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                      class="w-4 h-4 text-gray-400 shrink-0"
                    />
                    <div class="min-w-[140px] flex-1">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Vendedor</p>
                      <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ vendedor.nombre }}</p>
                    </div>
                    <div class="shrink-0">
                      <UBadge :color="rolColor(vendedor.rol)" :label="rolLabel(vendedor.rol)" variant="subtle" />
                    </div>
                    <div class="text-right shrink-0 min-w-[60px]">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Ventas</p>
                      <p class="text-sm text-gray-800 dark:text-gray-100">{{ vendedor.cantidad_ventas }}</p>
                    </div>
                    <div class="text-right shrink-0 min-w-[110px]">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Generado</p>
                      <p class="text-sm text-gray-800 dark:text-gray-100">{{ formatPrecio(vendedor.monto_total_ventas) }}</p>
                    </div>
                    <div class="text-right shrink-0 min-w-[110px]">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Comisión</p>
                      <p class="text-sm font-semibold text-green-600">{{ formatPrecio(vendedor.monto_comision) }}</p>
                    </div>
                  </div>

                  <!-- Detalle de ventas del vendedor en el mes -->
                  <div
                    v-if="vendedorExpandido === `${mes.key}-${vendedor.vendedor_id}`"
                    class="border-t border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30 px-3 py-3"
                    @click.stop
                  >
                    <div
                      v-if="ventasDeVendedor(mes.key, vendedor.vendedor_id).length === 0"
                      class="text-sm text-gray-400 dark:text-gray-500 py-2"
                    >
                      Sin ventas concretadas en este mes.
                    </div>
                    <div v-else class="space-y-1">
                      <div class="hidden sm:grid grid-cols-[1.5fr_1.2fr_0.8fr_1fr_1fr] gap-3 px-2 py-1 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        <span>Cliente</span>
                        <span>Paquete</span>
                        <span>Empresa</span>
                        <span class="text-right">Monto</span>
                        <span>Concretado</span>
                      </div>
                      <a
                        v-for="venta in ventasDeVendedor(mes.key, vendedor.vendedor_id)"
                        :key="venta.id"
                        :href="`/ventas/${venta.id}`"
                        target="_blank"
                        rel="noopener"
                        class="grid grid-cols-1 sm:grid-cols-[1.5fr_1.2fr_0.8fr_1fr_1fr] gap-3 px-2 py-2 text-sm rounded hover:bg-white dark:hover:bg-gray-800/60 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                        @click.stop
                      >
                        <span class="text-gray-800 dark:text-gray-100 truncate" :title="venta.cliente">{{ venta.cliente }}</span>
                        <span class="text-gray-600 dark:text-gray-300 truncate" :title="venta.paquete_nombre ?? ''">{{ venta.paquete_nombre ?? '—' }}</span>
                        <span>
                          <UBadge :color="empresaColor(venta.empresa)" :label="empresaLabel(venta.empresa)" variant="subtle" size="xs" />
                        </span>
                        <span class="text-green-600 font-medium sm:text-right">{{ formatPrecio(Number(venta.precio_concretado ?? venta.precio)) }}</span>
                        <span class="text-gray-600 dark:text-gray-300">{{ formatFecha(venta.fecha_concretado) }}</span>
                      </a>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </UCard>
        </div>
      </UCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { MesGenerado } from '~/composables/useComisiones'
import { calcularGeneradoPorMes } from '~/composables/useComisiones'
import { empresaColor, empresaLabel } from '~/utils/empresa'

const client = useSupabaseClient()
const toast = useToast()

interface VentaRaw {
  id: string
  vendedor_id: string
  empresa: string
  cliente: string
  paquete_nombre: string | null
  precio: number
  precio_concretado: number | null
  fecha_concretado: string
}

const loading = ref(true)
const meses = ref<MesGenerado[]>([])
const ventas = ref<VentaRaw[]>([])
const mesExpandido = ref<string | null>(null)
const vendedorExpandido = ref<string | null>(null)

// ——— Helpers ———
const formatPrecio = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

const formatFecha = (fecha: string | null) => {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const rolColor = (rol: string) => {
  const map: Record<string, string> = { vendedor: 'blue', oficinista: 'purple', lider: 'orange', admin: 'red' }
  return map[rol] ?? 'gray'
}

const rolLabel = (rol: string) => {
  const map: Record<string, string> = { vendedor: 'Vendedor', oficinista: 'Oficinista', lider: 'Líder', admin: 'Admin' }
  return map[rol] ?? rol
}

const mesKeyDe = (fecha: string) => {
  const d = new Date(fecha)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const ventasDeVendedor = (mesKey: string, vendedorId: string) =>
  ventas.value
    .filter(v => v.vendedor_id === vendedorId && v.fecha_concretado && mesKeyDe(v.fecha_concretado) === mesKey)
    .sort((a, b) => new Date(b.fecha_concretado).getTime() - new Date(a.fecha_concretado).getTime())

// ——— Toggles ———
const toggleMes = (mesKey: string) => {
  mesExpandido.value = mesExpandido.value === mesKey ? null : mesKey
  vendedorExpandido.value = null
}

const toggleVendedor = (mesKey: string, vendedorId: string) => {
  const clave = `${mesKey}-${vendedorId}`
  vendedorExpandido.value = vendedorExpandido.value === clave ? null : clave
}

// ——— Carga de datos ———
onMounted(async () => {
  loading.value = true
  try {
    const [{ data: ventasData }, { data: profilesData }, { data: gruposData }, { data: configData }] = await Promise.all([
      client
        .from('ventas')
        .select('id, vendedor_id, empresa, cliente, paquete_nombre, precio, precio_concretado, fecha_concretado')
        .eq('estado', 'concretado')
        .order('fecha_concretado', { ascending: false })
        .range(0, 9999),
      client.from('profiles').select('id, nombre, rol, grupo_id'),
      client.from('grupos').select('id, lider_id'),
      client.from('configuracion').select('clave, valor, empresa').in('clave', ['comision_porcentaje_grupo', 'comision_porcentaje_lider']),
    ])

    ventas.value = (ventasData ?? []) as VentaRaw[]

    // Mapa empresa → { pct_grupo, pct_lider }
    const configPorEmpresa: Record<string, { pct_grupo: number; pct_lider: number }> = {}
    for (const row of configData ?? []) {
      const empresa = (row as any).empresa as string
      if (!configPorEmpresa[empresa]) configPorEmpresa[empresa] = { pct_grupo: 80, pct_lider: 25 }
      if ((row as any).clave === 'comision_porcentaje_grupo') configPorEmpresa[empresa].pct_grupo = Number((row as any).valor)
      else if ((row as any).clave === 'comision_porcentaje_lider') configPorEmpresa[empresa].pct_lider = Number((row as any).valor)
    }

    meses.value = calcularGeneradoPorMes(
      ventas.value,
      profilesData ?? [],
      gruposData ?? [],
      configPorEmpresa,
    )
  } catch (err: any) {
    toast.add({ title: err?.message || 'No se pudo cargar lo generado por mes', color: 'red' })
  } finally {
    loading.value = false
  }
})
</script>
