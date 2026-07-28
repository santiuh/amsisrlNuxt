<template>
  <div class="h-full flex flex-col max-w-3xl mx-auto">
    <!-- Encabezado de la página -->
    <div class="flex items-center justify-between gap-3 pb-3 shrink-0">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-9 h-9 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center shrink-0">
          <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-emerald-500" />
        </div>
        <div class="min-w-0">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white leading-tight truncate">Asistente IA</h2>
          <p class="text-[11px] text-gray-400 dark:text-slate-500 leading-tight truncate">
            Consultá los datos del sistema en lenguaje natural
          </p>
        </div>
      </div>
      <UButton
        v-if="mensajes.length > 0"
        icon="i-heroicons-arrow-path"
        label="Nueva"
        color="gray"
        variant="outline"
        size="xs"
        class="shrink-0"
        :disabled="pendiente"
        @click="reiniciar"
      />
    </div>

    <!-- Mensajes -->
    <div
      ref="scroller"
      class="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white ring-1 ring-gray-200/60 shadow-soft dark:bg-white/[0.02] dark:ring-white/[0.06] px-3 sm:px-5 py-4 scroll-smooth"
    >
      <!-- Estado vacío -->
      <div v-if="mensajes.length === 0" class="h-full flex flex-col items-center justify-center text-center gap-4 py-6">
        <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center">
          <UIcon name="i-heroicons-sparkles" class="w-7 h-7 text-emerald-500" />
        </div>
        <div class="max-w-sm">
          <p class="text-sm font-semibold text-gray-700 dark:text-slate-200">¿Qué querés saber?</p>
          <p class="text-[13px] text-gray-400 dark:text-slate-500 mt-1">
            Pregunta en criollo y consulto ventas, comisiones, vendedores, prospectos y más — sin molestar a las chicas de la oficina.
          </p>
        </div>
        <div class="flex flex-wrap justify-center gap-2 max-w-md">
          <button
            v-for="s in sugerencias"
            :key="s"
            type="button"
            class="px-3 py-1.5 rounded-full text-[12px] font-medium bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-200 transition-colors dark:bg-white/[0.03] dark:text-slate-300 dark:ring-white/[0.08] dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300 dark:hover:ring-emerald-500/30"
            @click="enviar(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <!-- Conversación -->
      <div v-else class="space-y-4">
        <div v-for="(m, idx) in mensajes" :key="idx" class="flex" :class="m.role === 'user' ? 'justify-end' : 'justify-start'">
          <!-- Usuario -->
          <div
            v-if="m.role === 'user'"
            class="max-w-[85%] rounded-2xl rounded-br-md bg-emerald-600 text-white px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words shadow-soft"
          >{{ m.text }}</div>

          <!-- Asistente -->
          <div v-else class="max-w-[95%] sm:max-w-[88%] flex gap-2.5">
            <div class="w-7 h-7 rounded-lg shrink-0 mt-0.5 flex items-center justify-center" :class="m.error ? 'bg-rose-500/10 ring-1 ring-rose-500/20' : 'bg-emerald-500/10 ring-1 ring-emerald-500/20'">
              <UIcon :name="m.error ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-sparkles'" class="w-4 h-4" :class="m.error ? 'text-rose-500' : 'text-emerald-500'" />
            </div>
            <div
              class="min-w-0 rounded-2xl rounded-bl-md px-4 py-3 text-[13.5px] leading-relaxed"
              :class="m.error
                ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20'
                : 'bg-gray-50 text-gray-800 ring-1 ring-gray-200/70 dark:bg-white/[0.04] dark:text-slate-200 dark:ring-white/[0.06]'"
            >
              <!-- eslint-disable-next-line vue/no-v-html — HTML generado por renderMarkdownLite, que escapa todo el texto -->
              <div class="md-cuerpo" v-html="renderMarkdownLite(m.text)" />
            </div>
          </div>
        </div>

        <!-- Pensando… -->
        <div v-if="pendiente" class="flex gap-2.5">
          <div class="w-7 h-7 rounded-lg shrink-0 mt-0.5 bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-emerald-500 animate-pulse" />
          </div>
          <div class="rounded-2xl rounded-bl-md bg-gray-50 ring-1 ring-gray-200/70 dark:bg-white/[0.04] dark:ring-white/[0.06] px-4 py-3 flex items-center gap-2">
            <span class="flex gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500/70 animate-bounce" style="animation-delay: 0ms" />
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500/70 animate-bounce" style="animation-delay: 150ms" />
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500/70 animate-bounce" style="animation-delay: 300ms" />
            </span>
            <span class="text-[12px] text-gray-400 dark:text-slate-500">Consultando los datos…</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Composer -->
    <form class="shrink-0 pt-3" @submit.prevent="enviar()">
      <div class="flex items-end gap-2">
        <UTextarea
          v-model="borrador"
          :rows="1"
          autoresize
          :maxrows="5"
          placeholder="Ej: ¿cuántas ventas se concretaron este mes?"
          class="flex-1"
          :disabled="pendiente"
          @keydown.enter.exact.prevent="enviar()"
        />
        <UButton
          type="submit"
          icon="i-heroicons-paper-airplane"
          :loading="pendiente"
          :disabled="!borrador.trim() && !pendiente"
          class="shrink-0"
          square
          size="lg"
        />
      </div>
      <p class="text-[11px] text-gray-400 dark:text-slate-600 mt-1.5 px-1">
        El asistente consulta la base en tiempo real y puede equivocarse: verificá los datos importantes.
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['role'] })
useHead({ title: 'Asistente IA — AMSI SRL' })

