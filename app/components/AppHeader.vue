<template>
  <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 flex-shrink-0 gap-2 dark:bg-[#0c162b] dark:border-[#22314d]">
    <div class="flex items-center gap-2 min-w-0">
      <button class="lg:hidden p-1.5 -ml-1 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#14213b]" @click="sidebarOpen = true">
        <UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
      </button>
      <h2 class="text-4xl leading-none font-bold text-gray-900 truncate dark:text-white">{{ pageTitle }}</h2>
    </div>
    <div class="flex items-center gap-2 sm:gap-4 flex-shrink-0">
      <div class="text-right hidden sm:block">
        <p class="text-xl leading-none font-semibold text-gray-800 dark:text-gray-100">{{ profile?.nombre }}</p>
        <p class="text-base leading-none mt-1 text-gray-500 capitalize dark:text-gray-400">{{ rolLabel }}</p>
      </div>
      <UButton
        icon="i-heroicons-arrow-right-on-rectangle"
        color="gray"
        variant="solid"
        size="sm"
        @click="logout"
        :loading="loading"
        class="hidden sm:inline-flex rounded-lg px-4 bg-slate-900 hover:bg-slate-800 text-white"
        label="Salir"
      />
      <UButton
        icon="i-heroicons-arrow-right-on-rectangle"
        color="gray"
        variant="solid"
        size="sm"
        @click="logout"
        :loading="loading"
        class="sm:hidden bg-slate-900 hover:bg-slate-800 text-white"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
const sidebarOpen = useSidebarOpen()
const client = useSupabaseClient()
const profile = useCurrentProfile()
const route = useRoute()
const loading = ref(false)

const rolLabel = computed(() => {
  const labels: Record<string, string> = {
    vendedor: 'Vendedor',
    oficinista: 'Oficinista',
    lider: 'Líder',
    admin: 'Administrador',
  }
  return labels[profile.value?.rol ?? 'vendedor']
})

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/ventas': 'Ventas',
    '/ventas/nueva': 'Nueva Venta',
    '/admin/usuarios': 'Gestión de Usuarios',
    '/cambiar-contrasena': 'Cambiar Contraseña',
  }
  return titles[route.path] ?? 'AMSI SRL'
})

const logout = async () => {
  loading.value = true
  const currentProfile = useCurrentProfile()
  currentProfile.value = null
  await client.auth.signOut()
  loading.value = false
  await navigateTo('/login')
}
</script>
