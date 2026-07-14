<template>
  <UModal v-model="abierto" :ui="{ width: 'sm:max-w-md' }">
    <div class="p-4 sm:p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-[15px] font-bold text-gray-900 dark:text-white">
          Cargar prospecto
        </h3>
        <span
          v-if="coords"
          class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-300"
        >
          <UIcon name="i-heroicons-map-pin" class="w-3.5 h-3.5" />
          Ubicación marcada
        </span>
        <span v-else class="text-[11px] font-medium text-amber-600 dark:text-amber-300">
          Sin ubicación
        </span>
      </div>

      <div class="space-y-3">
        <!-- Estado inicial -->
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5">
            ¿Qué pasó?
          </p>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="opcion in OPCIONES_ESTADO"
              :key="opcion.estado"
              type="button"
              class="px-2 py-2 rounded-xl text-[12px] font-semibold ring-1 ring-inset transition-colors text-left flex items-center gap-1.5"
              :class="form.estado === opcion.estado
                ? prospectoEstadoPill(opcion.estado) + ' ring-2'
                : 'bg-white text-gray-500 ring-gray-200 hover:bg-gray-50 dark:bg-white/[0.04] dark:text-slate-400 dark:ring-white/10'"
              @click="form.estado = opcion.estado"
            >
              <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: prospectoPinColor(opcion.estado) }" />
              {{ opcion.label }}
            </button>
          </div>
        </div>

        <UInput v-model="form.nombre" placeholder="Nombre (opcional)" size="sm" icon="i-heroicons-user" />
        <UInput v-model="form.telefono" placeholder="Teléfono (opcional)" size="sm" icon="i-heroicons-phone" inputmode="tel" />

        <div class="grid grid-cols-2 gap-2">
          <UInput v-model="form.dir_calle" placeholder="Calle y número" size="sm" />
          <UInput v-model="form.dir_localidad" placeholder="Localidad" size="sm" list="localidades-quickadd" />
          <datalist id="localidades-quickadd">
            <option v-for="l in localidades" :key="l" :value="l" />
          </datalist>
        </div>

        <USelect v-model="form.canal" :options="opcionesCanal" size="sm" />

        <UInput
          v-if="form.estado === 'perdido'"
          v-model="form.motivo_perdida"
          placeholder="Motivo (obligatorio si perdido)"
          size="sm"
          list="motivos-quickadd"
          icon="i-heroicons-x-circle"
        />
        <datalist id="motivos-quickadd">
          <option v-for="m in MOTIVOS_PERDIDA" :key="m" :value="m" />
        </datalist>

        <UTextarea v-model="form.notas" placeholder="Notas (opcional)" :rows="2" size="sm" />

        <!-- Próxima visita: atajos -->
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5">
            Volver a pasar
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
          :label="guardando ? 'Guardando…' : 'Guardar'"
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
const props = defineProps<{
  modelValue: boolean
  coords: { lat: number; lng: number } | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved', id: string): void
}>()

const toast = useToast()
const { localidades } = useProspectosMapa()

const abierto = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const OPCIONES_ESTADO = [
  { estado: 'por_visitar', label: 'Anotar para visitar' },
  { estado: 'ausente', label: 'No estaba' },
  { estado: 'visitado', label: 'Visité / hablamos' },
  { estado: 'ofrecido', label: 'Le ofrecí' },
  { estado: 'perdido', label: 'No le interesa' },
  { estado: 'reconectar', label: 'Reconectar' },
]

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

const opcionesCanal = PROSPECTO_CANALES.map(c => ({ label: CANAL_LABELS[c], value: c }))

const formInicial = () => ({
  estado: 'visitado',
  nombre: '',
  telefono: '',
  dir_calle: '',
  dir_localidad: '',
  canal: 'puerta_a_puerta',
  motivo_perdida: '',
  notas: '',
  proxima_visita: '',
})

const form = reactive(formInicial())
const guardando = ref(false)

watch(abierto, (v) => {
  if (v) Object.assign(form, formInicial())
})

const guardar = async () => {
  if (form.estado === 'perdido' && !form.motivo_perdida.trim()) {
    toast.add({ title: 'Indicá el motivo de pérdida', color: 'amber' })
    return
  }
  guardando.value = true
  try {
    const result: any = await $fetch('/api/prospectos', {
      method: 'POST',
      body: {
        ...form,
        motivo_perdida: form.motivo_perdida.trim() || null,
        proxima_visita: form.proxima_visita || null,
        lat: props.coords?.lat ?? null,
        lng: props.coords?.lng ?? null,
      },
    })
    toast.add({ title: 'Prospecto cargado', color: 'green', icon: 'i-heroicons-map-pin' })
    abierto.value = false
    emit('saved', result.id)
  } catch (err: any) {
    toast.add({ title: 'Error al guardar', description: err.data?.statusMessage || err.message, color: 'red' })
  } finally {
    guardando.value = false
  }
}
</script>
