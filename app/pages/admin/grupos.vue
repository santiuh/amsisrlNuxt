<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800">Gestión de Grupos</h2>
      <UButton
        icon="i-heroicons-plus"
        label="Nuevo Grupo"
        size="sm"
        @click="abrirModalCrear"
      />
    </div>

    <UCard>
      <UTable :rows="grupos" :columns="columnasGrupos" :loading="loading">
        <template #lider-data="{ row }">
          <span class="font-medium">{{ row.lider?.nombre ?? '—' }}</span>
        </template>
        <template #miembros-data="{ row }">
          <UBadge color="blue" variant="subtle">
            {{ row.miembros?.length ?? 0 }} vendedores
          </UBadge>
        </template>
        <template #actions-data="{ row }">
          <UButton
            size="xs"
            icon="i-heroicons-users"
            label="Miembros"
            color="gray"
            variant="outline"
            @click="abrirModalMiembros(row)"
          />
        </template>
      </UTable>
    </UCard>

    <!-- Modal: Crear grupo -->
    <UModal v-model="showModalCrear">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">Nuevo Grupo</h3>
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" size="xs" @click="showModalCrear = false" />
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Líder del grupo *">
            <USelect
              v-model="nuevoGrupo.lider_id"
              :options="opcionesLideresParaModal"
              placeholder="Seleccionar líder"
              class="w-full"
            />
          </UFormGroup>
          <UAlert
            v-if="errorCrear"
            icon="i-heroicons-exclamation-circle"
            color="red"
            variant="soft"
            :title="errorCrear"
          />
          <p v-if="opcionesLideresParaModal.length === 0" class="text-sm text-gray-500">
            No hay usuarios con rol Líder disponibles. Creá primero un usuario con ese rol desde
            <NuxtLink to="/admin/usuarios" class="text-primary-500 underline">Gestión de Usuarios</NuxtLink>.
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="gray" variant="outline" @click="showModalCrear = false" />
            <UButton label="Crear Grupo" :loading="creando" :disabled="!nuevoGrupo.lider_id" @click="crearGrupo" />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Gestionar miembros -->
    <UModal v-model="showModalMiembros">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">
              Miembros — {{ grupoSeleccionado?.lider?.nombre }}
            </h3>
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" size="xs" @click="showModalMiembros = false" />
          </div>
        </template>

        <div class="space-y-2">
          <p class="text-sm text-gray-500 mb-3">Seleccioná los vendedores que pertenecen a este grupo.</p>
          <div
            v-for="vendedor in todosVendedores"
            :key="vendedor.id"
            class="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
          >
            <input
              type="checkbox"
              :id="`v-${vendedor.id}`"
              :value="vendedor.id"
              v-model="miembrosSeleccionados"
              class="w-4 h-4 accent-primary-500"
            />
            <label :for="`v-${vendedor.id}`" class="text-sm cursor-pointer flex-1">
              {{ vendedor.nombre }}
              <span v-if="vendedor.grupo_id && vendedor.grupo_id !== grupoSeleccionado?.id" class="text-xs text-orange-500 ml-1">
                (en otro grupo)
              </span>
            </label>
          </div>
          <p v-if="todosVendedores.length === 0" class="text-sm text-gray-400">No hay vendedores disponibles.</p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="gray" variant="outline" @click="showModalMiembros = false" />
            <UButton label="Guardar Cambios" :loading="guardando" @click="guardarMiembros" />
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

const loading = ref(true)
const grupos = ref<any[]>([])
const todosVendedores = ref<any[]>([])
const lideresSinGrupo = ref<any[]>([])

// Modal crear
const showModalCrear = ref(false)
const nuevoGrupo = reactive({ lider_id: '' })
const creando = ref(false)
const errorCrear = ref('')

// Modal miembros
const showModalMiembros = ref(false)
const grupoSeleccionado = ref<any>(null)
const miembrosSeleccionados = ref<string[]>([])
const guardando = ref(false)

const columnasGrupos = [
  { key: 'lider', label: 'Líder' },
  { key: 'miembros', label: 'Miembros' },
  { key: 'actions', label: '' },
]

const opcionesLideresParaModal = computed(() =>
  lideresSinGrupo.value.map(l => ({ label: l.nombre, value: l.id }))
)

const cargarDatos = async () => {
  loading.value = true

  // Cargar grupos con lider y miembros via FK aliases
  const { data: gruposData } = await client
    .from('grupos')
    .select('id, created_at, lider:profiles!grupos_lider_id_fkey(id, nombre), miembros:profiles!profiles_grupo_id_fkey(id, nombre)')
    .order('created_at', { ascending: false })
  grupos.value = gruposData ?? []

  // Todos los vendedores
  const { data: vendedoresData } = await client
    .from('profiles')
    .select('id, nombre, grupo_id')
    .eq('rol', 'vendedor')
    .order('nombre')
  todosVendedores.value = vendedoresData ?? []

  // Lideres sin grupo asignado aún
  const lideresConGrupo = new Set((gruposData ?? []).map((g: any) => g.lider?.id).filter(Boolean))
  const { data: lideresData } = await client
    .from('profiles')
    .select('id, nombre')
    .eq('rol', 'lider')
    .order('nombre')
  lideresSinGrupo.value = (lideresData ?? []).filter((l: any) => !lideresConGrupo.has(l.id))

  loading.value = false
}

onMounted(cargarDatos)

const abrirModalCrear = () => {
  nuevoGrupo.lider_id = ''
  errorCrear.value = ''
  showModalCrear.value = true
}

const crearGrupo = async () => {
  if (!nuevoGrupo.lider_id) return
  creando.value = true
  errorCrear.value = ''
  const { error } = await client.rpc('admin_create_grupo', { p_lider_id: nuevoGrupo.lider_id })
  if (error) {
    errorCrear.value = error.message
    creando.value = false
    return
  }
  toast.add({ title: 'Grupo creado', color: 'green' })
  showModalCrear.value = false
  creando.value = false
  await cargarDatos()
}

const abrirModalMiembros = (grupo: any) => {
  grupoSeleccionado.value = grupo
  miembrosSeleccionados.value = (grupo.miembros ?? []).map((m: any) => m.id)
  showModalMiembros.value = true
}

const guardarMiembros = async () => {
  if (!grupoSeleccionado.value) return
  guardando.value = true
  const { error } = await client.rpc('admin_set_grupo_members', {
    p_grupo_id: grupoSeleccionado.value.id,
    p_vendedor_ids: miembrosSeleccionados.value,
  })
  if (error) {
    toast.add({ title: 'Error al guardar', description: error.message, color: 'red' })
    guardando.value = false
    return
  }
  toast.add({ title: 'Miembros actualizados', color: 'green' })
  showModalMiembros.value = false
  guardando.value = false
  await cargarDatos()
}

useHead({ title: 'Grupos — AMSI SRL' })
</script>
