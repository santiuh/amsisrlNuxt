<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Comisiones</h2>
      <div class="flex items-center gap-2">
        <USelect
          v-model="empresaSeleccionada"
          :options="empresaOptions"
          class="w-44"
        />
        <UButton
          v-if="!cicloActivo"
          icon="i-heroicons-plus"
          label="Crear Ciclo"
          @click="abrirModalCrear"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin" />
    </div>

    <template v-else>
      <!-- ============ CICLO ACTIVO ============ -->
      <template v-if="cicloActivo">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-3">
                <h3 class="font-semibold text-gray-800 dark:text-gray-100">Ciclo Activo</h3>
                <UBadge color="green" label="Activo" variant="subtle" />
              </div>
              <div class="flex gap-2">
                <UButton size="sm" color="gray" variant="outline" icon="i-heroicons-pencil" label="Editar Fecha" @click="abrirModalEditarFecha" />
                <UButton size="sm" color="red" variant="soft" icon="i-heroicons-lock-closed" label="Cerrar Ciclo" @click="abrirModalConfirmarCierre" />
              </div>
            </div>
          </template>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Fecha inicio</p>
              <p class="font-medium text-gray-800 dark:text-gray-100">{{ formatFecha(cicloActivo.fecha_inicio) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Cierre previsto</p>
              <p class="font-medium text-gray-800 dark:text-gray-100">{{ formatFecha(cicloActivo.fecha_cierre_prevista) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Días restantes</p>
              <p class="font-medium text-gray-800 dark:text-gray-100">{{ diasRestantes }}</p>
            </div>
          </div>
        </UCard>

        <!-- Tabla de estimaciones -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-800 dark:text-gray-100">Estimación de Comisiones</h3>
              <div class="text-right">
                <p class="text-sm text-gray-500 dark:text-gray-400">Total estimado</p>
                <p class="text-lg font-bold text-green-600">{{ formatPrecio(totalEstimado) }}</p>
              </div>
            </div>
          </template>
          <div class="overflow-x-auto -mx-4 sm:mx-0">
            <UTable :rows="estimaciones" :columns="columnasEstimaciones" :loading="loadingEstimaciones">
              <template #rol-data="{ row }">
                <UBadge :color="rolColor(row.rol)" :label="rolLabel(row.rol)" variant="subtle" />
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
            </UTable>
          </div>
        </UCard>
      </template>

      <!-- Sin ciclo activo -->
      <UCard v-else>
        <div class="text-center py-8">
          <UIcon name="i-heroicons-calculator" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p class="text-gray-500 dark:text-gray-400">No hay ciclo activo.</p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Creá un nuevo ciclo para empezar a calcular comisiones.</p>
        </div>
      </UCard>

      <!-- ============ CONFIGURACIÓN ============ -->
      <UCard>
        <template #header>
          <h3 class="font-semibold text-gray-800 dark:text-gray-100">Porcentajes de Comisión</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Estos porcentajes se aplican a vendedores con grupo y líderes.</p>
        </template>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <UFormGroup label="% Vendedor con grupo">
            <UInput
              v-model.number="configForm.pct_grupo"
              type="number"
              min="0"
              max="100"
              step="1"
              class="w-full"
            />
          </UFormGroup>
          <UFormGroup label="% Líder sobre equipo">
            <UInput
              v-model.number="configForm.pct_lider"
              type="number"
              min="0"
              max="100"
              step="1"
              class="w-full"
            />
          </UFormGroup>
        </div>
        <template #footer>
          <div class="flex justify-end">
            <UButton label="Guardar" :loading="guardandoConfig" @click="guardarConfig" />
          </div>
        </template>
      </UCard>

      <!-- ============ HISTORIAL ============ -->
      <UCard>
        <template #header>
          <h3 class="font-semibold text-gray-800 dark:text-gray-100">Historial de Ciclos</h3>
        </template>
        <div v-if="historial.length === 0" class="text-center py-6">
          <p class="text-gray-400 dark:text-gray-500">No hay ciclos cerrados aún.</p>
        </div>
        <div v-else class="space-y-3">
          <UCard
            v-for="ciclo in historial"
            :key="ciclo.id"
            class="cursor-pointer hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600 transition-all"
            @click="toggleDetalle(ciclo.id)"
          >
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-3">
                <UIcon
                  :name="cicloExpandido === ciclo.id ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                  class="w-4 h-4 text-gray-400"
                />
                <div>
                  <p class="font-medium text-gray-800 dark:text-gray-100">
                    {{ formatFecha(ciclo.fecha_inicio) }} — {{ formatFecha(ciclo.fecha_cierre_real) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-4 text-sm">
                <div class="text-right">
                  <p class="text-gray-500 dark:text-gray-400">Total comisiones</p>
                  <p class="font-semibold text-green-600">{{ formatPrecio(totalCiclo(ciclo.id)) }}</p>
                </div>
                <div class="text-right">
                  <p class="text-gray-500 dark:text-gray-400">Pagos pendientes</p>
                  <p class="font-semibold" :class="pagosPendientes(ciclo.id) > 0 ? 'text-orange-600' : 'text-green-600'">
                    {{ pagosPendientes(ciclo.id) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Detalle expandido -->
            <div v-if="cicloExpandido === ciclo.id" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700" @click.stop>
              <div class="overflow-x-auto -mx-4 sm:mx-0">
                <UTable :rows="pagosCiclo(ciclo.id)" :columns="columnasPagos">
                  <template #nombre-data="{ row }">
                    {{ row.profiles?.nombre ?? 'Desconocido' }}
                  </template>
                  <template #rol_snapshot-data="{ row }">
                    <UBadge :color="rolColor(row.rol_snapshot)" :label="rolLabel(row.rol_snapshot)" variant="subtle" />
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
                    <div class="flex items-center gap-2">
                      <input
                        type="checkbox"
                        :checked="row.pagado"
                        class="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        @change="togglePago(row)"
                      />
                      <UBadge
                        :color="row.pagado ? 'green' : 'gray'"
                        :label="row.pagado ? 'Pagado' : 'Pendiente'"
                        variant="subtle"
                        size="xs"
                      />
                    </div>
                  </template>
                </UTable>
              </div>
            </div>
          </UCard>
        </div>
      </UCard>
    </template>

    <!-- ============ MODALES ============ -->

    <!-- Modal Crear Ciclo -->
    <UModal v-model="showModalCrear">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800 dark:text-gray-100">Crear Nuevo Ciclo</h3>
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" size="xs" @click="showModalCrear = false" />
          </div>
        </template>
        <div class="space-y-4">
          <UFormGroup label="Fecha de inicio">
            <UInput :model-value="formatFecha(fechaInicioProximo)" disabled class="w-full" />
            <template #hint>
              <span class="text-xs text-gray-400">Se calcula automáticamente</span>
            </template>
          </UFormGroup>
          <UFormGroup label="Fecha de cierre prevista *">
            <UInput v-model="formCrear.fecha_cierre" type="date" class="w-full" />
          </UFormGroup>
          <UAlert v-if="errorModal" icon="i-heroicons-exclamation-circle" color="red" variant="soft" :title="errorModal" />
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="gray" variant="outline" @click="showModalCrear = false" />
            <UButton label="Crear Ciclo" :loading="guardando" @click="crearCiclo" />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal Editar Fecha -->
    <UModal v-model="showModalEditarFecha">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800 dark:text-gray-100">Editar Fecha de Cierre</h3>
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" size="xs" @click="showModalEditarFecha = false" />
          </div>
        </template>
        <div class="space-y-4">
          <UFormGroup label="Nueva fecha de cierre prevista *">
            <UInput v-model="formEditarFecha.fecha_cierre" type="date" class="w-full" />
          </UFormGroup>
          <UAlert v-if="errorModal" icon="i-heroicons-exclamation-circle" color="red" variant="soft" :title="errorModal" />
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="gray" variant="outline" @click="showModalEditarFecha = false" />
            <UButton label="Guardar" :loading="guardando" @click="editarFecha" />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal Confirmar Cierre -->
    <UModal v-model="showModalCierre">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-red-600">Confirmar Cierre de Ciclo</h3>
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" size="xs" @click="showModalCierre = false" />
          </div>
        </template>
        <div class="space-y-3">
          <UAlert
            icon="i-heroicons-exclamation-triangle"
            color="orange"
            variant="soft"
            title="Esta acción no se puede deshacer"
            description="Se generará un snapshot definitivo de comisiones para todos los vendedores."
          />
          <div class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <p><strong>Período:</strong> {{ cicloActivo ? formatFecha(cicloActivo.fecha_inicio) : '' }} — Hoy</p>
            <p><strong>Vendedores:</strong> {{ estimaciones.length }}</p>
            <p><strong>Total comisiones:</strong> <span class="text-green-600 font-semibold">{{ formatPrecio(totalEstimado) }}</span></p>
          </div>
          <UAlert v-if="errorModal" icon="i-heroicons-exclamation-circle" color="red" variant="soft" :title="errorModal" />
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="gray" variant="outline" @click="showModalCierre = false" />
            <UButton label="Confirmar Cierre" color="red" :loading="guardando" @click="cerrarCiclo" />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { CicloComision, CicloPago, EstimacionVendedor } from '~/composables/useComisiones'
import { calcularEstimaciones } from '~/composables/useComisiones'

definePageMeta({ middleware: ['role'] })

const client = useSupabaseClient()
const toast = useToast()

const empresaSeleccionada = ref('express')
const empresaOptions = [
  { label: 'Express', value: 'express' },
  { label: 'Ultra', value: 'ultra' },
]

// ——— Estado principal ———
const loading = ref(true)
const loadingEstimaciones = ref(false)
const guardando = ref(false)
const errorModal = ref('')

const cicloActivo = ref<CicloComision | null>(null)
const historial = ref<CicloComision[]>([])
const pagos = ref<CicloPago[]>([])
const estimaciones = ref<EstimacionVendedor[]>([])
const cicloExpandido = ref<string | null>(null)

// Datos para cálculo de estimaciones
const ventasConcretadas = ref<any[]>([])
const allProfiles = ref<any[]>([])
const grupos = ref<any[]>([])

// ——— Configuración ———
const configForm = reactive({ pct_grupo: 80, pct_lider: 25 })
const guardandoConfig = ref(false)

// ——— Modales ———
const showModalCrear = ref(false)
const showModalEditarFecha = ref(false)
const showModalCierre = ref(false)
const formCrear = reactive({ fecha_cierre: '' })
const formEditarFecha = reactive({ fecha_cierre: '' })

// ——— Columnas tablas ———
const columnasEstimaciones = [
  { key: 'nombre', label: 'Vendedor' },
  { key: 'rol', label: 'Rol' },
  { key: 'cantidad_ventas', label: 'Ventas' },
  { key: 'monto_total_ventas', label: 'Monto Ventas' },
  { key: 'porcentaje_aplicado', label: '%' },
  { key: 'monto_comision', label: 'Comisión' },
  { key: 'monto_liderazgo', label: 'Bonus Líder' },
  { key: 'monto_total', label: 'Total' },
]

const columnasPagos = [
  { key: 'nombre', label: 'Vendedor' },
  { key: 'rol_snapshot', label: 'Rol' },
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

const rolColor = (rol: string) => {
  const map: Record<string, string> = { vendedor: 'blue', oficinista: 'purple', lider: 'orange', admin: 'red' }
  return map[rol] ?? 'gray'
}

const rolLabel = (rol: string) => {
  const map: Record<string, string> = { vendedor: 'Vendedor', oficinista: 'Oficinista', lider: 'Líder', admin: 'Admin' }
  return map[rol] ?? rol
}

const diasRestantes = computed(() => {
  if (!cicloActivo.value) return '—'
  const cierre = new Date(cicloActivo.value.fecha_cierre_prevista + 'T00:00:00')
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diff = Math.ceil((cierre.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Vencido'
  if (diff === 0) return 'Hoy'
  return `${diff} día${diff !== 1 ? 's' : ''}`
})

const totalEstimado = computed(() =>
  estimaciones.value.reduce((sum, e) => sum + e.monto_total, 0),
)

const fechaInicioProximo = computed(() => {
  if (historial.value.length === 0) {
    return new Date().toISOString().split('T')[0]
  }
  const ultimo = historial.value[0]
  const cierre = new Date(ultimo.fecha_cierre_real + 'T00:00:00')
  cierre.setDate(cierre.getDate() + 1)
  return cierre.toISOString().split('T')[0]
})

const totalCiclo = (cicloId: string) =>
  pagos.value
    .filter(p => p.ciclo_id === cicloId)
    .reduce((sum, p) => sum + Number(p.monto_total), 0)

const pagosPendientes = (cicloId: string) =>
  pagos.value.filter(p => p.ciclo_id === cicloId && !p.pagado).length

const pagosCiclo = (cicloId: string) =>
  pagos.value
    .filter(p => p.ciclo_id === cicloId)
    .sort((a, b) => Number(b.monto_total) - Number(a.monto_total))

// ——— Carga de datos ———
const cargarCicloActivo = async () => {
  const { data } = await client
    .from('ciclos_comision')
    .select('*')
    .eq('estado', 'activo')
    .eq('empresa', empresaSeleccionada.value)
    .maybeSingle()
  cicloActivo.value = data as CicloComision | null
}

const cargarHistorial = async () => {
  const { data } = await client
    .from('ciclos_comision')
    .select('*')
    .eq('estado', 'cerrado')
    .eq('empresa', empresaSeleccionada.value)
    .order('fecha_cierre_real', { ascending: false })
  historial.value = (data ?? []) as CicloComision[]
}

const cargarPagos = async () => {
  const { data } = await client
    .from('ciclo_pagos')
    .select('*, profiles:vendedor_id(nombre)')
    .eq('empresa', empresaSeleccionada.value)
    .order('monto_total', { ascending: false })
  pagos.value = (data ?? []) as CicloPago[]
}

const cargarConfig = async () => {
  const [{ data: d1 }, { data: d2 }] = await Promise.all([
    client.from('configuracion').select('valor').eq('clave', 'comision_porcentaje_grupo').eq('empresa', empresaSeleccionada.value).single(),
    client.from('configuracion').select('valor').eq('clave', 'comision_porcentaje_lider').eq('empresa', empresaSeleccionada.value).single(),
  ])
  configForm.pct_grupo = Number(d1?.valor ?? 80)
  configForm.pct_lider = Number(d2?.valor ?? 25)
}

const cargarEstimaciones = async () => {
  if (!cicloActivo.value) {
    estimaciones.value = []
    return
  }
  loadingEstimaciones.value = true

  // Cargar ventas concretadas del período del ciclo
  const [{ data: ventasData }, { data: profilesData }, { data: gruposData }] = await Promise.all([
    client
      .from('ventas')
      .select('id, vendedor_id, precio, precio_concretado, fecha_concretado')
      .eq('estado', 'concretado')
      .eq('empresa', empresaSeleccionada.value)
      .gte('fecha_concretado', cicloActivo.value.fecha_inicio)
      .lte('fecha_concretado', new Date().toISOString()),
    client.from('profiles').select('id, nombre, rol, grupo_id'),
    client.from('grupos').select('id, lider_id'),
  ])

  ventasConcretadas.value = ventasData ?? []
  allProfiles.value = profilesData ?? []
  grupos.value = gruposData ?? []

  estimaciones.value = calcularEstimaciones(
    ventasConcretadas.value,
    allProfiles.value,
    gruposData ?? [],
    { pct_grupo: configForm.pct_grupo, pct_lider: configForm.pct_lider },
  )

  loadingEstimaciones.value = false
}

// ——— Acciones ———
const guardarConfig = async () => {
  guardandoConfig.value = true

  try {
    await $fetch('/api/admin/comisiones/config', {
      method: 'PUT',
      body: {
        pct_grupo: configForm.pct_grupo,
        pct_lider: configForm.pct_lider,
        empresa: empresaSeleccionada.value,
      },
    })
    toast.add({ title: 'Porcentajes actualizados', color: 'green' })
    // Recalcular estimaciones con nuevos porcentajes
    await cargarEstimaciones()
  } catch (err: any) {
    toast.add({ title: err.data?.statusMessage || 'Error al guardar', color: 'red' })
  } finally {
    guardandoConfig.value = false
  }
}

const abrirModalCrear = () => {
  formCrear.fecha_cierre = ''
  errorModal.value = ''
  showModalCrear.value = true
}

const crearCiclo = async () => {
  if (!formCrear.fecha_cierre) {
    errorModal.value = 'Seleccioná una fecha de cierre.'
    return
  }
  guardando.value = true
  errorModal.value = ''

  try {
    await $fetch('/api/admin/comisiones/ciclos', {
      method: 'POST',
      body: { fecha_cierre_prevista: formCrear.fecha_cierre, empresa: empresaSeleccionada.value },
    })
    showModalCrear.value = false
    toast.add({ title: 'Ciclo creado', color: 'green' })
    await cargarCicloActivo()
    await cargarEstimaciones()
  } catch (err: any) {
    errorModal.value = err.data?.statusMessage || 'Error al crear ciclo'
  } finally {
    guardando.value = false
  }
}

const abrirModalEditarFecha = () => {
  formEditarFecha.fecha_cierre = cicloActivo.value?.fecha_cierre_prevista ?? ''
  errorModal.value = ''
  showModalEditarFecha.value = true
}

const editarFecha = async () => {
  if (!formEditarFecha.fecha_cierre || !cicloActivo.value) {
    errorModal.value = 'Seleccioná una fecha válida.'
    return
  }
  guardando.value = true
  errorModal.value = ''

  try {
    await $fetch('/api/admin/comisiones/ciclos/fecha', {
      method: 'PUT',
      body: {
        ciclo_id: cicloActivo.value.id,
        nueva_fecha: formEditarFecha.fecha_cierre,
      },
    })
    showModalEditarFecha.value = false
    toast.add({ title: 'Fecha actualizada', color: 'green' })
    await cargarCicloActivo()
  } catch (err: any) {
    errorModal.value = err.data?.statusMessage || 'Error al actualizar fecha'
  } finally {
    guardando.value = false
  }
}

const abrirModalConfirmarCierre = () => {
  errorModal.value = ''
  showModalCierre.value = true
}

const cerrarCiclo = async () => {
  if (!cicloActivo.value) return
  guardando.value = true
  errorModal.value = ''

  try {
    await $fetch('/api/admin/comisiones/ciclos/cerrar', {
      method: 'POST',
      body: { ciclo_id: cicloActivo.value.id },
    })
    showModalCierre.value = false
    toast.add({ title: 'Ciclo cerrado correctamente', color: 'green' })
    cicloActivo.value = null
    estimaciones.value = []
    await Promise.all([cargarHistorial(), cargarPagos()])
  } catch (err: any) {
    errorModal.value = err.data?.statusMessage || 'Error al cerrar ciclo'
  } finally {
    guardando.value = false
  }
}

const togglePago = async (pago: CicloPago) => {
  const nuevoPagado = !pago.pagado

  try {
    await $fetch(`/api/admin/comisiones/pagos/${pago.id}`, {
      method: 'PUT',
      body: { pagado: nuevoPagado },
    })
    // Actualizar localmente
    const idx = pagos.value.findIndex(p => p.id === pago.id)
    if (idx !== -1) {
      pagos.value[idx].pagado = nuevoPagado
      pagos.value[idx].fecha_pago = nuevoPagado ? new Date().toISOString() : null
    }
    toast.add({ title: nuevoPagado ? 'Marcado como pagado' : 'Marcado como pendiente', color: 'green' })
  } catch (err: any) {
    toast.add({ title: err.data?.statusMessage || 'Error al actualizar pago', color: 'red' })
  }
}

const toggleDetalle = (cicloId: string) => {
  cicloExpandido.value = cicloExpandido.value === cicloId ? null : cicloId
}

// ——— Init ———
const cargarTodo = async () => {
  loading.value = true
  await Promise.all([cargarCicloActivo(), cargarHistorial(), cargarPagos(), cargarConfig()])
  await cargarEstimaciones()
  loading.value = false
}

onMounted(cargarTodo)

watch(empresaSeleccionada, cargarTodo)

useHead({ title: 'Comisiones — AMSI SRL' })
</script>
