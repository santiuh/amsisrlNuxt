<template>
  <div class="h-full overflow-y-auto pb-24 md:pb-4">
    <div v-if="loading" class="py-8 flex justify-center">
      <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
    </div>

    <div v-else-if="grupos.length === 0" class="py-10 text-center">
      <UIcon name="i-heroicons-calendar-days" class="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
      <p class="text-[13px] text-gray-400 dark:text-slate-500">
        No hay revisitas agendadas
      </p>
      <p class="text-[12px] text-gray-400 dark:text-slate-600 mt-1">
        Cuando registres una visita podés marcar "volver a pasar" y aparece acá.
      </p>
    </div>

    <div v-else class="space-y-4">
      <section v-for="grupo in grupos" :key="grupo.titulo">
        <h4
          class="text-[11px] font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1.5"
          :class="grupo.vencido ? 'text-rose-500' : 'text-gray-400 dark:text-slate-500'"
        >
          <UIcon :name="grupo.icon" class="w-3.5 h-3.5" />
          {{ grupo.titulo }}
          <span class="font-semibold normal-case">({{ grupo.items.length }})</span>
        </h4>
        <div class="space-y-1.5">
          <div
            v-for="p in grupo.items"
            :key="p.id"
            class="bg-white dark:bg-[#0f172a] rounded-xl ring-1 ring-gray-200/70 dark:ring-white/[0.06] px-3.5 py-2.5 flex items-center gap-3"
            :class="grupo.vencido ? 'ring-rose-200/70 dark:ring-rose-500/20' : ''"
          >
            <div class="min-w-0 flex-1">
              <p class="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                {{ p.nombre || direccionCompleta(p) || 'Sin nombre' }}
              </p>
              <p class="text-[11px] text-gray-500 dark:text-slate-400 truncate mt-0.5">
                <span
                  class="inline-flex items-center px-1.5 py-px rounded-full text-[10px] font-semibold ring-1 ring-inset mr-1.5"
                  :class="prospectoEstadoPill(p.estado)"
                >{{ prospectoEstadoLabel(p.estado) }}</span>
                {{ fechaCorta(p.proxima_visita) }}<template v-if="p.dir_localidad"> · {{ p.dir_localidad }}</template>
              </p>
            </div>
            <button
              v-if="p.lat != null"
              type="button"
              class="shrink-0 p-2 rounded-lg text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors"
              aria-label="Ver en mapa"
              @click="emit('ver-en-mapa', p)"
            >
              <UIcon name="i-heroicons-map" class="w-4.5 h-4.5" />
            </button>
            <NuxtLink
              :to="`/prospectos/${p.id}`"
              class="shrink-0 p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Ver ficha"
            >
              <UIcon name="i-heroicons-chevron-right" class="w-4.5 h-4.5" />
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProspectoRow } from '~/utils/prospectoUI'

const emit = defineEmits<{
  (e: 'ver-en-mapa', prospecto: ProspectoRow): void
}>()

const client = useSupabaseClient()
const loading = ref(true)
const items = ref<ProspectoRow[]>([])

const cargar = async () => {
  loading.value = true
  const { data } = await client
    .from('prospectos')
    .select('*')
    .not('proxima_visita', 'is', null)
    .neq('estado', 'contratado')
    .order('proxima_visita', { ascending: true })
    .limit(500)
  items.value = (data ?? []) as ProspectoRow[]
  loading.value = false
}

onMounted(cargar)

const hoyISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const grupos = computed(() => {
  const hoy = hoyISO()
  const enUnaSemana = (() => {
    const d = new Date(Date.now() + 7 * 86_400_000)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  const vencidas = items.value.filter(p => p.proxima_visita! < hoy)
  const paraHoy = items.value.filter(p => p.proxima_visita === hoy)
  const semana = items.value.filter(p => p.proxima_visita! > hoy && p.proxima_visita! <= enUnaSemana)
  const proximas = items.value.filter(p => p.proxima_visita! > enUnaSemana)

  return [
    { titulo: 'Vencidas', icon: 'i-heroicons-exclamation-triangle', items: vencidas, vencido: true },
    { titulo: 'Hoy', icon: 'i-heroicons-sun', items: paraHoy, vencido: false },
    { titulo: 'Esta semana', icon: 'i-heroicons-calendar-days', items: semana, vencido: false },
    { titulo: 'Más adelante', icon: 'i-heroicons-clock', items: proximas, vencido: false },
  ].filter(g => g.items.length > 0)
})

const fechaCorta = (iso: string | null): string => {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

defineExpose({ refrescar: cargar })
</script>
