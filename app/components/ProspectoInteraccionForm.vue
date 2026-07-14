<template>
  <UModal v-model="abierto" :ui="{ width: 'sm:max-w-md' }">
    <div class="p-4 sm:p-5">
      <h3 class="text-[15px] font-bold text-gray-900 dark:text-white mb-1">
        Registrar interacción
      </h3>
      <p v-if="prospecto" class="text-[12px] text-gray-500 dark:text-slate-400 mb-3">
        {{ prospecto.nombre || direccionCompleta(prospecto) || 'Prospecto' }}
      </p>

      <div class="space-y-3">
        <!-- Tipo -->
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5">
            Tipo de contacto
          </p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="tipo in INTERACCION_TIPOS"
              :key="tipo"
              type="button"
              class="px-2.5 py-1.5 rounded-full text-[12px] font-semibold ring-1 ring-inset transition-colors"
              :class="form.tipo === tipo
                ? 'bg-cyan-500/10 text-cyan-700 ring-cyan-300 dark:text-cyan-300 dark:ring-cyan-500/40'
                : 'bg-white text-gray-500 ring-gray-200 hover:bg-gray-50 dark:bg-white/[0.04] dark:text-slate-400 dark:ring-white/10'"
              @click="form.tipo = tipo"
            >
              {{ INTERACCION_TIPO_LABELS[tipo] }}
            </button>
          </div>
        </div>

        <!-- Resultado -->
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5">
            Resultado
          </p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="resultado in INTERACCION_RESULTADOS"
              :key="resultado"
              type="button"
              class="px-2.5 py-1.5 rounded-full text-[12px] font-semibold ring-1 ring-inset transition-colors"
              :class="form.resultado === resultado
                ? 'bg-violet-500/10 text-violet-700 ring-violet-300 dark:text-violet-300 dark:ring-violet-500/40'
                : 'bg-white text-gray-500 ring-gray-200 hover:bg-gray-50 dark:bg-white/[0.04] dark:text-slate-400 dark:ring-white/10'"
              @click="form.resultado = form.resultado === resultado ? '' : resultado"
            >
              {{ INTERACCION_RESULTADO_LABELS[resultado] }}
            </button>
          </div>
        </div>

        <!-- Nuevo estado del prospecto -->
        <USelect v-model="form.nuevo_estado" :options="opcionesEstado" size="sm" />

        <UInput
          v-if="form.nuevo_estado === 'perdido'"
          v-model="form.motivo_perdida"
          placeholder="Motivo de pérdida (obligatorio)"
          size="sm"
          list="motivos-interaccion"
          icon="i-heroicons-x-circle"
        />
        <datalist id="motivos-interaccion">
          <option v-for="m in MOTIVOS_PERDIDA" :key="m" :value="m" />
        </datalist>

        <UTextarea v-model="form.comentario" placeholder="Comentario (opcional)" :rows="2" size="sm" />

        <!-- Próxima visita -->
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5">
            Próxima visita
          </p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="atajo in ATAJOS_REVISITA"
              :key="atajo.label"
              type="button"
              class="px-2.5 py-1.5 rounded-full text-[12px] font-semibold ring-1 ring-inset transition-colors"
              :class="form.proxima_visita === atajo.fecha
                ? 'bg-cyan-500/10 text-cyan-700 ring-cyan-300 dark:text-cyan-300 dark:ring-cyan-500/40'
                : 'bg-white text-gray-500 ring-gray-200 hover:bg-gray-50 dark:bg-white/[0.04] dark:text-slate-400 dark:ring-white/10'"
              @click="form.proxima_visita = form.proxima_visita === atajo.fecha ? '' : atajo.fecha"
            >
              {{ atajo.label }}
            </button>
            <input
              v-model="form.proxima_visita"
              type="date"
              class="px-2 py-1 rounded-full text-[12px] font-medium ring-1 ring-inset ring-gray-200 bg-white text-gray-600 dark:bg-white/[0.04] dark:text-slate-300 dark:ring-white/10"
            >
          </div>
        </div>
      </div>

      <div class="mt-4 flex gap-2">
        <UButton color="gray" variant="ghost" label="Cancelar" class="flex-1 justify-center" @click="abierto = false" />
        <UButton
          color="cyan"
          :label="guardando ? 'Guardando…' : 'Registrar'"
          :loading="guardando"
          class="flex-1 justify-center"
          icon="i-heroicons-check"
          @click="guardar"
        />
      </div>
    </div>
  </UModal>
</template>

<script setup lang="ts">
import type { ProspectoRow } from '~/utils/prospectoUI'

const props = defineProps<{
  modelValue: boolean
  prospecto: ProspectoRow | null
  // Atajo desde la sheet: 'ausente' | 'ofrecido' | 'no_interesado' | null
  atajo?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved'): void
}>()

const toast = useToast()

const abierto = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const hoy = new Date()
const fechaMas = (dias: number) => {
  const d = new Date(hoy.getTime() + dias * 86_400_000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const ATAJOS_REVISITA = [
  { label: 'En 1 semana', fecha: fechaMas(7) },
  { label: 'En 15 días', fecha: fechaMas(15) },
  { label: 'En 1 mes', fecha: fechaMas(30) },
]

const opcionesEstado = computed(() => [
  { label: 'Estado: sin cambio', value: '' },
  ...PROSPECTO_ESTADOS.map(e => ({ label: `Estado → ${PROSPECTO_ESTADO_LABELS[e]}`, value: e })),
])

const form = reactive({
  tipo: 'visita',
  resultado: '',
  nuevo_estado: '',
  motivo_perdida: '',
  comentario: '',
  proxima_visita: '',
})

// Preconfigura el form según el atajo elegido en la sheet
watch(abierto, (v) => {
  if (!v) return
  form.tipo = 'visita'
  form.resultado = ''
  form.nuevo_estado = ''
  form.motivo_perdida = ''
  form.comentario = ''
  form.proxima_visita = ''
  if (props.atajo === 'ausente') {
    form.resultado = 'ausente'
    form.nuevo_estado = 'ausente'
  } else if (props.atajo === 'ofrecido') {
    form.resultado = 'interesado'
    form.nuevo_estado = 'ofrecido'
  } else if (props.atajo === 'no_interesado') {
    form.resultado = 'no_interesado'
    form.nuevo_estado = 'perdido'
  }
})

const guardando = ref(false)

const guardar = async () => {
  if (!props.prospecto) return
  if (form.nuevo_estado === 'perdido' && !form.motivo_perdida.trim() && !props.prospecto.motivo_perdida) {
    toast.add({ title: 'Indicá el motivo de pérdida', color: 'amber' })
    return
  }
  guardando.value = true
  try {
    await $fetch('/api/prospectos/interacciones', {
      method: 'POST',
      body: {
        prospecto_id: props.prospecto.id,
        tipo: form.tipo,
        resultado: form.resultado || null,
        nuevo_estado: form.nuevo_estado || null,
        motivo_perdida: form.motivo_perdida.trim() || null,
        comentario: form.comentario.trim() || null,
        proxima_visita: form.proxima_visita || null,
      },
    })
    toast.add({ title: 'Interacción registrada', color: 'green', icon: 'i-heroicons-check-circle' })
    abierto.value = false
    emit('saved')
  } catch (err: any) {
    toast.add({ title: 'Error al registrar', description: err.data?.statusMessage || err.message, color: 'red' })
  } finally {
    guardando.value = false
  }
}
</script>
