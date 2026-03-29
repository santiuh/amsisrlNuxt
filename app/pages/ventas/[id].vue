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
        {{ isEditingVenta ? 'Editar Venta' : 'Detalle de Venta' }}
      </h2>
      <UBadge
        v-if="venta"
        :color="estadoColor(venta.estado)"
        :label="estadoLabel(venta.estado)"
        variant="subtle"
      />
      <div class="ml-auto">
        <UButton
          v-if="canContactByWhatsapp && whatsappUrl"
          icon="i-simple-icons-whatsapp"
          color="green"
          variant="ghost"
          size="sm"
          label="WhatsApp"
          @click="abrirWhatsapp"
        />
        <UButton
          v-if="canEdit && venta"
          :icon="isEditingVenta ? 'i-heroicons-x-mark' : 'i-heroicons-pencil-square'"
          color="gray"
          variant="ghost"
          size="sm"
          :label="isEditingVenta ? 'Cancelar edición' : 'Editar'"
          @click="toggleEditarVenta"
        />
        <UButton
          v-if="canEdit && venta && isEditingVenta"
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
            <UserAvatar v-if="venta.profiles?.nombre" :config="venta.profiles.avatar_config ?? avatarMap[venta.profiles.nombre] ?? null" :seed="venta.profiles.nombre" class="w-5 h-5 rounded-full overflow-hidden shrink-0" />
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
        :key="ventaFormKey"
        :initial-data="venta"
        :submit-label="ventaSubmitLabel"
        :show-cancel="isEditingVenta"
        :readonly="!isEditingVenta"
        :readonly-main-fields-only="true"
        :hide-gestion-log="true"
        :avatar-map="avatarMap"
        :on-submit="actualizar"
        @cancel="cancelarEdicionVenta"
      />

      <!-- Historial (admin) -->
      <HistorialGestion
        v-if="canEdit"
        v-model="comentarioConflicto"
        :entries="logGestion"
        :avatar-map="avatarMap"
        :loading="savingConflicto"
        :error="conflictoError"
        class="border-t border-gray-200 dark:border-gray-800 pt-4 mt-6"
        @submit="guardarComentarioConflicto"
      />

      <!-- Vista de solo lectura: mismo formato que el formulario de creación -->
      <template v-else>
        <VentaForm :initial-data="venta" :hide-gestion-fields="isOficinistra" :avatar-map="avatarMap" readonly />

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

            <UAlert
              v-if="gestionError"
              icon="i-heroicons-exclamation-circle"
              color="red"
              variant="soft"
              :title="gestionError"
              class="sm:col-span-2"
            />

            <div class="flex justify-end gap-3 sm:col-span-2">
              <UButton label="Cancelar" color="gray" variant="outline" @click="volver()" />
              <UButton label="Guardar Gestión" :loading="savingGestion" @click="guardarGestion" />
            </div>

            <!-- Historial (oficinista) -->
            <HistorialGestion
              v-model="comentarioConflicto"
              :entries="logGestion"
              :avatar-map="avatarMap"
              :loading="savingConflicto"
              :error="conflictoError"
              class="sm:col-span-2 border-t border-gray-200 dark:border-gray-800 pt-4"
              @submit="guardarComentarioConflicto"
            />
        </div>

        <!-- Historial (vendedor/lider) -->
        <div v-else class="space-y-4 mt-4">
            <!-- Banner solo si en_conflicto -->
            <div v-if="venta.estado === 'en_conflicto'" class="border-2 border-orange-400 bg-orange-50 rounded-xl p-4 flex gap-3">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
              <div class="space-y-1">
                <p class="font-semibold text-orange-800 text-sm">Esta venta tiene un conflicto que requiere tu atención</p>
                <p class="text-orange-700 text-sm">Revisá los comentarios de gestión a continuación. Podés responder o agregar información para que tu venta pueda concretarse.</p>
              </div>
            </div>

            <HistorialGestion
              v-model="comentarioConflicto"
              :entries="logGestion"
              :avatar-map="avatarMap"
              :loading="savingConflicto"
              :error="conflictoError"
              :conflicto-style="venta.estado === 'en_conflicto'"
              @submit="guardarComentarioConflicto"
            />
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
import { buildVentaWhatsappUrl } from '~/utils/whatsapp'

