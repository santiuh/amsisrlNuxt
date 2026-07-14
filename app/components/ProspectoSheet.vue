<template>
  <Transition name="sheet">
    <div
      v-if="pin"
      class="absolute z-[500] inset-x-0 bottom-0 md:inset-x-auto md:right-3 md:top-3 md:bottom-auto md:w-[380px]"
    >
      <div
        class="bg-white dark:bg-[#0f172a] shadow-[0_-8px_30px_rgba(0,0,0,0.15)] md:shadow-xl rounded-t-2xl md:rounded-2xl ring-1 ring-gray-200/70 dark:ring-white/10 max-h-[70dvh] md:max-h-[calc(100dvh-8rem)] flex flex-col"
      >
        <!-- Handle + cerrar -->
        <div class="shrink-0 flex items-center justify-between px-4 pt-3 pb-1">
          <div class="md:hidden absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 rounded-full bg-gray-300 dark:bg-slate-600" />
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset"
            :class="prospectoEstadoPill(pin.estado)"
          >
            {{ prospectoEstadoLabel(pin.estado) }}
          </span>
          <button
            type="button"
            class="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 dark:hover:text-gray-200 transition-colors"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-4 pb-4 md:pb-4 pb-safe">
          <!-- ══ Variante limitada (prospecto de otro vendedor) ══ -->
          <template v-if="!pin.acceso_completo">
            <div class="flex items-center gap-2 mt-1">
              <UIcon name="i-heroicons-lock-closed" class="w-4 h-4 text-gray-400 shrink-0" />
              <h3 class="text-[15px] font-semibold text-gray-800 dark:text-gray-100">
                Prospecto de {{ pin.vendedor_nombre || 'otro vendedor' }}
              </h3>
            </div>
            <dl class="mt-3 space-y-2 text-[13px]">
              <div class="flex justify-between gap-3">
                <dt class="text-gray-500 dark:text-slate-400">Última visita</dt>
                <dd class="font-medium text-gray-800 dark:text-gray-200">{{ fechaCorta(pin.fecha_ultima_interaccion) || 'Sin visitas' }}</dd>
              </div>
              <div v-if="pin.proxima_visita" class="flex justify-between gap-3">
                <dt class="text-gray-500 dark:text-slate-400">Próxima visita</dt>
                <dd class="font-medium text-gray-800 dark:text-gray-200">{{ fechaCorta(pin.proxima_visita) }}</dd>
              </div>
              <div v-if="pin.localidad" class="flex justify-between gap-3">
                <dt class="text-gray-500 dark:text-slate-400">Localidad</dt>
                <dd class="font-medium text-gray-800 dark:text-gray-200">{{ pin.localidad }}</dd>
              </div>
            </dl>
            <p class="mt-3 text-[12px] text-gray-400 dark:text-slate-500 italic">
              Los datos de contacto solo los ve el vendedor asignado y su líder.
            </p>
          </template>

          <!-- ══ Variante completa ══ -->
          <template v-else>
            <div v-if="cargando" class="py-6 flex justify-center">
              <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
            </div>

            <template v-else-if="prospecto">
              <h3 class="mt-1 text-[16px] font-bold text-gray-900 dark:text-white leading-tight">
                {{ prospecto.nombre || 'Sin nombre' }}
              </h3>
              <p v-if="direccion" class="mt-0.5 text-[13px] text-gray-500 dark:text-slate-400 flex items-start gap-1">
                <UIcon name="i-heroicons-map-pin" class="w-4 h-4 shrink-0 mt-0.5" />
                <span>{{ direccion }}<template v-if="prospecto.dir_aclaracion"> · {{ prospecto.dir_aclaracion }}</template></span>
              </p>
              <p v-if="prospecto.ubicacion_aproximada" class="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-3.5 h-3.5" />
                Ubicación aproximada — reubicala al pasar
              </p>

              <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-500 dark:text-slate-400">
                <span class="inline-flex items-center gap-1">
                  <UIcon :name="CANAL_ICONS[prospecto.canal] ?? 'i-heroicons-question-mark-circle'" class="w-3.5 h-3.5" />
                  {{ canalLabel(prospecto.canal) }}
                </span>
                <span v-if="pin.vendedor_nombre" class="inline-flex items-center gap-1">
                  <UIcon name="i-heroicons-user" class="w-3.5 h-3.5" />
                  {{ pin.vendedor_nombre }}
                </span>
                <span v-if="prospecto.fecha_ultima_interaccion" class="inline-flex items-center gap-1">
                  <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
                  {{ fechaCorta(prospecto.fecha_ultima_interaccion) }}
                </span>
              </div>

              <div
                v-if="prospecto.proxima_visita"
                class="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[12px] font-medium"
                :class="proximaVencida
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                  : 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300'"
              >
                <UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
                {{ proximaVencida ? 'Revisita vencida' : 'Revisitar' }}: {{ fechaCorta(prospecto.proxima_visita) }}
              </div>

              <p v-if="prospecto.estado === 'perdido' && prospecto.motivo_perdida" class="mt-2 text-[13px] text-rose-600 dark:text-rose-300">
                <span class="font-semibold">Motivo:</span> {{ prospecto.motivo_perdida }}
              </p>

              <p v-if="prospecto.notas" class="mt-2 text-[13px] text-gray-600 dark:text-slate-300 whitespace-pre-line bg-gray-50 dark:bg-white/[0.03] rounded-lg px-3 py-2">
                {{ prospecto.notas }}
              </p>

              <!-- Acciones rápidas de contacto -->
              <div v-if="prospecto.telefono" class="mt-3 grid grid-cols-2 gap-2">
                <a
                  :href="`tel:${prospecto.telefono}`"
                  class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  <UIcon name="i-heroicons-phone" class="w-4 h-4" />
                  Llamar
                </a>
                <a
                  :href="whatsappUrl"
                  target="_blank"
                  rel="noopener"
                  class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 transition-colors"
                >
                  <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-4 h-4" />
                  WhatsApp
                </a>
              </div>

              <!-- Registrar resultado en 2 taps -->
              <div class="mt-3">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5">
                  Registrar visita
                </p>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    class="px-2 py-2 rounded-xl text-[12px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 transition-colors"
                    @click="emit('interaccion', prospecto, 'ausente')"
                  >
                    No estaba
                  </button>
                  <button
                    type="button"
                    class="px-2 py-2 rounded-xl text-[12px] font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-300 transition-colors"
                    @click="emit('interaccion', prospecto, 'ofrecido')"
                  >
                    Ofrecí
                  </button>
                  <button
                    type="button"
                    class="px-2 py-2 rounded-xl text-[12px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 transition-colors"
                    @click="emit('interaccion', prospecto, 'no_interesado')"
                  >
                    No le interesa
                  </button>
                </div>
                <button
                  type="button"
                  class="mt-2 w-full px-3 py-2 rounded-xl text-[13px] font-semibold bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/20 dark:text-cyan-300 transition-colors flex items-center justify-center gap-1.5"
                  @click="emit('interaccion', prospecto, null)"
                >
                  <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                  Otra interacción / cambiar estado
                </button>
              </div>

              <!-- Navegación -->
              <div class="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold ring-1 ring-inset ring-gray-200 text-gray-700 hover:bg-gray-50 dark:ring-white/10 dark:text-gray-200 dark:hover:bg-white/5 transition-colors"
                  @click="emit('reubicar', prospecto)"
                >
                  <UIcon name="i-heroicons-cursor-arrow-rays" class="w-4 h-4" />
                  Reubicar pin
                </button>
                <NuxtLink
                  :to="`/prospectos/${prospecto.id}`"
                  class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold ring-1 ring-inset ring-gray-200 text-gray-700 hover:bg-gray-50 dark:ring-white/10 dark:text-gray-200 dark:hover:bg-white/5 transition-colors"
                >
                  <UIcon name="i-heroicons-identification" class="w-4 h-4" />
                  Ver ficha
                </NuxtLink>
                <button
                  v-if="prospecto.estado !== 'contratado'"
                  type="button"
                  class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow hover:opacity-90 transition-opacity"
                  @click="emit('crear-venta', prospecto)"
                >
                  <UIcon name="i-heroicons-banknotes" class="w-4 h-4" />
                  Crear venta
                </button>
                <NuxtLink
                  v-else-if="prospecto.venta_id"
                  :to="`/ventas/${prospecto.venta_id}`"
                  class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  <UIcon name="i-heroicons-check-badge" class="w-4 h-4" />
                  Ver venta
                </NuxtLink>
              </div>
            </template>

            <p v-else class="py-4 text-center text-[13px] text-gray-400">
              No se pudo cargar el prospecto
            </p>
          </template>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { ProspectoPin, ProspectoRow } from '~/utils/prospectoUI'
