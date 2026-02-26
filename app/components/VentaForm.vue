<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormGroup label="Cliente *" class="md:col-span-2">
        <UInput v-model="form.cliente" placeholder="Nombre completo del cliente" class="w-full" />
      </UFormGroup>

      <UFormGroup label="DNI / CUIL *">
        <UInput v-model="form.dni_cuil" placeholder="20123456789" class="w-full" />
      </UFormGroup>

      <UFormGroup label="Teléfono">
        <UInput v-model="form.telefono" placeholder="1123456789" class="w-full" />
      </UFormGroup>

      <UFormGroup label="Dirección" class="md:col-span-2">
        <UInput v-model="form.direccion" placeholder="Calle 123, Ciudad" class="w-full" />
      </UFormGroup>

      <UFormGroup label="Paquete *">
        <USelect
          v-model="form.paquete"
          :options="paqueteOptions"
          placeholder="Seleccionar paquete"
          class="w-full"
        />
      </UFormGroup>

      <UFormGroup label="Precio *">
        <UInput v-model.number="form.precio" type="number" step="0.01" min="0" placeholder="0.00" class="w-full" />
      </UFormGroup>

      <UFormGroup label="Forma de Pago *">
        <USelect
          v-model="form.forma_pago"
          :options="formaPagoOptions"
          placeholder="Seleccionar forma de pago"
          class="w-full"
        />
      </UFormGroup>

      <!-- Estado: visible en modo edición para oficinista/admin -->
      <UFormGroup v-if="canEditEstado" label="Estado">
        <USelect v-model="form.estado" :options="estadoOptions" class="w-full" />
      </UFormGroup>

      <UFormGroup label="Comentarios de Venta" class="md:col-span-2">
        <UTextarea
          v-model="form.comentarios_venta"
          placeholder="Observaciones adicionales de la venta..."
          :rows="3"
          class="w-full"
        />
      </UFormGroup>

      <!-- Comentarios de Gestión: solo oficinista/admin -->
      <UFormGroup
        v-if="canEditGestion"
        label="Comentarios de Gestión"
        class="md:col-span-2"
      >
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

const profile = useCurrentProfile()

const canEditEstado = computed(() =>
  !!props.initialData && ['oficinista', 'admin'].includes(profile.value?.rol ?? '')
)
const canEditGestion = computed(() =>
  ['oficinista', 'admin'].includes(profile.value?.rol ?? '')
)

const form = reactive({
  cliente: '',
  dni_cuil: '',
  telefono: '',
  direccion: '',
  paquete: '',
  precio: 0,
  forma_pago: '',
  estado: 'pendiente',
  comentarios_venta: '',
  comentarios_gestion: '',
  ...(props.initialData ?? {}),
})

const paqueteOptions = [
  { label: 'Básico', value: 'basico' },
  { label: 'Intermedio', value: 'intermedio' },
  { label: 'Premium', value: 'premium' },
]

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
  if (!form.cliente || !form.dni_cuil || !form.paquete || !form.forma_pago || !form.precio) {
    errorMsg.value = 'Por favor completá todos los campos obligatorios (*).'
    return
  }
  errorMsg.value = ''
  loading.value = true
  emit('submit', { ...form })
  loading.value = false
}
</script>
