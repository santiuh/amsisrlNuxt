<template>
  <div class="max-w-3xl mx-auto space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <UButton
        icon="i-heroicons-arrow-left"
        color="gray"
        variant="ghost"
        size="sm"
        @click="volver()"
      />
      <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {{ canEdit ? 'Editar Venta' : 'Detalle de Venta' }}
      </h2>
      <UBadge
        v-if="venta"
        :color="estadoColor(venta.estado)"
        :label="estadoLabel(venta.estado)"
        variant="subtle"
      />
    </div>

    <!-- Cargando -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin" />
    </div>

    <UCard v-else-if="venta">
      <!-- Metadata -->
      <div class="mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/70 rounded-lg text-sm text-gray-600 dark:text-gray-300 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <span class="font-medium">Vendedor:</span> {{ venta.profiles?.nombre ?? '—' }}
        </div>
        <div>
          <span class="font-medium">Fecha de carga:</span> {{ formatFecha(venta.fecha_carga) }}
        </div>
      </div>

      <!-- Formulario editable completo (solo admin) -->
      <VentaForm
        v-if="canEdit"
        :initial-data="venta"
        submit-label="Guardar Cambios"
        :show-cancel="true"
        @submit="actualizar"
        @cancel="volver()"
      />

      <!-- Vista de solo lectura: mismo formato que el formulario de creación -->
      <template v-else>
        <VentaForm :initial-data="venta" readonly />

        <!-- Panel de gestión editable (solo oficinista) -->
        <div v-if="isOficinistra" class="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4 space-y-4">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Gestión</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormGroup label="Estado">
                <USelect v-model="gestionForm.estado" :options="estadoOptions" class="w-full" />
              </UFormGroup>

              <UFormGroup
                v-if="gestionForm.estado === 'coordinado'"
                label="Fecha y horario de coordinación *"
                class="sm:col-span-2"
              >
                <UInput
                  v-model="gestionForm.fecha_coordinacion"
                  type="datetime-local"
                  class="w-full"
                />
              </UFormGroup>
            </div>

            <!-- Historial de gestión -->
            <UFormGroup label="Registro de Gestión" class="sm:col-span-2">
              <div
                v-if="logGestion.length > 0"
                class="mb-3 max-h-52 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800 bg-gray-50 dark:bg-gray-900/70"
              >
                <div v-for="(entry, i) in logGestion" :key="i" class="px-3 py-2 text-sm">
                  <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatFecha(entry.fecha_hora) }}</span>
                    <span class="text-xs font-medium text-gray-600 dark:text-gray-300">{{ entry.autor }}</span>
                    <UBadge
                      v-if="entry.tipo === 'estado'"
                      color="teal"
                      variant="subtle"
                      size="xs"
                      label="Estado"
                    />
                  </div>
                  <p class="text-gray-800 dark:text-gray-100">{{ entry.texto }}</p>
                </div>
              </div>
              <p v-else class="text-xs text-gray-400 dark:text-gray-500 mb-2 italic">Sin registros de gestión aún.</p>

              <UTextarea
                v-model="gestionForm.nuevoComentario"
                placeholder="Agregar comentario de gestión..."
                :rows="2"
                class="w-full"
              />
            </UFormGroup>

            <UAlert
              v-if="gestionError"
              icon="i-heroicons-exclamation-circle"
              color="red"
              variant="soft"
              :title="gestionError"
            />

            <div class="flex justify-end gap-3">
              <UButton label="Cancelar" color="gray" variant="outline" @click="volver()" />
              <UButton label="Guardar Gestión" :loading="savingGestion" @click="guardarGestion" />
            </div>
        </div>

        <!-- Estado en conflicto: banner llamativo + comentarios para vendedor/lider -->
        <div v-else-if="venta.estado === 'en_conflicto'" class="space-y-4 mt-4">
            <!-- Banner de advertencia -->
            <div class="border-2 border-orange-400 bg-orange-50 rounded-xl p-4 flex gap-3">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
              <div class="space-y-1">
                <p class="font-semibold text-orange-800 text-sm">Esta venta tiene un conflicto que requiere tu atención</p>
                <p class="text-orange-700 text-sm">Revisá los comentarios de gestión a continuación. Podés responder o agregar información para que tu venta pueda concretarse.</p>
              </div>
            </div>

            <!-- Log de gestión -->
            <div v-if="logGestion.length > 0" class="space-y-1">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Registro de Gestión</p>
              <div class="border border-orange-200 dark:border-orange-900/60 rounded-lg divide-y divide-orange-100 dark:divide-orange-900/40 bg-orange-50 dark:bg-orange-950/40">
                <div v-for="(entry, i) in logGestion" :key="i" class="px-3 py-2 text-sm">
                  <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatFecha(entry.fecha_hora) }}</span>
                    <span class="text-xs font-medium text-gray-600 dark:text-gray-300">{{ entry.autor }}</span>
                    <UBadge
                      v-if="entry.tipo === 'estado'"
                      color="orange"
                      variant="subtle"
                      size="xs"
                      label="Estado"
                    />
                  </div>
                  <p class="text-gray-800 dark:text-gray-100">{{ entry.texto }}</p>
                </div>
              </div>
            </div>

            <!-- Textarea para responder -->
            <div class="space-y-2">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tu respuesta</p>
              <UTextarea
                v-model="comentarioConflicto"
                placeholder="Escribí tu respuesta o aclaración para resolver el conflicto..."
                :rows="3"
                class="w-full"
              />
              <UAlert
                v-if="conflictoError"
                icon="i-heroicons-exclamation-circle"
                color="red"
                variant="soft"
                :title="conflictoError"
              />
              <div class="flex justify-end gap-3">
                <UButton label="Cancelar" color="gray" variant="outline" @click="volver()" />
                <UButton
                  label="Enviar Respuesta"
                  color="orange"
                  icon="i-heroicons-paper-airplane"
                  :loading="savingConflicto"
                  @click="guardarComentarioConflicto"
                />
              </div>
            </div>
        </div>

        <!-- Registro de gestión read-only (vendedor/lider — otros estados) -->
        <div v-else-if="logGestion.length > 0" class="space-y-1 mt-4">
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Registro de Gestión</p>
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800 bg-gray-50 dark:bg-gray-900/70">
              <div v-for="(entry, i) in logGestion" :key="i" class="px-3 py-2 text-sm">
                <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatFecha(entry.fecha_hora) }}</span>
                  <span class="text-xs font-medium text-gray-600 dark:text-gray-300">{{ entry.autor }}</span>
                  <UBadge
                    v-if="entry.tipo === 'estado'"
                    color="teal"
                    variant="subtle"
                    size="xs"
                    label="Estado"
                  />
                </div>
                <p class="text-gray-800 dark:text-gray-100">{{ entry.texto }}</p>
              </div>
            </div>
        </div>
      </template>
    </UCard>

    <UAlert
      v-else
      icon="i-heroicons-exclamation-triangle"
      color="red"
      title="Venta no encontrada"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const client = useSupabaseClient()
