<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800">Catálogo</h2>
    </div>

    <UTabs :items="tabs" v-model="tabActivo">
      <!-- Tab Configuración -->
      <template #configuracion>
        <div class="space-y-4 pt-4 max-w-md">
          <UCard>
            <template #header>
              <h3 class="font-semibold text-gray-800">Precio por boca extra</h3>
              <p class="text-sm text-gray-500 mt-1">Las primeras 3 bocas están incluidas en el paquete. Cada boca adicional (a partir de la 4.ª) suma este precio.</p>
            </template>
            <div class="space-y-4">
              <UFormGroup label="Precio por boca extra *">
                <UInput
                  v-model.number="formConfig.precio_boca_extra"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="w-full"
                />
              </UFormGroup>
              <UAlert v-if="errorConfig" icon="i-heroicons-exclamation-circle" color="red" variant="soft" :title="errorConfig" />
            </div>
            <template #footer>
              <div class="flex justify-end">
                <UButton label="Guardar" :loading="guardandoConfig" @click="guardarConfig" />
              </div>
            </template>
          </UCard>
        </div>
      </template>

      <!-- Tab Paquetes -->
      <template #paquetes>
        <div class="space-y-4 pt-4">
          <div class="flex justify-end">
            <UButton icon="i-heroicons-plus" label="Nuevo Paquete" size="sm" @click="abrirModalPaquete()" />
          </div>
          <UCard>
            <UTable :rows="paquetes" :columns="columnasPaquetes" :loading="loadingPaquetes">
              <template #activo-data="{ row }">
                <UBadge :color="row.activo ? 'green' : 'gray'" :label="row.activo ? 'Activo' : 'Inactivo'" variant="subtle" />
              </template>
              <template #precio-data="{ row }">
                {{ formatPrecio(row.precio) }}
              </template>
              <template #acciones-data="{ row }">
                <div class="flex gap-2">
                  <UButton size="xs" icon="i-heroicons-pencil" color="gray" variant="ghost" @click="abrirModalPaquete(row)" />
                  <UButton
                    size="xs"
                    :icon="row.activo ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                    :color="row.activo ? 'orange' : 'green'"
                    variant="ghost"
                    @click="toggleActivo('paquetes', row)"
                  />
                </div>
              </template>
            </UTable>
          </UCard>
        </div>
      </template>

      <!-- Tab Extras -->
      <template #extras>
        <div class="space-y-4 pt-4">
          <div class="flex justify-end">
            <UButton icon="i-heroicons-plus" label="Nuevo Extra" size="sm" @click="abrirModalExtra()" />
          </div>
          <UCard>
            <UTable :rows="extras" :columns="columnasExtras" :loading="loadingExtras">
              <template #activo-data="{ row }">
                <UBadge :color="row.activo ? 'green' : 'gray'" :label="row.activo ? 'Activo' : 'Inactivo'" variant="subtle" />
              </template>
              <template #precio-data="{ row }">
                {{ formatPrecio(row.precio) }}
              </template>
              <template #acciones-data="{ row }">
                <div class="flex gap-2">
                  <UButton size="xs" icon="i-heroicons-pencil" color="gray" variant="ghost" @click="abrirModalExtra(row)" />
                  <UButton
                    size="xs"
                    :icon="row.activo ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                    :color="row.activo ? 'orange' : 'green'"
                    variant="ghost"
                    @click="toggleActivo('extras', row)"
                  />
                </div>
              </template>
            </UTable>
          </UCard>
        </div>
      </template>
    </UTabs>

    <!-- Modal Paquete -->
    <UModal v-model="showModalPaquete">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">{{ editandoPaquete?.id ? 'Editar Paquete' : 'Nuevo Paquete' }}</h3>
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" size="xs" @click="showModalPaquete = false" />
          </div>
        </template>
        <div class="space-y-4">
          <UFormGroup label="Nombre *">
            <UInput v-model="formPaquete.nombre" placeholder="Ej: Plan Básico" class="w-full" />
          </UFormGroup>
          <UFormGroup label="Precio *">
            <UInput v-model.number="formPaquete.precio" type="number" step="0.01" min="0" placeholder="0.00" class="w-full" />
          </UFormGroup>
          <UAlert v-if="errorModal" icon="i-heroicons-exclamation-circle" color="red" variant="soft" :title="errorModal" />
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="gray" variant="outline" @click="showModalPaquete = false" />
            <UButton :label="editandoPaquete?.id ? 'Guardar Cambios' : 'Crear Paquete'" :loading="guardando" @click="guardarPaquete" />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal Extra -->
    <UModal v-model="showModalExtra">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">{{ editandoExtra?.id ? 'Editar Extra' : 'Nuevo Extra' }}</h3>
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" size="xs" @click="showModalExtra = false" />
          </div>
        </template>
        <div class="space-y-4">
          <UFormGroup label="Nombre *">
            <UInput v-model="formExtra.nombre" placeholder="Ej: Extra Fútbol" class="w-full" />
          </UFormGroup>
          <UFormGroup label="Precio *">
            <UInput v-model.number="formExtra.precio" type="number" step="0.01" min="0" placeholder="0.00" class="w-full" />
          </UFormGroup>
          <UAlert v-if="errorModal" icon="i-heroicons-exclamation-circle" color="red" variant="soft" :title="errorModal" />
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="gray" variant="outline" @click="showModalExtra = false" />
            <UButton :label="editandoExtra?.id ? 'Guardar Cambios' : 'Crear Extra'" :loading="guardando" @click="guardarExtra" />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['role'] })

