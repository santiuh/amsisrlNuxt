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

      <!-- Comentarios venta -->
      <UFormGroup label="Comentarios de Venta" class="md:col-span-2">
        <UTextarea
          v-model="form.comentarios_venta"
          placeholder="Observaciones adicionales de la venta..."
          :rows="3"
          class="w-full"
        />
      </UFormGroup>

      <!-- Comentarios gestión: solo oficinista/admin -->
      <UFormGroup v-if="canEditGestion" label="Comentarios de Gestión" class="md:col-span-2">
        <UTextarea
          v-model="form.comentarios_gestion"
          placeholder="Notas de gestión interna..."
          :rows="3"
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
  comentarios_venta: '',
  comentarios_gestion: '',
  ...(props.initialData ?? {}),
})

// Cargar extras seleccionados en modo edición
if (props.initialData?.venta_extras) {
  form.extras_ids = (props.initialData.venta_extras as any[]).map((ve: any) => ve.extra_id)
}

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
  { label: 'Rechazado', value: 'rechazado' },
  { label: 'Aceptado', value: 'aceptado' },
  { label: 'Concretado', value: 'concretado' },
]

const loading = ref(false)
const errorMsg = ref('')

const submit = async () => {
  if (!form.cliente || !form.dni_cuil || !form.paquete_id || !form.forma_pago || !form.dir_calle || !form.dir_localidad) {
    errorMsg.value = 'Por favor completá todos los campos obligatorios (*).'
    return
  }
  errorMsg.value = ''
  loading.value = true

  const paquete = paquetesActivos.value.find(p => p.id === form.paquete_id)
  const extrasSeleccionados = extrasActivos.value.filter(e => (form.extras_ids as string[]).includes(e.id))

  emit('submit', {
    ...form,
    paquete_nombre: paquete?.nombre ?? '',
    paquete_precio_snapshot: paquete?.precio ?? 0,
    precio: precioCalculado.value,
    _extras: extrasSeleccionados.map(e => ({ id: e.id, precio: e.precio })),
  })
  loading.value = false
}

const formatPrecio = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n ?? 0)
</script>
