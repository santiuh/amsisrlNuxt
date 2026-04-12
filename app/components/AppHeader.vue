<template>
  <header class="h-16 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0 gap-3 border-b border-gray-200/60 dark:bg-[#111827]/80 dark:border-white/[0.06]">
    <div class="flex items-center gap-3 min-w-0">
      <button
        class="lg:hidden p-1.5 -ml-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/5 transition-colors"
        @click="sidebarOpen = true"
      >
        <UIcon name="i-heroicons-bars-3" class="w-5 h-5" />
      </button>
      <h2 class="text-lg sm:text-xl font-semibold text-gray-900 truncate dark:text-white tracking-tight">
        {{ pageTitle }}
      </h2>
    </div>

    <div class="flex items-center gap-3 shrink-0">
      <!-- User info (desktop) -->
      <div class="hidden sm:flex items-center gap-3">
        <div class="text-right mr-1">
          <p class="text-sm font-semibold text-gray-800 leading-none dark:text-gray-100">{{ profile?.nombre }}</p>
          <p class="text-xs text-gray-400 capitalize mt-0.5 dark:text-slate-500">{{ rolLabel }}</p>
        </div>
        <NuxtLink
          to="/mi-avatar"
          class="w-9 h-9 rounded-full overflow-hidden ring-2 ring-gray-100 hover:ring-emerald-200 transition-all duration-200 shrink-0 dark:ring-white/10 dark:hover:ring-emerald-500/30"
        >
          <UserAvatar :config="profile?.avatar_config ?? null" :seed="profile?.nombre" class="w-full h-full" />
        </NuxtLink>
      </div>

      <!-- Logout -->
      <UButton
        icon="i-heroicons-arrow-right-on-rectangle"
        color="gray"
        variant="ghost"
        size="sm"
        @click="logout"
        :loading="loading"
        class="hidden sm:inline-flex text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
        label="Salir"
      />
      <UButton
        icon="i-heroicons-arrow-right-on-rectangle"
        color="gray"
        variant="ghost"
        size="sm"
        @click="logout"
        :loading="loading"
        class="sm:hidden text-gray-400 dark:text-slate-500"
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
    '/mi-avatar': 'Mi Avatar',
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
