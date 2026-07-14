<template>
  <UModal v-model="abierto" :ui="{ width: 'sm:max-w-md' }">
    <div class="p-4 sm:p-5">
      <h3 class="text-[15px] font-bold text-gray-900 dark:text-white mb-3">
        Editar prospecto
      </h3>

      <div class="space-y-3">
        <UInput v-model="form.nombre" placeholder="Nombre" size="sm" icon="i-heroicons-user" />
        <UInput v-model="form.telefono" placeholder="Teléfono" size="sm" icon="i-heroicons-phone" inputmode="tel" />
        <USelect v-model="form.canal" :options="opcionesCanal" size="sm" />

        <div class="grid grid-cols-2 gap-2">
          <UInput v-model="form.dir_calle" placeholder="Calle y número" size="sm" />
          <UInput v-model="form.dir_entre_calles" placeholder="Entre calles" size="sm" />
          <UInput v-model="form.dir_localidad" placeholder="Localidad" size="sm" list="localidades-form" />
          <UInput v-model="form.dir_aclaracion" placeholder="Aclaración (piso, timbre…)" size="sm" />
          <datalist id="localidades-form">
            <option v-for="l in localidades" :key="l" :value="l" />
          </datalist>
        </div>

        <USelect v-model="form.estado" :options="opcionesEstado" size="sm" />

        <UInput
          v-if="form.estado === 'perdido'"
          v-model="form.motivo_perdida"
          placeholder="Motivo de pérdida (obligatorio)"
          size="sm"
          list="motivos-form"
          icon="i-heroicons-x-circle"
        />
        <datalist id="motivos-form">
          <option v-for="m in MOTIVOS_PERDIDA" :key="m" :value="m" />
        </datalist>

        <UTextarea v-model="form.notas" placeholder="Notas" :rows="3" size="sm" />

        <div class="flex items-center gap-2">
          <label class="text-[12px] font-medium text-gray-500 dark:text-slate-400 shrink-0">Próxima visita</label>
          <input
            v-model="form.proxima_visita"
            type="date"
            class="flex-1 px-2.5 py-1.5 rounded-lg text-[13px] ring-1 ring-inset ring-gray-200 bg-white text-gray-700 dark:bg-white/[0.04] dark:text-slate-200 dark:ring-white/10"
          >
          <UButton
            v-if="form.proxima_visita"
            size="2xs"
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            aria-label="Quitar próxima visita"
            @click="form.proxima_visita = ''"
          />
        </div>

        <!-- Reasignar vendedor (solo staff) -->
        <USelect
          v-if="esStaff && opcionesVendedor.length > 1"
          v-model="form.vendedor_id"
          :options="opcionesVendedor"
          size="sm"
        />
      </div>

      <div class="mt-4 flex gap-2">
        <UButton color="gray" variant="ghost" label="Cancelar" class="flex-1 justify-center" @click="abierto = false" />
        <UButton
          color="cyan"
          :label="guardando ? 'Guardando…' : 'Guardar cambios'"
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
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved'): void
}>()

const toast = useToast()
const profile = useCurrentProfile()
const client = useSupabaseClient()
const { localidades } = useProspectosMapa()

const abierto = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const esStaff = computed(() => ['admin', 'oficinista'].includes(profile.value?.rol ?? ''))

const opcionesCanal = PROSPECTO_CANALES.map(c => ({ label: `Canal: ${CANAL_LABELS[c]}`, value: c }))
const opcionesEstado = PROSPECTO_ESTADOS.map(e => ({ label: `Estado: ${PROSPECTO_ESTADO_LABELS[e]}`, value: e }))

const opcionesVendedor = ref<Array<{ label: string; value: string }>>([])

const form = reactive({
  nombre: '',
  telefono: '',
  canal: 'puerta_a_puerta',
  estado: 'por_visitar',
  motivo_perdida: '',
  dir_calle: '',
  dir_entre_calles: '',
  dir_localidad: '',
  dir_aclaracion: '',
  notas: '',
  proxima_visita: '',
  vendedor_id: '',
})

watch(abierto, async (v) => {
  if (!v || !props.prospecto) return
  const p = props.prospecto
  form.nombre = p.nombre ?? ''
  form.telefono = p.telefono ?? ''
  form.canal = p.canal
  form.estado = p.estado
  form.motivo_perdida = p.motivo_perdida ?? ''
  form.dir_calle = p.dir_calle ?? ''
  form.dir_entre_calles = p.dir_entre_calles ?? ''
  form.dir_localidad = p.dir_localidad ?? ''
  form.dir_aclaracion = p.dir_aclaracion ?? ''
  form.notas = p.notas ?? ''
  form.proxima_visita = p.proxima_visita ?? ''
  form.vendedor_id = p.vendedor_id

  if (esStaff.value && opcionesVendedor.value.length === 0) {
    const { data } = await client
      .from('profiles')
      .select('id, nombre, rol')
      .in('rol', ['vendedor', 'lider'])
      .order('nombre')
    opcionesVendedor.value = (data ?? []).map((u: any) => ({
      label: `Vendedor: ${u.nombre}`,
      value: u.id,
    }))
  }
})

const guardando = ref(false)

const guardar = async () => {
  if (!props.prospecto) return
  if (form.estado === 'perdido' && !form.motivo_perdida.trim()) {
    toast.add({ title: 'Indicá el motivo de pérdida', color: 'amber' })
    return
  }
  guardando.value = true
  try {
    await $fetch(`/api/prospectos/${props.prospecto.id}`, {
      method: 'PUT',
      body: {
        nombre: form.nombre.trim() || null,
        telefono: form.telefono.trim() || null,
        canal: form.canal,
        estado: form.estado,
        motivo_perdida: form.motivo_perdida.trim() || null,
        dir_calle: form.dir_calle.trim() || null,
        dir_entre_calles: form.dir_entre_calles.trim() || null,
        dir_localidad: form.dir_localidad.trim() || null,
        dir_aclaracion: form.dir_aclaracion.trim() || null,
        notas: form.notas.trim() || null,
        proxima_visita: form.proxima_visita || null,
        ...(esStaff.value && form.vendedor_id !== props.prospecto.vendedor_id
          ? { vendedor_id: form.vendedor_id }
          : {}),
      },
    })
    toast.add({ title: 'Prospecto actualizado', color: 'green', icon: 'i-heroicons-check-circle' })
    abierto.value = false
    emit('saved')
  } catch (err: any) {
    toast.add({ title: 'Error al guardar', description: err.data?.statusMessage || err.message, color: 'red' })
  } finally {
    guardando.value = false
  }
}
</script>
