<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-800">Gestión de Usuarios</h2>
      <UButton
        icon="i-heroicons-plus"
        label="Nuevo Usuario"
        size="sm"
        @click="abrirModal"
      />
    </div>

    <UCard>
      <UTable :rows="usuarios" :columns="columns" :loading="loading">
        <template #rol-data="{ row }">
          <UBadge
            :color="rolColor(row.rol)"
            :label="rolLabel(row.rol)"
            variant="subtle"
          />
        </template>
        <template #created_at-data="{ row }">
          {{ new Date(row.created_at).toLocaleDateString('es-AR') }}
        </template>
      </UTable>
    </UCard>

    <!-- Modal nuevo usuario -->
    <UModal v-model="showModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">Crear Nuevo Usuario</h3>
            <UButton
              icon="i-heroicons-x-mark"
              color="gray"
              variant="ghost"
              size="xs"
              @click="showModal = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Nombre completo *">
            <UInput v-model="nuevoUsuario.nombre" placeholder="Juan García" class="w-full" />
          </UFormGroup>
          <UFormGroup label="Email *">
            <UInput v-model="nuevoUsuario.email" type="email" placeholder="juan@empresa.com" class="w-full" />
          </UFormGroup>
          <UFormGroup label="Contraseña *">
            <UInput v-model="nuevoUsuario.password" type="password" placeholder="Mínimo 6 caracteres" class="w-full" />
          </UFormGroup>
          <UFormGroup label="Rol *">
            <USelect
              v-model="nuevoUsuario.rol"
              :options="[
                { label: 'Vendedor', value: 'vendedor' },
                { label: 'Oficinista', value: 'oficinista' },
              ]"
              class="w-full"
            />
          </UFormGroup>

          <UAlert
            v-if="createError"
            icon="i-heroicons-exclamation-circle"
            color="red"
            variant="soft"
            :title="createError"
          />
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="gray" variant="outline" @click="showModal = false" />
            <UButton label="Crear Usuario" :loading="creating" @click="crearUsuario" />
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
const usuarios = ref<any[]>([])
const showModal = ref(false)
const creating = ref(false)
const createError = ref('')

const nuevoUsuario = reactive({
  nombre: '',
  email: '',
  password: '',
  rol: 'vendedor',
})

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'rol', label: 'Rol' },
  { key: 'created_at', label: 'Creado' },
]

const rolLabel = (r: string) => ({ vendedor: 'Vendedor', oficinista: 'Oficinista', admin: 'Admin' }[r] ?? r)
const rolColor = (r: string): any => ({ admin: 'red', oficinista: 'yellow', vendedor: 'blue' }[r] ?? 'gray')

const cargarUsuarios = async () => {
  loading.value = true
  const { data } = await client
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  usuarios.value = data ?? []
  loading.value = false
}

onMounted(cargarUsuarios)

const abrirModal = () => {
  Object.assign(nuevoUsuario, { nombre: '', email: '', password: '', rol: 'vendedor' })
  createError.value = ''
  showModal.value = true
}

const crearUsuario = async () => {
  if (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.password) {
    createError.value = 'Completá todos los campos.'
    return
  }
  if (nuevoUsuario.password.length < 6) {
    createError.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }

  creating.value = true
  createError.value = ''

  const { data, error } = await client.rpc('admin_create_user', {
    p_email: nuevoUsuario.email,
    p_password: nuevoUsuario.password,
    p_nombre: nuevoUsuario.nombre,
    p_rol: nuevoUsuario.rol,
  })

  if (error) {
    createError.value = error.message
    creating.value = false
    return
  }

  toast.add({ title: `Usuario ${nuevoUsuario.nombre} creado`, color: 'green' })
  showModal.value = false
  creating.value = false
  await cargarUsuarios()
}

useHead({ title: 'Usuarios — AMSI SRL' })
</script>