const route = useRoute()
const client = useSupabaseClient()
const profile = useCurrentProfile()
const toast = useToast()
const loading = ref(true)
const venta = ref<any>(null)
const avatarMap = ref<Record<string, any>>({})
const isEditingVenta = ref(false)
const ventaFormKey = ref(0)

// Solo admin puede editar todos los campos
const canEdit = computed(() => profile.value?.rol === 'admin')
// Oficinista tiene su propio panel de gestión
const isOficinistra = computed(() => profile.value?.rol === 'oficinista')
const canContactByWhatsapp = computed(() => ['admin', 'oficinista'].includes(profile.value?.rol ?? ''))
const ventaSubmitLabel = computed(() =>
  isEditingVenta.value ? 'Guardar Cambios' : 'Guardar'
)
const whatsappUrl = computed(() => buildVentaWhatsappUrl({
  telefono: venta.value?.telefono,
  cliente: venta.value?.cliente,
  paquete_nombre: venta.value?.paquete_nombre,
}))

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

const resetVentaForm = () => {
  ventaFormKey.value += 1
}

const cancelarEdicionVenta = () => {
  isEditingVenta.value = false
  resetVentaForm()
}

const toggleEditarVenta = () => {
  if (isEditingVenta.value) {
    cancelarEdicionVenta()
    return
  }

  isEditingVenta.value = true
}

const abrirWhatsapp = () => {
  if (!import.meta.client || !whatsappUrl.value) return
  window.open(whatsappUrl.value, '_blank', 'noopener,noreferrer')
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
  { label: 'Próxima Zona', value: 'proxima_zona' },
]

const cargarVenta = async () => {
  const { data } = await client
    .from('ventas')
    .select('*, profiles:vendedor_id(nombre, rol, avatar_config), venta_extras(extra_id, precio_snapshot, extras(nombre))')
    .eq('id', route.params.id as string)
    .single()
  const ventaData = data as Record<string, any> | null

  venta.value = ventaData
  resetVentaForm()
  if (ventaData) {
    gestionForm.estado = ventaData.estado ?? 'pendiente'
    gestionForm.fecha_coordinacion = ventaData.fecha_coordinacion
      ? toDatetimeLocalValue(ventaData.fecha_coordinacion)
      : ''
    gestionForm.nro_cliente = ventaData.nro_cliente ?? ''
    if (!canEdit.value) {
      isEditingVenta.value = false
    }
  }
}

onMounted(async () => {
  const [, { data: profilesData }] = await Promise.all([
    cargarVenta(),
    client.from('profiles').select('nombre, avatar_config'),
  ])
  // Build name → avatar_config lookup for comment avatars
  ;(profilesData ?? []).forEach((p: any) => {
    if (p.nombre && p.avatar_config) avatarMap.value[p.nombre] = p.avatar_config
  })
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

  if (gestionForm.estado !== 'pendiente' && !gestionForm.nro_cliente?.trim()) {
    gestionError.value = 'El Número de Cliente es obligatorio cuando el estado es diferente a Pendiente.'
    return
  }
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
  rechazado: 'Rechazado', coordinado: 'Coordinado', concretado: 'Concretado', proxima_zona: 'Próxima Zona',
}[e] ?? e)

const estadoColor = (e: string): any => ({
  pendiente: 'gray', en_proceso: 'yellow', en_conflicto: 'orange',
  rechazado: 'red', coordinado: 'teal', concretado: 'blue', proxima_zona: 'violet',
}[e] ?? 'gray')

const formatFecha = (f: unknown) => formatFechaHora(f)

const logGestion = computed(() => {
  const log = venta.value?.comentarios_gestion
  return Array.isArray(log) ? log : []
})

useHead({ title: 'Detalle de Venta — AMSI SRL' })
</script>