const profile = useCurrentProfile()
const toast = useToast()
const loading = ref(true)
const venta = ref<any>(null)

// Solo admin puede editar todos los campos
const canEdit = computed(() => profile.value?.rol === 'admin')
// Oficinista tiene su propio panel de gestión
const isOficinistra = computed(() => profile.value?.rol === 'oficinista')

// Estado reactivo para el panel de gestión del oficinista
const gestionForm = reactive({
  estado: 'pendiente',
  fecha_coordinacion: '',
  nuevoComentario: '',
})
const savingGestion = ref(false)
const gestionError = ref('')

// Para comentarios de vendedor/lider en estado en_conflicto
const comentarioConflicto = ref('')
const savingConflicto = ref(false)
const conflictoError = ref('')

const estadoOptions = [
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'En Proceso', value: 'en_proceso' },
  { label: 'En Conflicto', value: 'en_conflicto' },
  { label: 'Rechazado', value: 'rechazado' },
  { label: 'Coordinado', value: 'coordinado' },
  { label: 'Concretado', value: 'concretado' },
]

onMounted(async () => {
  const { data } = await client
    .from('ventas')
    .select('*, profiles:vendedor_id(nombre, rol), venta_extras(extra_id, precio_snapshot, extras(nombre))')
    .eq('id', route.params.id as string)
    .single()
  venta.value = data
  loading.value = false

  if (data) {
    gestionForm.estado = data.estado ?? 'pendiente'
    gestionForm.fecha_coordinacion = data.fecha_coordinacion
      ? new Date(data.fecha_coordinacion).toISOString().slice(0, 16)
      : ''
    // Marcar venta como leída para este usuario
    await client.rpc('marcar_venta_leida', { p_venta_id: route.params.id as string })
  }
})

