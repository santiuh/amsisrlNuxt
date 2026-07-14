<template>
  <div>
    <h4 class="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-2">
      Historial de interacciones
    </h4>

    <div v-if="cargando" class="py-4 flex justify-center">
      <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-gray-400" />
    </div>

    <p v-else-if="items.length === 0" class="text-[12px] text-gray-400 dark:text-slate-500 italic">
      Sin interacciones registradas todavía.
    </p>

    <ol v-else class="relative space-y-3 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-gray-200 dark:before:bg-white/10">
      <li v-for="item in items" :key="item.id" class="relative pl-6">
        <span
          class="absolute left-0 top-1 w-[15px] h-[15px] rounded-full ring-4 ring-white dark:ring-[#0f172a] flex items-center justify-center"
          :style="{ background: item.estado_resultante ? prospectoPinColor(item.estado_resultante) : '#94a3b8' }"
        />
        <div class="flex flex-wrap items-baseline gap-x-2">
          <span class="text-[12px] font-bold text-gray-800 dark:text-gray-100">
            {{ interaccionTipoLabel(item.tipo) }}
          </span>
          <span v-if="item.resultado" class="text-[11px] font-medium text-gray-500 dark:text-slate-400">
            {{ interaccionResultadoLabel(item.resultado) }}
          </span>
          <span
            v-if="item.estado_resultante"
            class="inline-flex items-center px-1.5 py-px rounded-full text-[10px] font-semibold ring-1 ring-inset"
            :class="prospectoEstadoPill(item.estado_resultante)"
          >
            {{ prospectoEstadoLabel(item.estado_resultante) }}
          </span>
        </div>
        <p class="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
          {{ fechaHora(item.created_at) }}
          <template v-if="item.autor?.nombre"> · {{ item.autor.nombre }}</template>
          <template v-if="item.proxima_visita"> · revisita: {{ fechaCorta(item.proxima_visita) }}</template>
        </p>
        <p v-if="item.comentario" class="text-[12px] text-gray-600 dark:text-slate-300 mt-1 whitespace-pre-line">
          {{ item.comentario }}
        </p>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  prospectoId: string
}>()

interface Interaccion {
  id: string
  tipo: string
  resultado: string | null
  estado_resultante: string | null
  comentario: string | null
  proxima_visita: string | null
  created_at: string
  autor: { nombre: string | null } | null
}

const client = useSupabaseClient()
const items = ref<Interaccion[]>([])
const cargando = ref(true)

const cargar = async () => {
  cargando.value = true
  const { data } = await client
    .from('prospecto_interacciones')
    .select('id, tipo, resultado, estado_resultante, comentario, proxima_visita, created_at, autor:autor_id(nombre)')
    .eq('prospecto_id', props.prospectoId)
    .order('created_at', { ascending: false })
    .limit(100)
  items.value = (data ?? []) as any[]
  cargando.value = false
}

onMounted(cargar)
watch(() => props.prospectoId, cargar)

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

const fechaCorta = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })

defineExpose({ refrescar: cargar })
</script>
