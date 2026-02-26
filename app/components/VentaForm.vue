<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Cliente y contacto -->
      <UFormGroup label="Cliente *" class="md:col-span-2">
        <UInput v-model="form.cliente" placeholder="Nombre completo del cliente" class="w-full" />
      </UFormGroup>

      <UFormGroup label="DNI / CUIL *">
        <UInput v-model="form.dni_cuil" placeholder="20123456789" class="w-full" />
      </UFormGroup>

      <UFormGroup label="Teléfono">
        <UInput v-model="form.telefono" placeholder="1123456789" class="w-full" />
      </UFormGroup>

      <!-- Dirección estructurada -->
      <UFormGroup label="Dirección *">
        <UInput v-model="form.dir_calle" placeholder="Ej: Av. Corrientes 1234" class="w-full" />
      </UFormGroup>

      <UFormGroup label="Entre calles">
        <UInput v-model="form.dir_entre_calles" placeholder="Ej: Callao y Riobamba" class="w-full" />
      </UFormGroup>

      <UFormGroup label="Localidad *">
        <UInput v-model="form.dir_localidad" placeholder="Ej: Buenos Aires" class="w-full" />
      </UFormGroup>

      <UFormGroup label="Aclaración">
        <UInput v-model="form.dir_aclaracion" placeholder="Piso, dpto, referencia..." class="w-full" />
      </UFormGroup>

      <!-- Paquete dinámico -->
      <UFormGroup label="Paquete *" class="md:col-span-2">
        <USelect
          v-model="form.paquete_id"
          :options="opcionesPaquetes"
          placeholder="Seleccionar paquete"
          class="w-full"
          :loading="loadingCatalogo"
        />
      </UFormGroup>

      <!-- Extras -->
      <UFormGroup v-if="extrasActivos.length > 0" label="Extras" class="md:col-span-2">
        <div class="space-y-2 mt-1">
          <div
            v-for="extra in extrasActivos"
            :key="extra.id"
            class="flex items-center gap-3 py-1"
          >
            <input
              type="checkbox"
              :id="`extra-${extra.id}`"
              :value="extra.id"
              v-model="form.extras_ids"
              class="w-4 h-4 accent-primary-500"
            />
            <label :for="`extra-${extra.id}`" class="text-sm cursor-pointer flex-1">
              {{ extra.nombre }}
            </label>
            <span class="text-sm text-gray-500">{{ formatPrecio(extra.precio) }}</span>
          </div>
        </div>
      </UFormGroup>

      <!-- Precio calculado (read-only) -->
      <UFormGroup label="Precio Total" class="md:col-span-2">
        <div class="flex items-center gap-2">
          <UInput
            :model-value="formatPrecio(precioCalculado)"
            disabled
            class="w-full bg-gray-50"
          />
          <span class="text-xs text-gray-400 whitespace-nowrap">Calculado automáticamente</span>
        </div>
      </UFormGroup>

      <!-- Forma de pago -->
      <UFormGroup label="Forma de Pago *">
        <USelect
          v-model="form.forma_pago"
          :options="formaPagoOptions"
          placeholder="Seleccionar forma de pago"
          class="w-full"
        />
      </UFormGroup>

      <!-- Estado: solo en modo edición para oficinista/admin -->
      <UFormGroup v-if="canEditEstado" label="Estado">
        <USelect v-model="form.estado" :options="estadoOptions" class="w-full" />
      </UFormGroup>

      <!-- Fecha de coordinación: obligatoria cuando estado = coordinado -->
      <UFormGroup
        v-if="canEditEstado && form.estado === 'coordinado'"
        label="Fecha y horario de coordinación *"
        class="md:col-span-2"
      >
        <UInput
          v-model="form.fecha_coordinacion"
          type="datetime-local"
          class="w-full"
        />
      </UFormGroup>

      <!-- Comentarios venta -->
      <UFormGroup label="Comentarios de Venta" class="md:col-span-2">
        <UTextarea
          v-model="form.comentarios_venta"
          placeholder="Observaciones adicionales de la venta..."
          :rows="3"
          class="w-full"
        />
      </UFormGroup>

      <!-- Registro de gestión: solo oficinista/admin -->
      <UFormGroup v-if="canEditGestion" label="Registro de Gestión" class="md:col-span-2">
        <!-- Entradas existentes -->
        <div
          v-if="logEntradas.length > 0"
          class="mb-3 max-h-52 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-gray-50"
        >
          <div v-for="(entry, i) in logEntradas" :key="i" class="px-3 py-2 text-sm">
            <div class="flex items-center gap-2 mb-0.5 flex-wrap">
              <span class="text-xs text-gray-400">{{ formatFechaLog(entry.fecha_hora) }}</span>
              <span class="text-xs font-medium text-gray-600">{{ entry.autor }}</span>
              <UBadge
                v-if="entry.tipo === 'estado'"
                color="teal"
                variant="subtle"
                size="xs"
                label="Estado"
              />
            </div>
            <p class="text-gray-800">{{ entry.texto }}</p>
          </div>
        </div>
        <p v-else class="text-xs text-gray-400 mb-2 italic">Sin registros de gestión aún.</p>

        <!-- Nuevo comentario -->
        <UTextarea
          v-model="nuevoComentario"
          placeholder="Agregar comentario de gestión..."
          :rows="2"
          class="w-full"
        />
      </UFormGroup>
    </div>

    <UAlert
      v-if="errorMsg"
      icon="i-heroicons-exclamation-circle"
      color="red"
      variant="soft"
      :title="errorMsg"
    />

    <div class="flex justify-end gap-3">
      <UButton
        v-if="showCancel"
        label="Cancelar"
        color="gray"
        variant="outline"
        @click="$emit('cancel')"
      />
      <UButton
        :loading="loading"
        :label="submitLabel ?? 'Guardar'"
        @click="submit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  initialData?: Record<string, any>
  submitLabel?: string
  showCancel?: boolean
}>()

