<template>
  <div class="mx-auto transition-[max-width] duration-300" :class="layout === 'compacta' ? 'max-w-3xl lg:max-w-none' : 'max-w-3xl'">
    <UCard :ui="{ body: { padding: 'px-3 py-4 sm:p-5' }, header: { padding: 'px-3 py-3 sm:px-5 sm:py-4' } }">
      <template #header>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <h2 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
              {{ borradorId ? 'Editar Borrador' : 'Nueva Venta' }}
            </h2>
            <UBadge v-if="borradorId" color="amber" variant="subtle" label="Borrador" />
          </div>
          <VentaLayoutToggle />
        </div>
      </template>
      <div
        v-if="prospectoOrigen"
        class="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-[13px] font-medium"
      >
        <UIcon name="i-heroicons-map-pin" class="w-4 h-4 shrink-0" />
        Venta desde el prospecto
        <span class="font-bold">{{ prospectoOrigen.nombre || 'sin nombre' }}</span>
        — al guardarla, el pin del mapa pasa a "Contratado".
      </div>
      <VentaForm
        :key="formKey"
        :initial-data="initialData"
        :prefill="prefillData"
        submit-label="Guardar Venta"
        :show-cancel="true"
        :on-submit="guardarVenta"
        :hide-gestion-fields="true"
        @cancel="navigateTo('/ventas')"
      >
        <template #extra-actions="{ formData }">
          <UButton
            label="Guardar borrador"
            color="amber"
            variant="outline"
            icon="i-heroicons-bookmark"
            size="md"
            :block="true"
            class="justify-center sm:w-auto"
            @click="guardarBorrador(formData)"
          />
        </template>
      </VentaForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const toast = useToast()
const { guardar, obtener, eliminar } = useBorradorVentas()

const layout = useVentaFormLayout()
const borradorId = ref((route.query.borrador as string) || '')
const initialData = ref<Record<string, any> | undefined>(undefined)
const formKey = ref(0)

// Cargar datos del borrador si viene por query
if (borradorId.value) {
  const borrador = obtener(borradorId.value)
  if (borrador) {
    initialData.value = { ...borrador.data }
  } else {
    borradorId.value = ''
  }
}

// Venta desde un prospecto del mapa (?prospecto=id): prefill sin activar modo edición
const prospectoId = ref((route.query.prospecto as string) || '')
const prospectoOrigen = ref<Record<string, any> | null>(null)
const prefillData = ref<Record<string, any> | undefined>(undefined)

if (prospectoId.value && !borradorId.value) {
  const client = useSupabaseClient()
  const { data } = await client
    .from('prospectos')
    .select('id, nombre, telefono, dir_calle, dir_entre_calles, dir_localidad, dir_aclaracion')
    .eq('id', prospectoId.value)
    .maybeSingle()
  if (data) {
    prospectoOrigen.value = data
    prefillData.value = {
      cliente: data.nombre ?? '',
      telefono: data.telefono ?? '',
      dir_calle: data.dir_calle ?? '',
      dir_entre_calles: data.dir_entre_calles ?? '',
      dir_localidad: data.dir_localidad ?? '',
      dir_aclaracion: data.dir_aclaracion ?? '',
    }
    formKey.value++
  } else {
    prospectoId.value = ''
  }
}

const guardarBorrador = (formData: Record<string, any>) => {
  const id = guardar(formData, borradorId.value || undefined)
  borradorId.value = id
  toast.add({ title: 'Borrador guardado en el dispositivo', color: 'amber', icon: 'i-heroicons-bookmark' })
}

const guardarVenta = async (data: Record<string, any>) => {
  try {
    const result = await $fetch('/api/ventas', {
      method: 'POST',
      body: data,
    })

    // Si venía de un borrador, eliminarlo al publicar
    if (borradorId.value) {
      eliminar(borradorId.value)
    }

    // Si venía de un prospecto, vincularlo (pin → contratado). Best-effort.
    const ventaId = (result as any).id
    if (prospectoId.value && ventaId) {
      try {
        await $fetch('/api/prospectos/link-venta', {
          method: 'POST',
          body: { prospecto_id: prospectoId.value, venta_id: ventaId },
        })
      } catch {
        toast.add({
          title: 'Venta guardada, pero no se pudo vincular el prospecto',
          description: 'Podés vincularlo desde la ficha del prospecto.',
          color: 'orange',
        })
      }
    }

    if (result.warning) {
      toast.add({ title: 'Venta guardada pero error en extras', description: result.warning, color: 'orange' })
    } else {
      toast.add({ title: 'Venta guardada correctamente', color: 'green' })
    }
    await navigateTo('/ventas')
  } catch (err: any) {
    toast.add({ title: 'Error al guardar', description: err.data?.statusMessage || err.message, color: 'red' })
  }
}

useHead({ title: borradorId.value ? 'Editar Borrador — AMSI SRL' : 'Nueva Venta — AMSI SRL' })
</script>
