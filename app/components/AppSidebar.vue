<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 w-64 bg-white text-gray-700 flex flex-col border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:z-auto dark:bg-[#0c162b] dark:text-gray-200 dark:border-[#22314d]"
    :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <!-- Logo -->
    <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between dark:border-[#22314d]">
      <div class="flex items-center gap-3">
        <img src="/img/logo.png" alt="AMSI SRL" class="h-11 w-11 rounded-xl shadow-sm object-contain bg-[#1e293b] p-1" />
        <div>
          <h1 class="text-3xl leading-none font-extrabold tracking-tight text-gray-800 dark:text-gray-100">AMSI SRL</h1>
          <p class="text-sm text-gray-500 mt-1 dark:text-gray-400">Gestión de Ventas</p>
        </div>
      </div>
      <button class="lg:hidden text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200" @click="sidebarOpen = false">
        <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
      </button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base leading-none font-medium transition-all"
        :class="$route.path === item.to
          ? 'bg-gradient-to-r from-[#0ea777] to-[#19c58e] text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-[#14213b] dark:hover:text-white'"
        @click="sidebarOpen = false"
      >
        <UIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" :class="$route.path === item.to ? 'text-white' : 'text-gray-500 dark:text-gray-400'" />
        {{ item.label }}
      </NuxtLink>
    </nav>

    <!-- Footer -->
    <div class="px-6 py-5 border-t border-gray-200 dark:border-[#22314d] flex justify-center">
      <a href="https://soldemayosoft.com" target="_blank">
        <img src="/img/logo-soldemayosoft.png" alt="SolDeMayoSoft" class="h-10" />
      </a>
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
  if (rol !== 'admin') {
    items.push({ to: '/comisiones', label: 'Mis Comisiones', icon: 'i-heroicons-banknotes' })
  }
  if (rol === 'admin') {
    items.push({ to: '/admin/usuarios', label: 'Usuarios', icon: 'i-heroicons-users' })
    items.push({ to: '/admin/grupos', label: 'Grupos', icon: 'i-heroicons-user-group' })
    items.push({ to: '/admin/catalogo', label: 'Catálogo', icon: 'i-heroicons-tag' })
    items.push({ to: '/admin/comisiones', label: 'Comisiones', icon: 'i-heroicons-calculator' })
  }
  items.push({ to: '/mi-avatar', label: 'Mi Avatar', icon: 'i-heroicons-user-circle' })
  items.push({ to: '/cambiar-contrasena', label: 'Cambiar Contraseña', icon: 'i-heroicons-key' })
  return items
})
</script>