const emit = defineEmits<{
  submit: [data: Record<string, any>]
  cancel: []
}>()

const client = useSupabaseClient()
const profile = useCurrentProfile()

const canEditEstado = computed(() =>
  !!props.initialData && ['oficinista', 'admin'].includes(profile.value?.rol ?? '')
)
const canEditGestion = computed(() =>
  ['oficinista', 'admin'].includes(profile.value?.rol ?? '')
)

// ——— Catálogo dinámico ———
const paquetesActivos = ref<any[]>([])
const extrasActivos = ref<any[]>([])
const loadingCatalogo = ref(true)

onMounted(async () => {
  const [{ data: paquetesData }, { data: extrasData }] = await Promise.all([
    client.from('paquetes').select('*').eq('activo', true).order('nombre'),
    client.from('extras').select('*').eq('activo', true).order('nombre'),
  ])
  paquetesActivos.value = paquetesData ?? []
  extrasActivos.value = extrasData ?? []
  loadingCatalogo.value = false
})

const opcionesPaquetes = computed(() =>
  paquetesActivos.value.map(p => ({ label: `${p.nombre} — ${formatPrecio(p.precio)}`, value: p.id }))
)

// ——— Formulario ———
const form = reactive({
  cliente: '',
  dni_cuil: '',
  telefono: '',
  dir_calle: '',
  dir_entre_calles: '',
  dir_localidad: '',
  dir_aclaracion: '',
  paquete_id: '',
  extras_ids: [] as string[],
  forma_pago: '',
  estado: 'pendiente',
  fecha_coordinacion: '',
  comentarios_venta: '',
  comentarios_gestion: [] as any[],
  ...(props.initialData ?? {}),
})

// Normalizar comentarios_gestion a array (por si viene como string de datos legacy)
if (!Array.isArray(form.comentarios_gestion)) {
  form.comentarios_gestion = []
}

