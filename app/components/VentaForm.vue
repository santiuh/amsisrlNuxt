<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Cliente y contacto -->
      <UFormGroup label="Cliente *" class="md:col-span-2">
        <div class="flex items-start gap-2">
          <UInput v-model="form.cliente" placeholder="Nombre completo del cliente" class="w-full" :disabled="readonly" />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(form.cliente, 'Cliente')" />
        </div>
      </UFormGroup>

      <UFormGroup label="DNI / CUIL *">
        <div class="flex items-start gap-2">
          <UInput v-model="form.dni_cuil" placeholder="20123456789" class="w-full" :disabled="readonly" />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(form.dni_cuil, 'DNI / CUIL')" />
        </div>
      </UFormGroup>

      <UFormGroup label="Teléfono">
        <div class="flex items-start gap-2">
          <UInput
            v-model="form.telefono"
            type="tel"
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="tel-national"
            placeholder="1123456789"
            class="w-full"
            :disabled="readonly"
            @update:model-value="sanitizeTelefono"
          />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(form.telefono, 'Teléfono')" />
        </div>
      </UFormGroup>

      <UFormGroup label="Email">
        <div class="flex items-start gap-2">
          <UInput v-model="form.mail" type="email" placeholder="cliente@ejemplo.com" class="w-full" :disabled="readonly" />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(form.mail, 'Email')" />
        </div>
      </UFormGroup>

      <!-- Dirección estructurada -->
      <UFormGroup label="Dirección *">
        <div class="flex items-start gap-2">
          <UInput v-model="form.dir_calle" placeholder="Ej: Av. Corrientes 1234" class="w-full" :disabled="readonly" />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(form.dir_calle, 'Dirección')" />
        </div>
      </UFormGroup>

      <UFormGroup label="Entre calles">
        <div class="flex items-start gap-2">
          <UInput v-model="form.dir_entre_calles" placeholder="Ej: Callao y Riobamba" class="w-full" :disabled="readonly" />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(form.dir_entre_calles, 'Entre calles')" />
        </div>
      </UFormGroup>

      <UFormGroup label="Localidad *">
        <div class="flex items-start gap-2">
          <USelect
            v-model="form.dir_localidad"
            :options="localidadOptions"
            placeholder="Seleccionar localidad"
            class="w-full"
            :disabled="readonly"
          />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(localidadLabel, 'Localidad')" />
        </div>
      </UFormGroup>

      <UFormGroup label="Aclaración">
        <div class="flex items-start gap-2">
          <UInput v-model="form.dir_aclaracion" placeholder="Piso, dpto, referencia..." class="w-full" :disabled="readonly" />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(form.dir_aclaracion, 'Aclaración')" />
        </div>
      </UFormGroup>

      <!-- Paquete dinámico -->
      <UFormGroup label="Paquete *" class="md:col-span-2">
        <div class="flex items-start gap-2">
          <USelect
            v-model="form.paquete_id"
            :options="opcionesPaquetes"
            placeholder="Seleccionar paquete"
            class="w-full"
            :loading="loadingCatalogo"
            :disabled="readonly"
          />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(paqueteLabel, 'Paquete')" />
        </div>
      </UFormGroup>

      <!-- Extras -->
      <UFormGroup v-if="extrasActivos.length > 0" label="Extras" class="md:col-span-2">
        <div class="flex items-start gap-2 mt-1">
          <div class="space-y-2 flex-1">
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
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(extrasSeleccionadosTexto, 'Extras')" />
        </div>
      </UFormGroup>

      <!-- Decos -->
      <UFormGroup label="Decos (decodificadores)">
        <div class="flex items-start gap-2">
          <USelect
            v-model="form.decos"
            :options="decosOptions"
            class="w-full"
            :disabled="readonly"
          />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(decosLabel, 'Decos')" />
        </div>
      </UFormGroup>

      <!-- Bocas -->
      <UFormGroup label="Bocas (salidas de TV)">
        <div class="flex items-start gap-2">
          <USelect
            v-model="form.bocas"
            :options="bocasOptions"
            class="w-full"
            :disabled="readonly"
          />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(bocasLabel, 'Bocas')" />
        </div>
      </UFormGroup>

      <!-- Precio calculado (read-only) -->
      <UFormGroup label="Precio Total" class="md:col-span-2">
        <div class="flex items-center gap-2">
          <div class="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-3 py-2 text-4xl">
            <span class="text-gray-800 dark:text-gray-100 font-medium">{{ formatPrecio(precioCalculado) }}</span>
          </div>
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(formatPrecio(precioCalculado), 'Precio total')" />
        </div>
        <p v-if="desgloseBocasDecos" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {{ desgloseBocasDecos }}
        </p>
      </UFormGroup>

      <!-- Forma de pago -->
      <UFormGroup label="Forma de Pago *">
        <div class="flex items-start gap-2">
          <USelect
            v-model="form.forma_pago"
            :options="formaPagoOptions"
            placeholder="Seleccionar forma de pago"
            class="w-full"
            :disabled="readonly"
          />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(formaPagoLabel, 'Forma de pago')" />
        </div>
      </UFormGroup>

      <!-- CBU (solo débito) -->
      <UFormGroup v-if="form.forma_pago === 'debito'" label="CBU *" class="md:col-span-2">
        <div class="flex items-start gap-2">
          <UInput v-model="form.cbu" placeholder="22 dígitos del CBU" class="w-full" :disabled="readonly" />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(form.cbu, 'CBU')" />
        </div>
      </UFormGroup>

      <!-- Tarjeta (solo crédito) -->
      <UFormGroup v-if="form.forma_pago === 'credito'" label="Número de Tarjeta *">
        <div class="flex items-start gap-2">
          <UInput v-model="form.nro_tarjeta" placeholder="16 dígitos" class="w-full" :disabled="readonly" />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(form.nro_tarjeta, 'Número de tarjeta')" />
        </div>
      </UFormGroup>
      <UFormGroup v-if="form.forma_pago === 'credito'" label="Vencimiento *">
        <div class="flex items-start gap-2">
          <UInput v-model="form.vencimiento_tarjeta" placeholder="MM/AA" class="w-full" :disabled="readonly" />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(form.vencimiento_tarjeta, 'Vencimiento')" />
        </div>
      </UFormGroup>

      <!-- Estado: visible en edición (oficinista/admin) o en modo solo lectura -->
      <UFormGroup v-if="!hideGestionFields && (canEditEstado || readonly)" label="Estado">
        <div class="flex items-start gap-2">
          <USelect v-model="form.estado" :options="estadoOptions" class="w-full" :disabled="readonly" />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(estadoLabelLocal(form.estado), 'Estado')" />
        </div>
      </UFormGroup>

      <!-- Fecha de coordinación: obligatoria cuando estado = coordinado -->
      <UFormGroup
        v-if="!hideGestionFields && (canEditEstado || readonly) && form.estado === 'coordinado'"
        label="Fecha y horario de coordinación *"
        class="md:col-span-2"
      >
        <div class="flex items-start gap-2">
          <UInput
            v-model="form.fecha_coordinacion"
            type="datetime-local"
            class="w-full"
            :disabled="readonly"
          />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(fechaCoordinacionLabel, 'Fecha de coordinación')" />
        </div>
      </UFormGroup>

      <!-- Comentarios venta -->
      <UFormGroup label="Comentarios de Venta" class="md:col-span-2">
        <div class="flex items-start gap-2">
          <UTextarea
            v-model="form.comentarios_venta"
            placeholder="Observaciones adicionales de la venta..."
            :rows="3"
            class="w-full"
            :disabled="readonly"
          />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(form.comentarios_venta, 'Comentarios de venta')" />
        </div>
      </UFormGroup>

      <!-- Número de Cliente -->
      <UFormGroup label="Número de Cliente" class="md:col-span-2">
        <div class="flex items-start gap-2">
          <UInput
            v-model="form.nro_cliente"
            placeholder="Ej: 123456"
            class="w-full"
            :disabled="readonly"
          />
          <UButton v-if="readonly" icon="i-heroicons-clipboard-document" color="gray" variant="ghost" size="sm" square @click="copyField(form.nro_cliente, 'Número de cliente')" />
        </div>
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
      <slot name="extra-actions" :form-data="form" />
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
  onSubmit?: (data: Record<string, any>) => Promise<void>
}>()

