<template>
  <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
    <h2 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h2>
    <div class="flex items-center gap-4">
      <div class="text-right">
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
        label="Salir"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
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
