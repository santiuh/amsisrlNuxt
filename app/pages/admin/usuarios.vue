<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg sm:text-xl font-semibold text-gray-800 truncate">Gestión de Usuarios</h2>
      <UButton
        icon="i-heroicons-plus"
        label="Nuevo Usuario"
        size="sm"
        class="flex-shrink-0"
        @click="abrirModalCrear"
      />
    </div>

    <UCard>
      <div class="overflow-x-auto -mx-4 sm:mx-0">
      <UTable :rows="usuarios" :columns="columns" :loading="loading">
        <template #rol-data="{ row }">
          <UBadge
            :color="rolColor(row.rol)"
            :label="rolLabel(row.rol)"
            variant="subtle"
          />
        </template>
        <template #created_at-data="{ row }">
          {{ formatFecha(row.created_at) }}
        </template>
        <template #acciones-data="{ row }">
          <div class="flex gap-1">
            <UButton
              icon="i-heroicons-pencil-square"
              size="xs"
              color="gray"
              variant="ghost"
              label="Editar"
              @click="abrirModalEditar(row)"
            />
            <UButton
              icon="i-heroicons-key"
              size="xs"
              color="orange"
              variant="ghost"
              label="Resetear clave"
              @click="abrirModalReset(row)"
            />
          </div>
        </template>
      </UTable>
      </div>
    </UCard>

    <!-- Modal crear usuario -->
    <UModal v-model="showModalCrear">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">Crear Nuevo Usuario</h3>
            <UButton
              icon="i-heroicons-x-mark"
              color="gray"
              variant="ghost"
              size="xs"
              @click="showModalCrear = false"
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
              :options="opcionesRol"
              class="w-full"
            />
          </UFormGroup>
          <UCheckbox v-model="nuevoUsuario.puede_vender_ultra" label="Puede vender Ultra" />

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
            <UButton label="Cancelar" color="gray" variant="outline" @click="showModalCrear = false" />
            <UButton label="Crear Usuario" :loading="creating" @click="crearUsuario" />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal resetear contraseña -->
    <UModal v-model="showModalReset">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">Resetear Contraseña</h3>
            <UButton
              icon="i-heroicons-x-mark"
              color="gray"
              variant="ghost"
              size="xs"
              @click="showModalReset = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <template v-if="!resetDone">
            <UAlert
              icon="i-heroicons-information-circle"
              color="orange"
              variant="soft"
              title="Se generará una contraseña temporal. El usuario será obligado a cambiarla en su próximo inicio de sesión."
            />
            <UFormGroup label="Usuario">
              <UInput :model-value="`${usuarioReseteando.nombre} (${usuarioReseteando.email})`" disabled class="w-full" />
            </UFormGroup>

            <UAlert
              v-if="resetError"
              icon="i-heroicons-exclamation-circle"
              color="red"
              variant="soft"
              :title="resetError"
            />
          </template>

          <template v-else>
            <UAlert
              icon="i-heroicons-check-circle"
              color="green"
              variant="soft"
              title="Contraseña reseteada correctamente"
            />
            <UFormGroup label="Contraseña temporal generada">
              <div class="flex gap-2">
                <UInput :model-value="resetPassword" readonly class="w-full font-mono" />
                <UButton
                  icon="i-heroicons-clipboard-document"
                  color="gray"
                  variant="solid"
                  @click="copiarClave"
                />
              </div>
            </UFormGroup>
            <p class="text-sm text-gray-500">Copiá esta contraseña y pasásela al usuario. No se volverá a mostrar.</p>
          </template>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <template v-if="!resetDone">
              <UButton label="Cancelar" color="gray" variant="outline" @click="showModalReset = false" />
              <UButton label="Generar nueva contraseña" color="orange" :loading="resetting" @click="resetearContrasena" />
            </template>
            <UButton v-else label="Cerrar" color="gray" variant="outline" @click="showModalReset = false" />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal editar usuario -->
    <UModal v-model="showModalEditar">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">Editar Usuario</h3>
            <UButton
              icon="i-heroicons-x-mark"
              color="gray"
              variant="ghost"
              size="xs"
              @click="showModalEditar = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Email">
            <UInput :model-value="usuarioEditando.email" disabled class="w-full" />
          </UFormGroup>
          <UFormGroup label="Nombre completo *">
            <UInput v-model="usuarioEditando.nombre" placeholder="Juan García" class="w-full" />
          </UFormGroup>
          <UFormGroup label="Rol *">
            <USelect
              v-model="usuarioEditando.rol"
              :options="opcionesRol"
              class="w-full"
            />
          </UFormGroup>
          <UCheckbox v-model="usuarioEditando.puede_vender_ultra" label="Puede vender Ultra" />

          <UAlert
            v-if="editError"
            icon="i-heroicons-exclamation-circle"
            color="red"
            variant="soft"
            :title="editError"
          />
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Cancelar" color="gray" variant="outline" @click="showModalEditar = false" />
            <UButton label="Guardar Cambios" :loading="saving" @click="guardarCambios" />
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

