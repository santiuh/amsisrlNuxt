<template>
  <header class="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 flex-shrink-0 gap-2">
    <div class="flex items-center gap-2 min-w-0">
      <button class="lg:hidden p-1.5 -ml-1 rounded-md text-gray-500 hover:bg-gray-100" @click="sidebarOpen = true">
        <UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
      </button>
      <h2 class="text-base sm:text-lg font-semibold text-gray-800 truncate">{{ pageTitle }}</h2>
    </div>
    <div class="flex items-center gap-2 sm:gap-4 flex-shrink-0">
      <div class="text-right hidden sm:block">
        <p class="text-sm font-medium text-gray-800">{{ profile?.nombre }}</p>
        <p class="text-xs text-gray-500 capitalize">{{ rolLabel }}</p>
      </div>
      <UButton
        icon="i-heroicons-arrow-right-on-rectangle"
        color="gray"
        variant="ghost"
        size="sm"
        @click="logout"
        :loading="loading"
        class="hidden sm:inline-flex"
        label="Salir"
      />
      <UButton
        icon="i-heroicons-arrow-right-on-rectangle"
        color="gray"
        variant="ghost"
        size="sm"
        @click="logout"
        :loading="loading"
        class="sm:hidden"
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