const emit = defineEmits<{
  cancel: []
}>()

const client = useSupabaseClient()
const profile = useCurrentProfile()
const toast = useToast()

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
  precioBocaExtra.value = Number((configBoca as { valor?: number | string } | null)?.valor ?? 0)
  precioDecoExtra.value = Number((configDeco as { valor?: number | string } | null)?.valor ?? 0)
  loadingCatalogo.value = false
})

const opcionesPaquetes = computed(() =>
  paquetesActivos.value.map(p => ({ label: `${p.nombre} — ${formatPrecio(p.precio)}`, value: p.id }))
)

const getOptionLabel = (options: Array<{ label: string, value: string | number }>, value: string | number | null | undefined) => {
  const option = options.find(option => option.value === value)
  return option?.label ?? String(value ?? '')
}

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
  cbu: '',
  nro_tarjeta: '',
  vencimiento_tarjeta: '',
  estado: 'pendiente',
  fecha_coordinacion: '',
  comentarios_venta: '',
  comentarios_gestion: [] as any[],
  nro_cliente: '',
  ...(props.initialData ?? {}),
})

const sanitizeTelefono = (value: string | number) => {
  form.telefono = String(value ?? '').replace(/\D/g, '')
}

// Normalizar comentarios_gestion a array (por si viene como string de datos legacy)
if (!Array.isArray(form.comentarios_gestion)) {
  form.comentarios_gestion = []
}

