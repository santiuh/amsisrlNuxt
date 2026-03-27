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
      <div class="ml-auto">
        <UButton
          v-if="canEdit && venta"
          icon="i-heroicons-trash"
          color="red"
          variant="ghost"
          size="sm"
          label="Eliminar"
          @click="confirmarEliminar = true"
        />
      </div>
    </div>

    <!-- Modal de confirmación de borrado -->
    <UModal v-model="confirmarEliminar">
      <UCard>
        <template #header>
          <p class="font-semibold text-gray-800 dark:text-gray-100">Eliminar venta</p>
        </template>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          ¿Seguro que querés eliminar la venta de <span class="font-semibold">{{ venta?.cliente }}</span>? Esta acción no se puede deshacer.
        </p>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="gray" variant="outline" @click="confirmarEliminar = false" />
            <UButton label="Eliminar" color="red" :loading="eliminando" @click="eliminarVenta" />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Cargando -->
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin" />
    </div>

    <UCard v-else-if="venta">
      <!-- Metadata -->
      <div class="mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/70 rounded-lg text-sm text-gray-600 dark:text-gray-300 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <span class="font-medium">Vendedor:</span>
          <div class="inline-flex items-center gap-2 ml-1 align-middle">
            <UserAvatar v-if="venta.profiles?.nombre" :seed="venta.profiles.nombre" class="w-5 h-5 rounded-full overflow-hidden shrink-0" />
            <span>{{ venta.profiles?.nombre ?? '—' }}</span>
          </div>
        </div>
        <div>
          <span class="font-medium">Fecha de carga:</span> {{ formatFecha(venta.fecha_carga) }}
        </div>
        <div v-if="venta.nro_cliente">
          <span class="font-medium">Nro. de Cliente:</span> {{ venta.nro_cliente }}
        </div>
      </div>

      <!-- Formulario editable completo (solo admin) -->
      <VentaForm
        v-if="canEdit"
        :initial-data="venta"
        submit-label="Guardar Cambios"
        :show-cancel="true"
        :on-submit="actualizar"
        @cancel="volver()"
      />

      <!-- Observaciones (admin) -->
      <div v-if="canEdit" class="border-t border-gray-200 dark:border-gray-800 pt-4 mt-6 space-y-4">
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">Observaciones</p>
        <div
          v-if="logGestion.length > 0"
          class="max-h-52 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800 bg-gray-50 dark:bg-gray-900/70"
        >
          <div v-for="(entry, i) in logGestion" :key="i" class="px-3 py-2 text-sm">
            <div class="flex items-center gap-2 mb-0.5 flex-wrap">
              <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatFecha(entry.fecha_hora) }}</span>
              <div class="flex items-center gap-1.5">
                <UserAvatar :seed="entry.autor" class="w-4 h-4 rounded-full overflow-hidden shrink-0" />
                <span class="text-xs font-medium text-gray-600 dark:text-gray-300">{{ entry.autor }}</span>
              </div>
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
        <p v-else class="text-xs text-gray-400 dark:text-gray-500 italic">Sin observaciones aún.</p>
        <div class="space-y-2">
          <UTextarea
            v-model="comentarioConflicto"
            placeholder="Agregar observación..."
            :rows="2"
            class="w-full"
          />
          <UAlert
            v-if="conflictoError"
            icon="i-heroicons-exclamation-circle"
            color="red"
            variant="soft"
            :title="conflictoError"
          />
          <div class="flex justify-end">
            <UButton
              label="Agregar Observación"
              icon="i-heroicons-paper-airplane"
              :loading="savingConflicto"
              @click="guardarComentarioConflicto"
            />
          </div>
        </div>
      </div>

      <!-- Vista de solo lectura: mismo formato que el formulario de creación -->
      <template v-else>
        <VentaForm :initial-data="venta" :hide-gestion-fields="isOficinistra" readonly />

        <!-- Panel de gestión editable (solo oficinista) -->
        <div v-if="isOficinistra" class="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4 space-y-4">

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormGroup label="Estado">
                <USelect v-model="gestionForm.estado" :options="estadoOptions" class="w-full" />
              </UFormGroup>

              <UFormGroup label="Número de Cliente">
                <UInput
                  v-model="gestionForm.nro_cliente"
                  placeholder="Ej: 123456"
                  class="w-full"
                />
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
                    <div class="flex items-center gap-1.5">
                      <UserAvatar :seed="entry.autor" class="w-4 h-4 rounded-full overflow-hidden shrink-0" />
                      <span class="text-xs font-medium text-gray-600 dark:text-gray-300">{{ entry.autor }}</span>
                    </div>
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

        <!-- Observaciones (vendedor/lider — siempre visible) -->
        <div v-else class="space-y-4 mt-4">
            <!-- Banner solo si en_conflicto -->
            <div v-if="venta.estado === 'en_conflicto'" class="border-2 border-orange-400 bg-orange-50 rounded-xl p-4 flex gap-3">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
              <div class="space-y-1">
                <p class="font-semibold text-orange-800 text-sm">Esta venta tiene un conflicto que requiere tu atención</p>
                <p class="text-orange-700 text-sm">Revisá los comentarios de gestión a continuación. Podés responder o agregar información para que tu venta pueda concretarse.</p>
              </div>
            </div>

            <!-- Log de gestión -->
            <div v-if="logGestion.length > 0" class="space-y-1">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Registro de Gestión</p>
              <div
                :class="venta.estado === 'en_conflicto'
                  ? 'border border-orange-200 dark:border-orange-900/60 rounded-lg divide-y divide-orange-100 dark:divide-orange-900/40 bg-orange-50 dark:bg-orange-950/40'
                  : 'border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800 bg-gray-50 dark:bg-gray-900/70'"
              >
                <div v-for="(entry, i) in logGestion" :key="i" class="px-3 py-2 text-sm">
                  <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatFecha(entry.fecha_hora) }}</span>
                    <div class="flex items-center gap-1.5">
                      <UserAvatar :seed="entry.autor" class="w-4 h-4 rounded-full overflow-hidden shrink-0" />
                      <span class="text-xs font-medium text-gray-600 dark:text-gray-300">{{ entry.autor }}</span>
                    </div>
                    <UBadge
                      v-if="entry.tipo === 'estado'"
                      :color="venta.estado === 'en_conflicto' ? 'orange' : 'teal'"
                      variant="subtle"
                      size="xs"
                      label="Estado"
                    />
                  </div>
                  <p class="text-gray-800 dark:text-gray-100">{{ entry.texto }}</p>
                </div>
              </div>
            </div>

            <!-- Textarea para agregar observación -->
            <div class="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Agregar observación</p>
              <UTextarea
                v-model="comentarioConflicto"
                placeholder="Escribí tu observación..."
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
                  label="Agregar Observación"
                  icon="i-heroicons-paper-airplane"
                  :loading="savingConflicto"
                  @click="guardarComentarioConflicto"
                />
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
  nro_cliente: '',
})
const savingGestion = ref(false)
const gestionError = ref('')

