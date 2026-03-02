<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:z-auto"
    :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <!-- Logo -->
    <div class="px-6 py-5 border-b border-gray-700 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-white">AMSI SRL</h1>
        <p class="text-xs text-gray-400 mt-0.5">Gestión de Ventas</p>
      </div>
      <button class="lg:hidden text-gray-400 hover:text-white" @click="sidebarOpen = false">
        <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
      </button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="$route.path === item.to
          ? 'bg-primary-600 text-white'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'"
        @click="sidebarOpen = false"
      >
        <UIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
        {{ item.label }}
      </NuxtLink>
    </nav>

    <!-- Footer -->
    <div class="px-6 py-4 border-t border-gray-700">
      <p class="text-xs text-gray-500">
        Desarrollado por
        <a href="https://soldemayosoft.com.ar" target="_blank" class="text-primary-400 hover:underline">
          SolDeMayoSoft
        </a>
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
const sidebarOpen = useSidebarOpen()
const profile = useCurrentProfile()
const route = useRoute()

const navItems = computed(() => {
  const rol = profile.value?.rol
  const items: { to: string; label: string; icon: string }[] = [
    { to: '/dashboard', label: 'Inicio', icon: 'i-heroicons-home' },
    { to: '/ventas/nueva', label: 'Nueva Venta', icon: 'i-heroicons-plus-circle' },
    {
      to: '/ventas',
      label: (rol === 'vendedor' || rol === 'lider') ? 'Mis Ventas' : 'Todas las Ventas',
      icon: 'i-heroicons-table-cells',
    },
  ]
  if (rol === 'admin') {
    items.push({ to: '/admin/usuarios', label: 'Usuarios', icon: 'i-heroicons-users' })
    items.push({ to: '/admin/grupos', label: 'Grupos', icon: 'i-heroicons-user-group' })
    items.push({ to: '/admin/catalogo', label: 'Catálogo', icon: 'i-heroicons-tag' })
  }
  items.push({ to: '/cambiar-contrasena', label: 'Cambiar Contraseña', icon: 'i-heroicons-key' })
  return items
})
</script>