// Modal crear
const showModalCrear = ref(false)
const creating = ref(false)
const createError = ref('')

// Modal editar
const showModalEditar = ref(false)
const saving = ref(false)
const editError = ref('')

// Modal resetear contraseña
const showModalReset = ref(false)
const resetting = ref(false)
const resetError = ref('')
const resetPassword = ref('')
const resetDone = ref(false)
const usuarioReseteando = reactive({ id: '', email: '', nombre: '' })

const generarPassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const nuevoUsuario = reactive({
  nombre: '',
  email: '',
  password: '',
  rol: 'vendedor',
  puede_vender_ultra: false,
})

const usuarioEditando = reactive({
  id: '',
  nombre: '',
  email: '',
  rol: 'vendedor',
  puede_vender_ultra: false,
})

const opcionesRol = [
  { label: 'Vendedor', value: 'vendedor' },
  { label: 'Líder de Grupo', value: 'lider' },
  { label: 'Oficinista', value: 'oficinista' },
  { label: 'Admin', value: 'admin' },
]

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'email', label: 'Email' },
  { key: 'rol', label: 'Rol' },
  { key: 'created_at', label: 'Creado' },
  { key: 'acciones', label: '' },
]

const rolLabel = (r: string) => ({ vendedor: 'Vendedor', lider: 'Líder', oficinista: 'Oficinista', admin: 'Admin' }[r] ?? r)
const rolColor = (r: string): any => ({ admin: 'red', oficinista: 'yellow', vendedor: 'blue', lider: 'orange' }[r] ?? 'gray')

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

const abrirModalCrear = () => {
  Object.assign(nuevoUsuario, { nombre: '', email: '', password: '', rol: 'vendedor', puede_vender_ultra: false })
  createError.value = ''
  showModalCrear.value = true
}

const abrirModalEditar = (row: any) => {
  Object.assign(usuarioEditando, {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    rol: row.rol,
    puede_vender_ultra: row.puede_vender_ultra ?? false,
  })
  editError.value = ''
  showModalEditar.value = true
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

  try {
    await $fetch('/api/admin/usuarios', {
      method: 'POST',
      body: {
        email: nuevoUsuario.email,
        password: nuevoUsuario.password,
        nombre: nuevoUsuario.nombre,
        rol: nuevoUsuario.rol,
        puede_vender_ultra: nuevoUsuario.puede_vender_ultra,
      },
    })
    toast.add({ title: `Usuario ${nuevoUsuario.nombre} creado`, color: 'green' })
    showModalCrear.value = false
    await cargarUsuarios()
  } catch (err: any) {
    createError.value = err.data?.statusMessage || 'Error al crear usuario'
  } finally {
    creating.value = false
  }
}

const abrirModalReset = (row: any) => {
  Object.assign(usuarioReseteando, { id: row.id, email: row.email, nombre: row.nombre })
  resetPassword.value = ''
  resetError.value = ''
  resetDone.value = false
  showModalReset.value = true
}

const resetearContrasena = async () => {
  resetting.value = true
  resetError.value = ''
  const tempPassword = generarPassword()

  try {
    await $fetch(`/api/admin/usuarios/${usuarioReseteando.id}`, {
      method: 'PATCH',
      body: { password: tempPassword },
    })
    resetPassword.value = tempPassword
    resetDone.value = true
  } catch (err: any) {
    resetError.value = err.data?.statusMessage || 'Error al resetear contraseña'
  } finally {
    resetting.value = false
  }
}

const copiarClave = async () => {
  await navigator.clipboard.writeText(resetPassword.value)
  toast.add({ title: 'Contraseña copiada al portapapeles', color: 'green' })
}

const guardarCambios = async () => {
  if (!usuarioEditando.nombre.trim()) {
    editError.value = 'El nombre no puede estar vacío.'
    return
  }

  saving.value = true
  editError.value = ''

  try {
    await $fetch(`/api/admin/usuarios/${usuarioEditando.id}`, {
      method: 'PUT',
      body: {
        nombre: usuarioEditando.nombre.trim(),
        rol: usuarioEditando.rol,
        puede_vender_ultra: usuarioEditando.puede_vender_ultra,
      },
    })
    toast.add({ title: `Usuario ${usuarioEditando.nombre} actualizado`, color: 'green' })
    showModalEditar.value = false
    await cargarUsuarios()
  } catch (err: any) {
    editError.value = err.data?.statusMessage || 'Error al actualizar usuario'
  } finally {
    saving.value = false
  }
}

useHead({ title: 'Usuarios — AMSI SRL' })
</script>
