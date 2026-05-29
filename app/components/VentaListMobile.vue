<template>
  <div class="space-y-2">
    <VentaListMobileSkeleton v-if="loading" :count="5" />

    <template v-else>
      <NuxtLink
        v-for="v in visibleVentas"
        :key="v.id"
        :to="`/ventas/${v.id}`"
        class="relative block rounded-xl bg-white ring-1 ring-gray-100 px-3 py-2.5 active:bg-gray-50 transition-colors dark:bg-white/[0.03] dark:ring-white/[0.06] dark:active:bg-white/[0.06]"
      >
        <span
          v-if="tieneComentarioNuevo(v, lecturas)"
          class="absolute top-2 right-2 flex h-2 w-2"
          title="Nuevo comentario"
        >
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
        </span>

        <div class="flex items-center justify-between gap-2 mb-1">
          <div class="flex items-center gap-1.5 min-w-0">
            <span
              class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset shrink-0"
              :class="empresaPillClass(v.empresa)"
            >
              {{ empresaLabel(v.empresa) }}
            </span>
            <span class="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
              {{ formatFecha(v.fecha_carga) }}
            </span>
          </div>
          <span
            class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ring-1 ring-inset whitespace-nowrap"
            :class="estadoPillClass(v.estado)"
          >
            {{ estadoLabel(v.estado) }}
          </span>
        </div>

        <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
          {{ v.cliente || '—' }}
        </p>

        <div class="flex items-center justify-between gap-2 mt-0.5">
          <span class="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
            <template v-if="showVendedor && v.profiles?.nombre">
              {{ v.profiles.nombre }}
              <span v-if="v.paquete_nombre" class="opacity-50"> · </span>
            </template>
            <span v-if="v.paquete_nombre" class="opacity-80">{{ v.paquete_nombre }}</span>
          </span>
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-200 tabular-nums shrink-0">
            {{ formatPrecio(v.precio_concretado ?? v.precio) }}
          </span>
        </div>
      </NuxtLink>

      <div v-if="visibleVentas.length === 0" class="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
        No hay ventas todavía.
      </div>

      <NuxtLink
        v-if="ventas.length > limit"
        to="/ventas"
        class="block py-3 text-center text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300"
      >
        Ver todas →
      </NuxtLink>
    </template>
  </div>
</template>

<script setup lang="ts">
import { empresaLabel } from '~/utils/empresa'
import {
  estadoLabel,
  estadoPillClass,
  empresaPillClass,
  tieneComentarioNuevo,
} from '~/utils/ventaUI'

const props = withDefaults(defineProps<{
  ventas: any[]
  loading?: boolean
  showVendedor?: boolean
  lecturas?: Record<string, string>
  limit?: number
}>(), {
  loading: false,
  showVendedor: false,
  limit: 10,
})

const visibleVentas = computed(() => props.ventas.slice(0, props.limit))

const formatFecha = (f: string) => {
  if (!f) return ''
  const date = f.length === 10 ? new Date(`${f}T12:00:00`) : new Date(f)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

const formatPrecio = (n: number | string | null | undefined) => {
  const num = Number(n)
  if (!Number.isFinite(num) || num === 0) return '—'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(num)
}
</script>