// Cargar extras seleccionados en modo edición
if (props.initialData?.venta_extras) {
  form.extras_ids = (props.initialData.venta_extras as any[]).map((ve: any) => ve.extra_id)
}

// ——— Log de gestión ———
const nuevoComentario = ref('')

const logEntradas = computed(() =>
  Array.isArray(form.comentarios_gestion) ? (form.comentarios_gestion as any[]) : []
)

const formatFechaLog = (isoString: string) =>
  new Date(isoString).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const estadoLabelLocal = (e: string) => ({
  pendiente: 'Pendiente', en_proceso: 'En Proceso', en_conflicto: 'En Conflicto',
  rechazado: 'Rechazado', coordinado: 'Coordinado', concretado: 'Concretado',
}[e] ?? e)

// ——— Precio calculado ———
const precioCalculado = computed(() => {
  const paquete = paquetesActivos.value.find(p => p.id === form.paquete_id)
  const precioExtras = extrasActivos.value
    .filter(e => (form.extras_ids as string[]).includes(e.id))
    .reduce((sum, e) => sum + Number(e.precio), 0)
  return (paquete ? Number(paquete.precio) : 0) + precioExtras
})

const formaPagoOptions = [
  { label: 'Débito', value: 'debito' },
  { label: 'Transferencia', value: 'transferencia' },
  { label: 'Efectivo', value: 'efectivo' },
]

const estadoOptions = [
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'En Proceso', value: 'en_proceso' },
  { label: 'En Conflicto', value: 'en_conflicto' },
  { label: 'Rechazado', value: 'rechazado' },
  { label: 'Coordinado', value: 'coordinado' },
  { label: 'Concretado', value: 'concretado' },
]

const loading = ref(false)
const errorMsg = ref('')

const submit = async () => {
  if (!form.cliente || !form.dni_cuil || !form.paquete_id || !form.forma_pago || !form.dir_calle || !form.dir_localidad) {
    errorMsg.value = 'Por favor completá todos los campos obligatorios (*).'
    return
  }
  if (form.estado === 'coordinado' && !form.fecha_coordinacion) {
    errorMsg.value = 'Debés ingresar la fecha y horario de coordinación.'
    return
  }
  errorMsg.value = ''
  loading.value = true

  // ——— Construir nuevas entradas del log ———
  const nuevasEntradas: any[] = []
  const ahora = new Date().toISOString()
  const autor = profile.value?.nombre ?? 'Sistema'

  // Entrada automática si cambió el estado (solo en modo edición)
  if (props.initialData && form.estado !== props.initialData.estado) {
    nuevasEntradas.push({
      fecha_hora: ahora,
      autor,
      tipo: 'estado',
      texto: `Estado cambiado de "${estadoLabelLocal(props.initialData.estado)}" a "${estadoLabelLocal(form.estado)}"`,
    })
  }

  // Entrada manual si hay comentario nuevo
  if (nuevoComentario.value.trim()) {
    nuevasEntradas.push({
      fecha_hora: ahora,
      autor,
      tipo: 'comentario',
      texto: nuevoComentario.value.trim(),
    })
  }

  // Combinar: entradas nuevas primero (más recientes al inicio)
  const logActualizado = [...nuevasEntradas, ...logEntradas.value]

  const paquete = paquetesActivos.value.find(p => p.id === form.paquete_id)
  const extrasSeleccionados = extrasActivos.value.filter(e => (form.extras_ids as string[]).includes(e.id))

  emit('submit', {
    ...form,
    fecha_coordinacion: form.fecha_coordinacion || null,
    paquete_nombre: paquete?.nombre ?? '',
    paquete_precio_snapshot: paquete?.precio ?? 0,
    precio: precioCalculado.value,
    comentarios_gestion: logActualizado,
    _extras: extrasSeleccionados.map(e => ({ id: e.id, precio: e.precio })),
  })
  loading.value = false
}

const formatPrecio = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n ?? 0)
</script>