const client = useSupabaseClient()
const toast = useToast()

const tabs = [
  { label: 'Configuración', slot: 'configuracion' },
  { label: 'Paquetes', slot: 'paquetes' },
  { label: 'Extras', slot: 'extras' },
]
const tabActivo = ref(0)

// ——— Configuración (precio boca extra) ———
const formConfig = reactive({ precio_boca_extra: 0 })
const guardandoConfig = ref(false)
const errorConfig = ref('')

const cargarConfig = async () => {
  const { data } = await client.from('configuracion').select('valor').eq('clave', 'precio_boca_extra').single()
  formConfig.precio_boca_extra = Number(data?.valor ?? 0)
}

const guardarConfig = async () => {
  if (formConfig.precio_boca_extra < 0) {
    errorConfig.value = 'El precio no puede ser negativo.'
    return
  }
  guardandoConfig.value = true
  errorConfig.value = ''
  const { error } = await client
    .from('configuracion')
    .update({ valor: formConfig.precio_boca_extra, updated_at: new Date().toISOString() })
    .eq('clave', 'precio_boca_extra')
  guardandoConfig.value = false
  if (error) { errorConfig.value = error.message; return }
  toast.add({ title: 'Configuración guardada', color: 'green' })
}

// ——— Paquetes ———
const paquetes = ref<any[]>([])
const loadingPaquetes = ref(true)
const showModalPaquete = ref(false)
const editandoPaquete = ref<any>(null)
const formPaquete = reactive({ nombre: '', precio: 0 })
const guardando = ref(false)
const errorModal = ref('')

const columnasPaquetes = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'precio', label: 'Precio' },
  { key: 'activo', label: 'Estado' },
  { key: 'acciones', label: '' },
]

const cargarPaquetes = async () => {
  loadingPaquetes.value = true
  const { data } = await client.from('paquetes').select('*').order('created_at', { ascending: false })
  paquetes.value = data ?? []
  loadingPaquetes.value = false
}

const abrirModalPaquete = (item?: any) => {
  editandoPaquete.value = item ?? null
  formPaquete.nombre = item?.nombre ?? ''
  formPaquete.precio = item?.precio ?? 0
  errorModal.value = ''
  showModalPaquete.value = true
}

const guardarPaquete = async () => {
  if (!formPaquete.nombre || formPaquete.precio < 0) {
    errorModal.value = 'Completá nombre y precio válido.'
    return
  }
  guardando.value = true
  errorModal.value = ''
  if (editandoPaquete.value?.id) {
    const { error } = await client.from('paquetes').update({ nombre: formPaquete.nombre, precio: formPaquete.precio }).eq('id', editandoPaquete.value.id)
    if (error) { errorModal.value = error.message; guardando.value = false; return }
    toast.add({ title: 'Paquete actualizado', color: 'green' })
  } else {
    const { error } = await client.from('paquetes').insert({ nombre: formPaquete.nombre, precio: formPaquete.precio })
    if (error) { errorModal.value = error.message; guardando.value = false; return }
    toast.add({ title: 'Paquete creado', color: 'green' })
  }
  guardando.value = false
  showModalPaquete.value = false
  await cargarPaquetes()
}

// ——— Extras ———
const extras = ref<any[]>([])
const loadingExtras = ref(true)
const showModalExtra = ref(false)
const editandoExtra = ref<any>(null)
const formExtra = reactive({ nombre: '', precio: 0 })

const columnasExtras = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'precio', label: 'Precio' },
  { key: 'activo', label: 'Estado' },
  { key: 'acciones', label: '' },
]

const cargarExtras = async () => {
  loadingExtras.value = true
  const { data } = await client.from('extras').select('*').order('created_at', { ascending: false })
  extras.value = data ?? []
  loadingExtras.value = false
}

const abrirModalExtra = (item?: any) => {
  editandoExtra.value = item ?? null
  formExtra.nombre = item?.nombre ?? ''
  formExtra.precio = item?.precio ?? 0
  errorModal.value = ''
  showModalExtra.value = true
}

const guardarExtra = async () => {
  if (!formExtra.nombre || formExtra.precio < 0) {
    errorModal.value = 'Completá nombre y precio válido.'
    return
  }
  guardando.value = true
  errorModal.value = ''
  if (editandoExtra.value?.id) {
    const { error } = await client.from('extras').update({ nombre: formExtra.nombre, precio: formExtra.precio }).eq('id', editandoExtra.value.id)
    if (error) { errorModal.value = error.message; guardando.value = false; return }
    toast.add({ title: 'Extra actualizado', color: 'green' })
  } else {
    const { error } = await client.from('extras').insert({ nombre: formExtra.nombre, precio: formExtra.precio })
    if (error) { errorModal.value = error.message; guardando.value = false; return }
    toast.add({ title: 'Extra creado', color: 'green' })
  }
  guardando.value = false
  showModalExtra.value = false
  await cargarExtras()
}

// ——— Toggle activo ———
const toggleActivo = async (tabla: 'paquetes' | 'extras', row: any) => {
  await client.from(tabla).update({ activo: !row.activo }).eq('id', row.id)
  if (tabla === 'paquetes') await cargarPaquetes()
  else await cargarExtras()
  toast.add({ title: `${row.activo ? 'Desactivado' : 'Activado'} correctamente`, color: 'green' })
}

const formatPrecio = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

onMounted(() => {
  cargarConfig()
  cargarPaquetes()
  cargarExtras()
})

useHead({ title: 'Catálogo — AMSI SRL' })
</script>
