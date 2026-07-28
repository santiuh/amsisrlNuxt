<template>
  <div class="space-y-4 max-w-3xl mx-auto">
    <!-- Encabezado + filtros -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-9 h-9 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center shrink-0">
          <UIcon name="i-heroicons-eye" class="w-5 h-5 text-emerald-500" />
        </div>
        <div class="min-w-0">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white leading-tight truncate">Historial del Asistente</h2>
          <p class="text-[11px] text-gray-400 dark:text-slate-500 leading-tight truncate">
            Auditoría: qué preguntó cada uno y qué SQL ejecutó el bot
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <USelect v-model="rango" :options="RANGOS" size="sm" class="w-40" />
        <USelect v-model="usuarioId" :options="usuariosOptions" size="sm" class="w-44" />
      </div>
    </div>

    <!-- Estados -->
    <div v-if="loading" class="py-14 flex justify-center">
      <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-gray-400 animate-spin" />
    </div>
    <p v-else-if="errorMsg" class="py-8 text-center text-sm text-rose-500">{{ errorMsg }}</p>
    <p v-else-if="conversaciones.length === 0" class="py-14 text-center text-sm text-gray-400 dark:text-slate-500">
      Sin conversaciones en el período.
    </p>

    <!-- Feed por día → conversaciones → mensajes -->
    <template v-else>
      <div v-for="grupo in gruposDia" :key="grupo.dia" class="space-y-3">
        <div class="sticky top-0 z-10 py-1.5 bg-[#f4f6f8] dark:bg-[#080e1a]">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">{{ grupo.label }}</span>
        </div>

        <div
          v-for="conv in grupo.conversaciones"
          :key="conv.key"
          class="rounded-2xl bg-white ring-1 ring-gray-200/60 shadow-soft dark:bg-white/[0.02] dark:ring-white/[0.06] overflow-hidden"
        >
          <!-- Cabecera de la conversación -->
          <div class="px-4 py-2.5 flex items-center justify-between gap-2 border-b border-gray-100 dark:border-white/[0.06]">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-[13px] font-semibold text-gray-800 dark:text-white truncate">{{ conv.nombre }}</span>
              <span class="text-[11px] text-gray-400 dark:text-slate-500 shrink-0">{{ formatHora(conv.inicio) }}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <UBadge v-if="conv.conError" color="red" variant="subtle" size="xs">error</UBadge>
              <span class="text-[11px] text-gray-400 dark:text-slate-500">
                {{ conv.mensajes.length }} msjs · {{ conv.totalConsultas }} SQL
              </span>
            </div>
          </div>

          <!-- Mensajes -->
          <div class="px-3 sm:px-4 py-3 space-y-3">
            <div v-for="m in conv.mensajes" :key="m.id" class="flex" :class="m.role === 'user' ? 'justify-end' : 'justify-start'">
              <!-- Pregunta del admin -->
              <div
                v-if="m.role === 'user'"
                class="max-w-[85%] rounded-2xl rounded-br-md bg-emerald-600 text-white px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words shadow-soft"
              >{{ m.texto }}</div>

              <!-- Respuesta del bot -->
              <div v-else class="max-w-[95%] sm:max-w-[88%] flex gap-2.5">
                <div
                  class="w-7 h-7 rounded-lg shrink-0 mt-0.5 flex items-center justify-center"
                  :class="m.error ? 'bg-rose-500/10 ring-1 ring-rose-500/20' : 'bg-emerald-500/10 ring-1 ring-emerald-500/20'"
                >
                  <UIcon
                    :name="m.error ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-sparkles'"
                    class="w-4 h-4"
                    :class="m.error ? 'text-rose-500' : 'text-emerald-500'"
                  />
                </div>
                <div
                  class="min-w-0 rounded-2xl rounded-bl-md px-4 py-3 text-[13.5px] leading-relaxed"
                  :class="m.error
                    ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20'
                    : 'bg-gray-50 text-gray-800 ring-1 ring-gray-200/70 dark:bg-white/[0.04] dark:text-slate-200 dark:ring-white/[0.06]'"
                >
                  <!-- eslint-disable-next-line vue/no-v-html — HTML generado por renderMarkdownLite, que escapa todo el texto -->
                  <div class="md-cuerpo" v-html="renderMarkdownLite(m.texto)" />

                  <!-- Las SQL que ejecutó el bot para esta respuesta -->
                  <details v-if="m.sqls && m.sqls.length > 0" class="mt-2">
                    <summary class="cursor-pointer text-[11px] font-medium text-emerald-600 dark:text-emerald-400 select-none">
                      Ver SQL ({{ m.sqls.length }})
                    </summary>
                    <div class="mt-1.5 space-y-1.5">
                      <pre
                        v-for="(sql, i) in m.sqls"
                        :key="i"
                        class="p-2.5 rounded-lg bg-gray-900 text-slate-100 dark:bg-black/40 overflow-x-auto text-[11.5px] leading-relaxed whitespace-pre-wrap break-words"
                      ><code>{{ sql }}</code></pre>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="conversaciones.length > visibleCount" class="pt-1 text-center">
        <button
          class="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          type="button"
          @click="visibleCount += 20"
        >
          Cargar más ({{ conversaciones.length - visibleCount }} restantes)
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['role'] })
useHead({ title: 'Historial del Asistente — AMSI SRL' })

