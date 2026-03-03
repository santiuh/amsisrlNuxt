<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Cliente y contacto -->
      <UFormGroup label="Cliente *" class="md:col-span-2">
        <UInput v-model="form.cliente" placeholder="Nombre completo del cliente" class="w-full" :disabled="readonly" />
      </UFormGroup>

      <UFormGroup label="DNI / CUIL *">
        <UInput v-model="form.dni_cuil" placeholder="20123456789" class="w-full" :disabled="readonly" />
      </UFormGroup>

      <UFormGroup label="Teléfono">
        <UInput v-model="form.telefono" placeholder="1123456789" class="w-full" :disabled="readonly" />
      </UFormGroup>

      <UFormGroup label="Email">
        <UInput v-model="form.mail" type="email" placeholder="cliente@ejemplo.com" class="w-full" :disabled="readonly" />
      </UFormGroup>

      <!-- Dirección estructurada -->
      <UFormGroup label="Dirección *">
        <UInput v-model="form.dir_calle" placeholder="Ej: Av. Corrientes 1234" class="w-full" :disabled="readonly" />
      </UFormGroup>

      <UFormGroup label="Entre calles">
        <UInput v-model="form.dir_entre_calles" placeholder="Ej: Callao y Riobamba" class="w-full" :disabled="readonly" />
      </UFormGroup>

      <UFormGroup label="Localidad *">
        <UInput v-model="form.dir_localidad" placeholder="Ej: Buenos Aires" class="w-full" :disabled="readonly" />
      </UFormGroup>

      <UFormGroup label="Aclaración">
        <UInput v-model="form.dir_aclaracion" placeholder="Piso, dpto, referencia..." class="w-full" :disabled="readonly" />
      </UFormGroup>

      <!-- Paquete dinámico -->
      <UFormGroup label="Paquete *" class="md:col-span-2">
        <USelect
          v-model="form.paquete_id"
          :options="opcionesPaquetes"
          placeholder="Seleccionar paquete"
          class="w-full"
          :loading="loadingCatalogo"
          :disabled="readonly"
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
              :disabled="readonly"
            />
            <label :for="`extra-${extra.id}`" class="text-sm cursor-pointer flex-1 text-gray-800 dark:text-gray-200">
              {{ extra.nombre }}
            </label>
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatPrecio(extra.precio) }}</span>
          </div>
        </div>
      </UFormGroup>

      <!-- Decos -->
      <UFormGroup label="Decos (decodificadores)">
        <USelect
          v-model="form.decos"
          :options="decosOptions"
          class="w-full"
          :disabled="readonly"
        />
      </UFormGroup>

      <!-- Bocas -->
      <UFormGroup label="Bocas (salidas de TV)">
        <USelect
          v-model="form.bocas"
          :options="bocasOptions"
          class="w-full"
          :disabled="readonly"
        />
      </UFormGroup>

      <!-- Precio calculado (read-only) -->
      <UFormGroup label="Precio Total" class="md:col-span-2">
        <div class="flex items-center gap-2">
          <div class="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-3 py-2 text-4xl">
            <span class="text-gray-800 dark:text-gray-100 font-medium">{{ formatPrecio(precioCalculado) }}</span>
          </div>
        </div>
        <p v-if="desgloseBocasDecos" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {{ desgloseBocasDecos }}
        </p>
      </UFormGroup>

      <!-- Forma de pago -->
      <UFormGroup label="Forma de Pago *">
        <USelect
          v-model="form.forma_pago"
          :options="formaPagoOptions"
          placeholder="Seleccionar forma de pago"
          class="w-full"
          :disabled="readonly"
        />
      </UFormGroup>

      <!-- Estado: visible en edición (oficinista/admin) o en modo solo lectura -->
      <UFormGroup v-if="!hideGestionFields && (canEditEstado || readonly)" label="Estado">
        <USelect v-model="form.estado" :options="estadoOptions" class="w-full" :disabled="readonly" />
      </UFormGroup>

      <!-- Fecha de coordinación: obligatoria cuando estado = coordinado -->
      <UFormGroup
        v-if="!hideGestionFields && (canEditEstado || readonly) && form.estado === 'coordinado'"
        label="Fecha y horario de coordinación *"
        class="md:col-span-2"
      >
        <UInput
          v-model="form.fecha_coordinacion"
          type="datetime-local"
          class="w-full"
          :disabled="readonly"
        />
      </UFormGroup>

      <!-- Comentarios venta -->
      <UFormGroup label="Comentarios de Venta" class="md:col-span-2">
        <UTextarea
          v-model="form.comentarios_venta"
          placeholder="Observaciones adicionales de la venta..."
          :rows="3"
          class="w-full"
          :disabled="readonly"
        />
      </UFormGroup>

      <!-- Registro de gestión: solo oficinista/admin en modo edición -->
      <UFormGroup v-if="!hideGestionFields && canEditGestion && !readonly" label="Registro de Gestión" class="md:col-span-2">
        <!-- Entradas existentes -->
        <div
          v-if="logEntradas.length > 0"
          class="mb-3 max-h-52 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800 bg-gray-50 dark:bg-gray-900/70"
        >
          <div v-for="(entry, i) in logEntradas" :key="i" class="px-3 py-2 text-sm">
            <div class="flex items-center gap-2 mb-0.5 flex-wrap">
              <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatFechaLog(entry.fecha_hora) }}</span>
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
      v-if="errorMsg && !readonly"
      icon="i-heroicons-exclamation-circle"
      color="red"
      variant="soft"
      :title="errorMsg"
    />

    <div v-if="!readonly" class="flex justify-end gap-3">
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
  readonly?: boolean
  hideGestionFields?: boolean
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
const hideGestionFields = computed(() => !!props.hideGestionFields)