interface MensajeChat {
  role: 'user' | 'assistant'
  text: string
  error?: boolean
}

const STORAGE_KEY = 'amsi-asistente-chat'
const MAX_HISTORIAL = 30

const mensajes = ref<MensajeChat[]>([])
const borrador = ref('')
const pendiente = ref(false)
const scroller = ref<HTMLElement | null>(null)

const sugerencias = [
  '¿Cuántas ventas se cargaron este mes?',
  'Top 5 vendedores por concretadas este mes',
  '¿Cuánto se generó en el ciclo activo de Express?',
  'Ventas en conflicto sin resolver',
  '¿Qué comisiones quedan sin pagar?',
]

const scrollAbajo = async (suave = true) => {
  await nextTick()
  scroller.value?.scrollTo({ top: scroller.value.scrollHeight, behavior: suave ? 'smooth' : 'auto' })
}

const enviar = async (texto?: string) => {
  const contenido = (texto ?? borrador.value).trim()
  if (!contenido || pendiente.value) return
  borrador.value = ''
  mensajes.value.push({ role: 'user', text: contenido })
  pendiente.value = true
  scrollAbajo()

  try {
    // Solo mensajes "sanos" al historial que ve el modelo (sin errores locales)
    const historial = mensajes.value
      .filter((m) => !m.error)
      .slice(-16)
      .map(({ role, text }) => ({ role, text }))
    const res = await $fetch<{ ok: true; reply: string }>('/api/asistente/chat', {
      method: 'POST',
      body: { messages: historial },
    })
    mensajes.value.push({ role: 'assistant', text: res.reply })
  } catch (err) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    const detalle = e?.data?.statusMessage || e?.statusMessage || 'No pude procesar la consulta.'
    mensajes.value.push({ role: 'assistant', text: `${detalle} Probá de nuevo en un momento.`, error: true })
  } finally {
    pendiente.value = false
    scrollAbajo()
  }
}

const reiniciar = () => {
  mensajes.value = []
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* sin storage no pasa nada */
  }
}

onMounted(() => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const datos = JSON.parse(raw) as MensajeChat[]
      if (Array.isArray(datos)) mensajes.value = datos.slice(-MAX_HISTORIAL)
    }
  } catch {
    /* historial corrupto: se arranca de cero */
  }
  if (mensajes.value.length > 0) scrollAbajo(false)
})

watch(
  mensajes,
  (v) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(v.slice(-MAX_HISTORIAL)))
    } catch {
      /* storage lleno o bloqueado: el chat sigue en memoria */
    }
  },
  { deep: true },
)
</script>

<style scoped>
/* Markdown del asistente (HTML seguro generado por renderMarkdownLite) */
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