// Navegar de vuelta marcando como leída (asegura timestamp actualizado)
const volver = async () => {
  await client.rpc('marcar_venta_leida', { p_venta_id: route.params.id as string })
  await navigateTo('/ventas')
}

// Guardar gestión (solo oficinista: estado, fecha_coordinacion, comentarios_gestion)
const guardarGestion = async () => {
  gestionError.value = ''

  if (gestionForm.estado === 'coordinado' && !gestionForm.fecha_coordinacion) {
    gestionError.value = 'Debés ingresar la fecha y horario de coordinación.'
    return
  }

  savingGestion.value = true

  const autor = profile.value?.nombre ?? 'Sistema'
  const ahora = new Date().toISOString()
  const logActual: any[] = Array.isArray(venta.value?.comentarios_gestion)
    ? venta.value.comentarios_gestion
    : []
  const nuevasEntradas: any[] = []

  if (gestionForm.estado !== venta.value?.estado) {
    nuevasEntradas.push({
      fecha_hora: ahora,
      autor,
      tipo: 'estado',
      texto: `Estado cambiado de "${estadoLabel(venta.value?.estado)}" a "${estadoLabel(gestionForm.estado)}"`,
    })
  }

  if (gestionForm.nuevoComentario.trim()) {
    nuevasEntradas.push({
      fecha_hora: ahora,
      autor,
      tipo: 'comentario',
      texto: gestionForm.nuevoComentario.trim(),
    })
  }

  const payload: Record<string, any> = {
    estado: gestionForm.estado,
    fecha_coordinacion: gestionForm.estado === 'coordinado'
      ? gestionForm.fecha_coordinacion || null
      : null,
    comentarios_gestion: [...nuevasEntradas, ...logActual],
  }

  const { error } = await client
    .from('ventas')
    .update(payload)
    .eq('id', route.params.id as string)

  if (error) {
    gestionError.value = error.message
    savingGestion.value = false
    return
  }

  toast.add({ title: 'Gestión guardada', color: 'green' })
  await volver()
}

// Guardar comentario de vendedor/lider en estado en_conflicto
const guardarComentarioConflicto = async () => {
  conflictoError.value = ''
  if (!comentarioConflicto.value.trim()) {
    conflictoError.value = 'Escribí un comentario antes de enviar.'
    return
  }
  savingConflicto.value = true

  const { error } = await client.rpc('vendedor_add_gestion_comment', {
    p_venta_id: route.params.id as string,
    p_texto: comentarioConflicto.value.trim(),
  })

  savingConflicto.value = false
  if (error) {
    conflictoError.value = error.message
    return
  }

  toast.add({ title: 'Respuesta enviada', color: 'green' })
  await volver()
}

// Guardar edición completa (solo admin)
const actualizar = async (data: Record<string, any>) => {
  const { _extras, extras_ids, profiles, venta_extras, ...ventaData } = data

  const { error } = await client
    .from('ventas')
    .update(ventaData)
    .eq('id', route.params.id as string)

  if (error) {
    toast.add({ title: 'Error al guardar', description: error.message, color: 'red' })
    return
  }

  if (_extras !== undefined) {
    await client.from('venta_extras').delete().eq('venta_id', route.params.id as string)
    if ((_extras as any[]).length > 0) {
      await client.from('venta_extras').insert(
        (_extras as any[]).map((e: any) => ({
          venta_id: route.params.id as string,
          extra_id: e.id,
          precio_snapshot: e.precio,
        }))
      )
    }
  }

  toast.add({ title: 'Venta actualizada', color: 'green' })
  await volver()
}

const estadoLabel = (e: string) => ({
  pendiente: 'Pendiente', en_proceso: 'En Proceso', en_conflicto: 'En Conflicto',
  rechazado: 'Rechazado', coordinado: 'Coordinado', concretado: 'Concretado',
}[e] ?? e)

const estadoColor = (e: string): any => ({
  pendiente: 'gray', en_proceso: 'yellow', en_conflicto: 'orange',
  rechazado: 'red', coordinado: 'teal', concretado: 'blue',
}[e] ?? 'gray')

const formatFecha = (f: string) =>
  new Date(f).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const logGestion = computed(() => {
  const log = venta.value?.comentarios_gestion
  return Array.isArray(log) ? log : []
})

useHead({ title: 'Detalle de Venta — AMSI SRL' })
</script>