// ——— Catálogo dinámico ———
const paquetesActivos = ref<any[]>([])
const extrasActivos = ref<any[]>([])
const loadingCatalogo = ref(true)
const precioBocaExtra = ref(0)
const precioDecoExtra = ref(0)

onMounted(async () => {
  const [{ data: paquetesData }, { data: extrasData }, { data: configBoca }, { data: configDeco }] = await Promise.all([
    client.from('paquetes').select('*').eq('activo', true).order('nombre'),
    client.from('extras').select('*').eq('activo', true).order('nombre'),
    client.from('configuracion').select('valor').eq('clave', 'precio_boca_extra').single(),
    client.from('configuracion').select('valor').eq('clave', 'precio_deco_extra').single(),
  ])
  paquetesActivos.value = paquetesData ?? []
  extrasActivos.value = extrasData ?? []
  precioBocaExtra.value = Number(configBoca?.valor ?? 0)
  precioDecoExtra.value = Number(configDeco?.valor ?? 0)
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
  mail: '',
  dir_calle: '',
  dir_entre_calles: '',
  dir_localidad: '',
  dir_aclaracion: '',
  paquete_id: '',
  extras_ids: [] as string[],
  decos: 1,
  bocas: 1,
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

// Normalizar fecha_coordinacion al formato que espera datetime-local (YYYY-MM-DDTHH:MM)
if (form.fecha_coordinacion) {
  form.fecha_coordinacion = toDatetimeLocalValue(form.fecha_coordinacion)
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

const formatFechaLog = (value: unknown) => formatFechaHora(value)

const estadoLabelLocal = (e: string) => ({
  pendiente: 'Pendiente', en_proceso: 'En Proceso', en_conflicto: 'En Conflicto',
  rechazado: 'Rechazado', coordinado: 'Coordinado', concretado: 'Concretado',
}[e] ?? e)

const decosOptions = Array.from({ length: 10 }, (_, i) => ({
  label: `${i + 1} deco${i > 0 ? 's' : ''}${i >= 3 ? ` (+${i - 2} extra${i > 3 ? 's' : ''})` : ''}`,
  value: i + 1,
}))

const bocasOptions = Array.from({ length: 10 }, (_, i) => ({
  label: `${i + 1} boca${i > 0 ? 's' : ''}${i >= 3 ? ` (+${i - 2} extra${i > 3 ? 's' : ''})` : ''}`,
  value: i + 1,
}))

// Cada deco requiere al menos 1 boca
watch(() => form.decos, (newDecos) => {
  if (Number(form.bocas) < Number(newDecos)) {
    form.bocas = Number(newDecos)
  }
})

// ——— Precio calculado ———
const precioCalculado = computed(() => {
  const paquete = paquetesActivos.value.find(p => p.id === form.paquete_id)
  const precioExtras = extrasActivos.value
    .filter(e => (form.extras_ids as string[]).includes(e.id))
    .reduce((sum, e) => sum + Number(e.precio), 0)
  const extraDecos = Math.max(0, Number(form.decos) - 3)
  const extraBocas = Math.max(0, Number(form.bocas) - 3)
  const bocasSueltas = Math.max(0, extraBocas - extraDecos)
  const costoBocasDecos = (extraDecos * precioDecoExtra.value) + (bocasSueltas * precioBocaExtra.value)
  return (paquete ? Number(paquete.precio) : 0) + precioExtras + costoBocasDecos
})

const desgloseBocasDecos = computed(() => {
  const extraDecos = Math.max(0, Number(form.decos) - 3)
  const extraBocas = Math.max(0, Number(form.bocas) - 3)
  const bocasSueltas = Math.max(0, extraBocas - extraDecos)
  const parts: string[] = []
  if (extraDecos > 0 && precioDecoExtra.value > 0) {
    parts.push(`${extraDecos} deco${extraDecos > 1 ? 's' : ''} extra${extraDecos > 1 ? 's' : ''} × ${formatPrecio(precioDecoExtra.value)}`)
  }
  if (bocasSueltas > 0 && precioBocaExtra.value > 0) {
    parts.push(`${bocasSueltas} boca${bocasSueltas > 1 ? 's' : ''} extra${bocasSueltas > 1 ? 's' : ''} × ${formatPrecio(precioBocaExtra.value)}`)
  }
  return parts.length > 0 ? 'Incluye ' + parts.join(' + ') : ''
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
    fecha_coordinacion: datetimeLocalToISO(form.fecha_coordinacion),
    paquete_nombre: paquete?.nombre ?? '',
    paquete_precio_snapshot: paquete?.precio ?? 0,
    precio: precioCalculado.value,
    precio_boca_extra_snapshot: precioBocaExtra.value,
    precio_deco_extra_snapshot: precioDecoExtra.value,
    comentarios_gestion: logActualizado,
    _extras: extrasSeleccionados.map(e => ({ id: e.id, precio: e.precio })),
  })
  loading.value = false
}

const formatPrecio = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n ?? 0)
</script>
