<template>
  <div class="border-t border-gray-100 dark:border-white/[0.06]">
    <div class="px-5 pt-5 pb-2">
      <h4 class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        Horarios de trabajo
      </h4>
    </div>

    <div v-if="groupedDays.length === 0" class="px-5 pb-4 text-xs text-gray-400 dark:text-gray-500">
      Sin actividad en este rango.
    </div>

    <template v-for="(day, idx) in visibleDays" :key="day.date">
      <div class="px-5 pt-3" :class="idx > 0 ? 'border-t border-gray-50 dark:border-white/[0.04]' : ''">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          {{ formatDayLabel(day.date) }}
        </p>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="text-gray-400 dark:text-gray-500">
                <th class="text-left font-medium pb-1.5 pr-4">Oficinista</th>
                <th class="text-center font-medium pb-1.5 px-3">Entrada</th>
                <th class="text-center font-medium pb-1.5 px-3">Salida</th>
                <th class="text-center font-medium pb-1.5 px-3">Duración</th>
                <th class="text-center font-medium pb-1.5 pl-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="s in day.sessions"
                :key="s.oficinistaId"
                :class="s.actionCount === 0 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'"
              >
                <td class="py-1.5 pr-4">
                  <div class="flex items-center gap-1.5">
                    <div class="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600">
                      <UserAvatar :config="s.avatar_config" :seed="s.nombre" class="w-full h-full" />
                    </div>
                    <span>{{ s.nombre }}</span>
                  </div>
                </td>
                <td class="text-center py-1.5 px-3 font-mono">
                  {{ s.actionCount > 0 ? formatTime(s.firstAction) : '—' }}
                </td>
                <td class="text-center py-1.5 px-3 font-mono">
                  {{ s.actionCount > 0 ? formatTime(s.lastAction) : '—' }}
                </td>
                <td class="text-center py-1.5 px-3">
                  {{ s.actionCount > 0 ? formatDuration(s.durationMinutes) : '—' }}
                </td>
                <td class="text-center py-1.5 pl-3 font-mono">
                  {{ s.actionCount > 0 ? s.actionCount : '0' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <div v-if="groupedDays.length > 3" class="px-5 py-3 border-t border-gray-50 dark:border-white/[0.04]">
      <button
        class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        @click="showAll = !showAll"
      >
        {{ showAll ? 'Ver menos' : `Ver ${groupedDays.length - 3} días más` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DaySession, OficinistaRef } from '~/composables/useOficinistaActivity'

const props = defineProps<{
  sessions: DaySession[]
  oficinistas: OficinistaRef[]
}>()

const showAll = ref(false)

interface GroupedDay {
  date: string
  sessions: DaySession[]
}

const groupedDays = computed<GroupedDay[]>(() => {
  const map = new Map<string, DaySession[]>()
  for (const s of props.sessions) {
    if (!map.has(s.date)) map.set(s.date, [])
    map.get(s.date)!.push(s)
  }
  // Ordenar sesiones dentro de cada día: activos primero (por primera acción asc), inactivos al final
  const result: GroupedDay[] = []
  for (const [date, sessions] of map) {
    sessions.sort((a, b) => {
      if (a.actionCount === 0 && b.actionCount === 0) return 0
      if (a.actionCount === 0) return 1
      if (b.actionCount === 0) return -1
      return a.firstAction.localeCompare(b.firstAction)
    })
    result.push({ date, sessions })
  }
  // Días ya vienen ordenados desc desde el composable
  return result
})

const visibleDays = computed(() => {
  if (showAll.value || groupedDays.value.length <= 3) return groupedDays.value
  return groupedDays.value.slice(0, 3)
})

const formatTime = (iso: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

const formatDuration = (minutes: number) => {
  if (minutes < 1) return '<1 min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return `${h}h ${m}m`
}

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
