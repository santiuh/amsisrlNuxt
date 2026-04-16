<template>
  <div class="border-t border-gray-100 dark:border-white/[0.06]">
    <div class="px-5 pt-5 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <h4 class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        Log de actividad
      </h4>
      <!-- Filtro por tipo de acción -->
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="chip in filterChips"
          :key="chip.value"
          class="text-[11px] px-2.5 py-1 rounded-full border transition-colors"
          :class="activeFilter === chip.value
            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-600 dark:text-indigo-300'
            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 dark:bg-white/[0.03] dark:border-white/[0.1] dark:text-gray-400 dark:hover:border-white/[0.2]'"
          @click="activeFilter = chip.value"
        >
          {{ chip.label }}
        </button>
      </div>
    </div>

    <div v-if="filteredFeed.length === 0" class="px-5 pb-4 text-xs text-gray-400 dark:text-gray-500">
      Sin actividad en este rango.
    </div>

    <div v-else class="px-5 pb-4">
      <template v-for="(group, gIdx) in visibleGroups" :key="group.label">
        <!-- Divisor de fecha -->
        <div
          class="sticky top-0 z-10 bg-white dark:bg-[#0a0a0a] py-1.5 mt-1"
          :class="gIdx > 0 ? 'border-t border-gray-100 dark:border-white/[0.06]' : ''"
        >
          <span class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {{ group.label }}
          </span>
        </div>

        <!-- Items del día -->
        <div
          v-for="item in group.items"
          :key="item.id"
          class="flex gap-3 py-2.5 border-l-2 pl-3 ml-1"
          :class="borderColor(item.action_type)"
        >
          <!-- Avatar -->
          <div class="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600 mt-0.5">
            <UserAvatar :config="item.oficinistaAvatar" :seed="item.oficinistaNombre" class="w-full h-full" />
          </div>

          <div class="flex-1 min-w-0">
            <!-- Header: nombre + hora -->
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                {{ item.oficinistaNombre }}
              </span>
              <span
                class="text-[11px] text-gray-400 dark:text-gray-500 shrink-0"
                :title="formatFullDate(item.created_at)"
              >
                {{ formatTime(item.created_at) }}
              </span>
            </div>

            <!-- Descripción de la acción -->
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {{ actionDescription(item) }}
            </p>

            <!-- Contexto de venta -->
            <p v-if="item.venta" class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
              {{ item.venta.cliente }}
              <span v-if="item.venta.empresa" class="inline-flex items-center ml-1 px-1.5 py-0 rounded text-[10px] font-medium"
                :class="item.venta.empresa === 'ultra'
                  ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300'
                  : 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300'"
              >
                {{ item.venta.empresa === 'ultra' ? 'Ultra' : 'Express' }}
              </span>
              <span v-if="item.venta.dir_localidad"> — {{ item.venta.dir_localidad }}</span>
            </p>
          </div>
        </div>
      </template>

      <!-- Cargar más -->
      <div v-if="filteredFeed.length > visibleCount" class="pt-3 text-center">
        <button
          class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          @click="visibleCount += 50"
        >
          Cargar más ({{ filteredFeed.length - visibleCount }} restantes)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FeedItem } from '~/composables/useOficinistaActivity'

const props = defineProps<{
  feed: FeedItem[]
}>()

const activeFilter = ref<string>('all')
const visibleCount = ref(50)

const filterChips = [
  { label: 'Todos', value: 'all' },
  { label: 'Estados', value: 'estado_change' },
  { label: 'Coordinaciones', value: 'coordinacion_set' },
  { label: 'Nro. cliente', value: 'nro_cliente_set' },
  { label: 'Comentarios', value: 'comentario' },
]

const filteredFeed = computed(() => {
  if (activeFilter.value === 'all') return props.feed
  return props.feed.filter(i => i.action_type === activeFilter.value)
})

// Reset visible count cuando cambia el filtro
watch(activeFilter, () => { visibleCount.value = 50 })

interface FeedGroup {
  label: string
  items: FeedItem[]
}

const visibleGroups = computed<FeedGroup[]>(() => {
  const items = filteredFeed.value.slice(0, visibleCount.value)
  const groups: FeedGroup[] = []
  let currentKey = ''

  for (const item of items) {
    const dayKey = item.created_at.slice(0, 10) // YYYY-MM-DD
    if (dayKey !== currentKey) {
      currentKey = dayKey
      groups.push({ label: formatDayLabel(dayKey), items: [] })
    }
    groups[groups.length - 1].items.push(item)
  }
  return groups
})

const borderColor = (type: string) => {
  switch (type) {
    case 'estado_change': return 'border-indigo-400 dark:border-indigo-500'
    case 'coordinacion_set': return 'border-cyan-400 dark:border-cyan-500'
    case 'nro_cliente_set': return 'border-amber-400 dark:border-amber-500'
    case 'comentario': return 'border-gray-300 dark:border-gray-600'
    default: return 'border-gray-200 dark:border-gray-700'
  }
}

const estadoLabel = (estado: string | null) => {
  if (!estado) return '?'
  const map: Record<string, string> = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    coordinado: 'Coordinado',
    rechazado: 'Rechazado',
    concretado: 'Concretado',
  }
  return map[estado] ?? estado
}

const actionDescription = (item: FeedItem) => {
  switch (item.action_type) {
    case 'estado_change':
      return `Cambió estado: ${estadoLabel(item.from_estado)} → ${estadoLabel(item.to_estado)}`
    case 'coordinacion_set': {
      if (item.fecha_coordinacion_set) {
        const d = new Date(item.fecha_coordinacion_set)
        return `Turno coordinado: ${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
      }
      return 'Fecha de turno actualizada'
    }
    case 'nro_cliente_set':
      return `Nro. de cliente asignado: ${item.metadata?.nro_cliente ?? '—'}`
    case 'comentario':
      return `Comentario: "${item.metadata?.comentario_preview ?? '...'}"`
    default:
      return item.action_type
  }
}

const formatTime = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

const formatFullDate = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const formatDayLabel = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.getTime() === today.getTime()) return 'Hoy'
  if (date.getTime() === yesterday.getTime()) return 'Ayer'
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit' })
}
</script>