import { normalizePhone } from '~/utils/whatsapp'

const props = defineProps<{
  pin: ProspectoPin | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'interaccion', prospecto: ProspectoRow, atajo: string | null): void
  (e: 'crear-venta', prospecto: ProspectoRow): void
  (e: 'reubicar', prospecto: ProspectoRow): void
}>()

const client = useSupabaseClient()
const prospecto = ref<ProspectoRow | null>(null)
const cargando = ref(false)

const cargarProspecto = async () => {
  prospecto.value = null
  if (!props.pin?.acceso_completo) return
  cargando.value = true
  const { data } = await client
    .from('prospectos')
    .select('*')
    .eq('id', props.pin.id)
    .maybeSingle()
  prospecto.value = (data as ProspectoRow | null)
  cargando.value = false
}

watch(() => props.pin?.id, cargarProspecto, { immediate: true })

const direccion = computed(() => prospecto.value ? direccionCompleta(prospecto.value) : '')

const whatsappUrl = computed(() => {
  const tel = normalizePhone(prospecto.value?.telefono)
  if (!tel) return ''
  const nombre = prospecto.value?.nombre || ''
  const texto = encodeURIComponent(`Hola${nombre ? ` ${nombre}` : ''}, ¿cómo estás? Te escribo por el servicio de internet que estuvimos conversando.`)
  return `https://wa.me/${tel}?text=${texto}`
})

const hoyISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const proximaVencida = computed(() =>
  !!prospecto.value?.proxima_visita && prospecto.value.proxima_visita <= hoyISO(),
)

const fechaCorta = (iso: string | null | undefined): string => {
  if (!iso) return ''
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// Refrescar la ficha si el padre registró una interacción
defineExpose({ recargar: cargarProspecto })
</script>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(24px);
  opacity: 0;
}
.pb-safe {
  padding-bottom: calc(env(safe-area-inset-bottom) + 84px);
}
@media (min-width: 768px) {
  .pb-safe {
    padding-bottom: 1rem;
  }
}
</style>