const client = useSupabaseClient()
const profile = useCurrentProfile()

interface MensajeRow {
  id: string
  user_id: string | null
  role: 'user' | 'assistant'
  texto: string
  error: boolean
  consultas: number | null
  sqls: string[] | null
  created_at: string
}

interface Conversacion {
  key: string
  userId: string
  nombre: string
  inicio: string
  mensajes: MensajeRow[]
  totalConsultas: number
  conError: boolean
}

const RANGOS = [
  { label: 'Últimos 7 días', value: '7dias' },
  { label: 'Hoy', value: 'hoy' },
  { label: 'Últimos 30 días', value: '30dias' },
  { label: 'Todo', value: 'todo' },
]

const rango = ref('7dias')
const usuarioId = ref('')
const filas = ref<MensajeRow[]>([])
const nombres = ref<Record<string, string>>({})
const loading = ref(true)
const errorMsg = ref<string | null>(null)
const visibleCount = ref(20)

/** Corte de conversación: más de 30 min sin mensajes del mismo usuario. */
const GAP_MS = 30 * 60 * 1000

const desdeIso = (): string | null => {
  const ahora = new Date()
  if (rango.value === 'hoy') {
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
    return hoy.toISOString()
  }
  if (rango.value === '7dias') return new Date(ahora.getTime() - 7 * 86_400_000).toISOString()
  if (rango.value === '30dias') return new Date(ahora.getTime() - 30 * 86_400_000).toISOString()
  return null
}

// PostgREST corta los SELECT en 1000 filas: paginamos hasta traer todo el rango
// (mismo patrón que useProspectosMapa).
const cargarMensajes = async (): Promise<MensajeRow[]> => {
  const PAGE = 1000
  const todas: MensajeRow[] = []
  const desdeFecha = desdeIso()
  let desde = 0
  while (true) {
    let query = client
      .from('asistente_mensajes')
      .select('id, user_id, role, texto, error, consultas, sqls, created_at')
    if (desdeFecha) query = query.gte('created_at', desdeFecha)
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(desde, desde + PAGE - 1)
    if (error) throw error
    const lote = (data ?? []) as MensajeRow[]
    todas.push(...lote)
    if (lote.length < PAGE) break
    desde += PAGE
  }
  return todas
}

const cargar = async () => {
  loading.value = true
  errorMsg.value = null
  try {
    const [mensajes, { data: profilesData }] = await Promise.all([
      cargarMensajes(),
      client.from('profiles').select('id, nombre'),
    ])
    filas.value = mensajes
    nombres.value = Object.fromEntries((profilesData ?? []).map((p: any) => [p.id, p.nombre]))
    visibleCount.value = 20
  } catch (err: any) {
    errorMsg.value = err?.message || 'No se pudo cargar el historial'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // La barrera real es la RLS (policy auditor_select); esto es solo UX.
  if (profile.value?.id !== AUDITOR_PROFILE_ID) {
    navigateTo('/dashboard')
    return
  }
  cargar()
})

watch(rango, cargar)
watch(usuarioId, () => {
  visibleCount.value = 20
})

// Agrupar mensajes en conversaciones por usuario, cortando por inactividad
const conversaciones = computed<Conversacion[]>(() => {
  // Orden cronológico; en empate de timestamp (el par se inserta junto), user primero
  const asc = [...filas.value].sort((a, b) => {
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1
    if (a.role !== b.role) return a.role === 'user' ? -1 : 1
    return 0
  })

  const abiertas = new Map<string, Conversacion>()
  const resultado: Conversacion[] = []
  for (const fila of asc) {
    const uid = fila.user_id ?? 'desconocido'
    let conv = abiertas.get(uid)
    const t = new Date(fila.created_at).getTime()
    if (!conv || t - new Date(conv.mensajes[conv.mensajes.length - 1]!.created_at).getTime() > GAP_MS) {
      conv = {
        key: `${uid}-${fila.id}`,
        userId: uid,
        nombre: nombres.value[uid] ?? 'Usuario eliminado',
        inicio: fila.created_at,
        mensajes: [],
        totalConsultas: 0,
        conError: false,
      }
      abiertas.set(uid, conv)
      resultado.push(conv)
    }
    conv.mensajes.push(fila)
    conv.totalConsultas += fila.consultas ?? 0
    if (fila.error) conv.conError = true
  }

  const filtradas = usuarioId.value ? resultado.filter((c) => c.userId === usuarioId.value) : resultado
  return filtradas.sort((a, b) => b.inicio.localeCompare(a.inicio))
})

