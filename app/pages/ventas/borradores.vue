<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <UButton
          icon="i-heroicons-arrow-left"
          color="gray"
          variant="ghost"
          size="sm"
          to="/ventas"
        />
        <h2 class="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
          Borradores
        </h2>
        <UBadge v-if="cantidad > 0" color="amber" variant="subtle" :label="String(cantidad)" />
      </div>
      <UButton
        to="/ventas/nueva"
        icon="i-heroicons-plus"
        label="Nueva Venta"
        size="sm"
        class="flex-shrink-0"
      />
    </div>

    <UCard v-if="cantidad > 0">
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        <div
          v-for="borrador in borradores"
          :key="borrador.id"
          class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
              {{ borrador.data.cliente || 'Sin nombre de cliente' }}
            </p>
            <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <span v-if="borrador.data.dni_cuil">DNI: {{ borrador.data.dni_cuil }}</span>
              <span v-if="borrador.data.dir_localidad">{{ borrador.data.dir_localidad }}</span>
              <span>{{ formatFechaRelativa(borrador.actualizado) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <UButton
              icon="i-heroicons-pencil-square"
              color="gray"
              variant="ghost"
              size="xs"
              title="Editar borrador"
              @click="editarBorrador(borrador.id)"
            />
            <UButton
              icon="i-heroicons-trash"
              color="red"
              variant="ghost"
              size="xs"
              title="Eliminar borrador"
              @click="confirmarEliminar(borrador.id)"
            />
          </div>
        </div>
      </div>
    </UCard>

    <div v-else class="text-center py-12">
      <UIcon name="i-heroicons-bookmark" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p class="text-gray-500 dark:text-gray-400 text-sm">No hay borradores guardados.</p>
      <p class="text-gray-400 dark:text-gray-500 text-xs mt-1">
        Cuando crees una venta, podés guardarla como borrador para publicarla después.
      </p>
    </div>

    <!-- Modal de confirmación -->
    <UModal v-model="showModal">
      <UCard>
        <template #header>
          <p class="font-semibold text-gray-800 dark:text-gray-100">Eliminar borrador</p>
        </template>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          ¿Seguro que querés eliminar este borrador? Esta acción no se puede deshacer.
        </p>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="gray" variant="outline" @click="showModal = false" />
            <UButton label="Eliminar" color="red" @click="ejecutarEliminar" />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const toast = useToast()
const { borradores, cantidad, eliminar } = useBorradorVentas()

const showModal = ref(false)
const borradorAEliminar = ref('')

const editarBorrador = (id: string) => {
  navigateTo(`/ventas/nueva?borrador=${id}`)
}

const confirmarEliminar = (id: string) => {
  borradorAEliminar.value = id
  showModal.value = true
}

const ejecutarEliminar = () => {
  eliminar(borradorAEliminar.value)
  showModal.value = false
  toast.add({ title: 'Borrador eliminado', color: 'green' })
}

const formatFechaRelativa = (iso: string) => {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Hace un momento'
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `Hace ${diffHrs}h`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

useHead({ title: 'Borradores — AMSI SRL' })
</script>