sanitizeTelefono(form.telefono)

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
  { label: 'Crédito', value: 'credito' },
  { label: 'Transferencia', value: 'transferencia' },
  { label: 'Efectivo', value: 'efectivo' },
]

const localidadOptions = [
  { label: 'Rosario', value: 'Rosario' },
  { label: 'San Lorenzo', value: 'San Lorenzo' },
  { label: 'Baigorria', value: 'Baigorria' },
  { label: 'San Nicolas', value: 'San Nicolas' },
  { label: 'Perez', value: 'Perez' },
]

const estadoOptions = [
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'En Proceso', value: 'en_proceso' },
  { label: 'En Conflicto', value: 'en_conflicto' },
  { label: 'Rechazado', value: 'rechazado' },
  { label: 'Coordinado', value: 'coordinado' },
  { label: 'Concretado', value: 'concretado' },
]

const localidadLabel = computed(() => getOptionLabel(localidadOptions, form.dir_localidad))
const paqueteLabel = computed(() => getOptionLabel(opcionesPaquetes.value, form.paquete_id))
const decosLabel = computed(() => getOptionLabel(decosOptions, form.decos))
const bocasLabel = computed(() => getOptionLabel(bocasOptions, form.bocas))
const formaPagoLabel = computed(() => getOptionLabel(formaPagoOptions, form.forma_pago))
const fechaCoordinacionLabel = computed(() => {
  if (!form.fecha_coordinacion) return ''
  return formatFechaHora(datetimeLocalToISO(form.fecha_coordinacion) ?? form.fecha_coordinacion)
})
const extrasSeleccionadosTexto = computed(() => {
  const extrasSeleccionados = extrasActivos.value
    .filter(extra => (form.extras_ids as string[]).includes(extra.id))
    .map(extra => extra.nombre)

  return extrasSeleccionados.join(', ')
})

const loading = ref(false)
const errorMsg = ref('')

const copyField = async (value: unknown, label: string) => {
  const text = String(value ?? '').trim()

  if (!text) {
    toast.add({ title: `${label} vacío`, color: 'orange' })
    return
  }

  if (!navigator?.clipboard) {
    toast.add({ title: 'No se pudo acceder al portapapeles', color: 'red' })
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: `${label} copiado`, color: 'green' })
  } catch {
    toast.add({ title: `Error al copiar ${label.toLowerCase()}`, color: 'red' })
  }
}

const submit = async () => {
  if (!form.cliente || !form.dni_cuil || !form.paquete_id || !form.forma_pago || !form.dir_calle || !form.dir_localidad) {
    errorMsg.value = 'Por favor completá todos los campos obligatorios (*).'
    return
  }
  if (form.forma_pago === 'debito' && !form.cbu?.trim()) {
    errorMsg.value = 'El CBU es obligatorio para pagos con débito.'
    return
  }
  if (form.forma_pago === 'credito' && (!form.nro_tarjeta?.trim() || !form.vencimiento_tarjeta?.trim())) {
    errorMsg.value = 'El número de tarjeta y vencimiento son obligatorios para pagos con crédito.'
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

  try {
    await props.onSubmit?.({
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
  } finally {
    loading.value = false
  }
}

const formatPrecio = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n ?? 0)
</script>