const usuariosOptions = computed(() => {
  const ids = [...new Set(filas.value.map((f) => f.user_id).filter((x): x is string => !!x))]
  const opciones = ids
    .map((id) => ({ label: nombres.value[id] ?? 'Usuario eliminado', value: id }))
    .sort((a, b) => a.label.localeCompare(b.label))
  return [{ label: 'Todos los usuarios', value: '' }, ...opciones]
})

// Días (más reciente primero) sobre las conversaciones visibles
const diaKeyDe = (iso: string) => new Date(iso).toLocaleDateString('en-CA')

const labelDia = (key: string): string => {
  const hoy = diaKeyDe(new Date().toISOString())
  const ayer = diaKeyDe(new Date(Date.now() - 86_400_000).toISOString())
  if (key === hoy) return 'Hoy'
  if (key === ayer) return 'Ayer'
  const [anio, mes, dia] = key.split('-').map(Number)
  const label = new Date(anio!, mes! - 1, dia!).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const gruposDia = computed(() => {
  const visibles = conversaciones.value.slice(0, visibleCount.value)
  const grupos: { dia: string; label: string; conversaciones: Conversacion[] }[] = []
  for (const conv of visibles) {
    const dia = diaKeyDe(conv.inicio)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.dia === dia) ultimo.conversaciones.push(conv)
    else grupos.push({ dia, label: labelDia(dia), conversaciones: [conv] })
  }
  return grupos
})
</script>

<style scoped>
/* Markdown del asistente — copia del bloque .md-cuerpo de admin/asistente.vue
   (scoped allá; se duplica acá para no tocar la página del chat). */
.md-cuerpo :deep(p) {
  margin: 0 0 0.5rem;
}
.md-cuerpo :deep(p:last-child) {
  margin-bottom: 0;
}
.md-cuerpo :deep(strong) {
  @apply font-semibold text-gray-900 dark:text-white;
}
.md-cuerpo :deep(code) {
  @apply text-[12px] px-1 py-0.5 rounded bg-gray-200/60 text-gray-800 dark:bg-white/10 dark:text-slate-200;
}
.md-cuerpo :deep(pre) {
  @apply my-2 p-3 rounded-lg bg-gray-900 text-slate-100 overflow-x-auto dark:bg-black/40;
}
.md-cuerpo :deep(pre code) {
  @apply bg-transparent p-0 text-[12px] leading-relaxed text-slate-100;
}
.md-cuerpo :deep(ul),
.md-cuerpo :deep(ol) {
  @apply my-1.5 pl-5 space-y-1;
}
.md-cuerpo :deep(ul) {
  list-style: disc;
}
.md-cuerpo :deep(ol) {
  list-style: decimal;
}
.md-cuerpo :deep(h3),
.md-cuerpo :deep(h4),
.md-cuerpo :deep(h5) {
  @apply font-semibold text-gray-900 dark:text-white mt-3 mb-1;
}
.md-cuerpo :deep(h3) {
  font-size: 15px;
}
.md-cuerpo :deep(h4) {
  font-size: 14px;
}
.md-cuerpo :deep(hr) {
  @apply my-3 border-gray-200 dark:border-white/10;
}
.md-cuerpo :deep(.md-tabla) {
  @apply my-2 -mx-1 overflow-x-auto;
}
.md-cuerpo :deep(table) {
  @apply w-full text-[12.5px] border-collapse;
}
.md-cuerpo :deep(th) {
  @apply text-left font-semibold px-2.5 py-1.5 bg-gray-100/80 text-gray-600 dark:bg-white/[0.06] dark:text-slate-300 whitespace-nowrap;
}
.md-cuerpo :deep(th:first-child) {
  border-top-left-radius: 8px;
}
.md-cuerpo :deep(th:last-child) {
  border-top-right-radius: 8px;
}
.md-cuerpo :deep(td) {
  @apply px-2.5 py-1.5 border-t border-gray-200/70 dark:border-white/[0.06] align-top;
}
.md-cuerpo :deep(tbody tr:nth-child(even)) {
  @apply bg-gray-50/60 dark:bg-white/[0.02];
}
</style>