// Eliminar venta (solo admin)
const confirmarEliminar = ref(false)
const eliminando = ref(false)

const eliminarVenta = async () => {
  eliminando.value = true
  try {
    await $fetch(`/api/ventas/${route.params.id}`, { method: 'DELETE' })
    toast.add({ title: 'Venta eliminada', color: 'green' })
    await navigateTo('/ventas')
  } catch (err: any) {
    toast.add({ title: 'Error al eliminar', description: err.data?.statusMessage || err.message, color: 'red' })
    confirmarEliminar.value = false
  } finally {
    eliminando.value = false
  }
}

// Para observaciones (todos los roles, en cualquier estado)
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

const cargarVenta = async () => {
  const { data } = await client
    .from('ventas')
    .select('*, profiles:vendedor_id(nombre, rol), venta_extras(extra_id, precio_snapshot, extras(nombre))')
    .eq('id', route.params.id as string)
    .single()
  venta.value = data
  if (data) {
    gestionForm.estado = data.estado ?? 'pendiente'
    gestionForm.fecha_coordinacion = data.fecha_coordinacion
      ? toDatetimeLocalValue(data.fecha_coordinacion)
      : ''
    gestionForm.nro_cliente = data.nro_cliente ?? ''
  }
}

onMounted(async () => {
  await cargarVenta()
  loading.value = false
  if (venta.value) {
    // Marcar venta como leída para este usuario
    await $fetch('/api/ventas/leida', {
      method: 'POST',
      body: { venta_id: route.params.id as string },
    }).catch(() => {})
  }
})

// Navegar de vuelta marcando como leída (asegura timestamp actualizado)
const volver = async () => {
  await $fetch('/api/ventas/leida', {
    method: 'POST',
    body: { venta_id: route.params.id as string },
  }).catch(() => {})
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
      ? datetimeLocalToISO(gestionForm.fecha_coordinacion)
      : null,
    comentarios_gestion: [...nuevasEntradas, ...logActual],
    nro_cliente: gestionForm.nro_cliente || null,
  }

  try {
    await $fetch('/api/ventas/gestion', {
      method: 'PUT',
      body: {
        venta_id: route.params.id as string,
        ...payload,
      },
    })
    toast.add({ title: 'Gestión guardada', color: 'green' })
    await volver()
  } catch (err: any) {
    gestionError.value = err.data?.statusMessage || 'Error al guardar gestión'
  } finally {
    savingGestion.value = false
  }
}

// Guardar observación (todos los roles)
const guardarComentarioConflicto = async () => {
  conflictoError.value = ''
  if (!comentarioConflicto.value.trim()) {
    conflictoError.value = 'Escribí una observación antes de enviar.'
    return
  }
  savingConflicto.value = true

  try {
    await $fetch('/api/ventas/comentario', {
      method: 'POST',
      body: {
        venta_id: route.params.id as string,
        texto: comentarioConflicto.value.trim(),
      },
    })
    toast.add({ title: 'Observación agregada', color: 'green' })
    comentarioConflicto.value = ''
    await cargarVenta()
  } catch (err: any) {
    conflictoError.value = err.data?.statusMessage || 'Error al guardar observación'
  } finally {
    savingConflicto.value = false
  }
}

// Guardar edición completa (solo admin)
const actualizar = async (data: Record<string, any>) => {
  try {
    await $fetch(`/api/ventas/${route.params.id}`, {
      method: 'PUT',
      body: data,
    })
    toast.add({ title: 'Venta actualizada', color: 'green' })
    await volver()
  } catch (err: any) {
    toast.add({ title: 'Error al guardar', description: err.data?.statusMessage || err.message, color: 'red' })
  }
}

const estadoLabel = (e: string) => ({
  pendiente: 'Pendiente', en_proceso: 'En Proceso', en_conflicto: 'En Conflicto',
  rechazado: 'Rechazado', coordinado: 'Coordinado', concretado: 'Concretado',
}[e] ?? e)

const estadoColor = (e: string): any => ({
  pendiente: 'gray', en_proceso: 'yellow', en_conflicto: 'orange',
  rechazado: 'red', coordinado: 'teal', concretado: 'blue',
}[e] ?? 'gray')

const formatFecha = (f: unknown) => formatFechaHora(f)

const logGestion = computed(() => {
  const log = venta.value?.comentarios_gestion
  return Array.isArray(log) ? log : []
})

useHead({ title: 'Detalle de Venta — AMSI SRL' })
</script>
