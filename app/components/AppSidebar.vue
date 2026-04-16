<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 w-[260px] flex flex-col transform transition-transform duration-200 ease-out lg:static lg:translate-x-0 lg:z-auto bg-[#0f172a] text-slate-400 shadow-sidebar"
    :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <!-- Logo -->
    <div class="px-5 h-16 flex items-center justify-between shrink-0 border-b border-white/[0.06]">
      <div class="flex items-center gap-3">
        <div class="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
          <img src="/img/logo.png" alt="AMSI SRL" class="h-6 w-6 object-contain" />
        </div>
        <div>
          <h1 class="text-[15px] leading-none font-bold tracking-tight text-white">AMSI SRL</h1>
          <p class="text-[11px] text-slate-500 mt-0.5 font-medium">Gestión de Ventas</p>
        </div>
      </div>
      <button class="lg:hidden p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors" @click="sidebarOpen = false">
        <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
      </button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
        :class="isActive(item.to)
          ? 'bg-emerald-500/[0.12] text-emerald-400'
          : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'"
        @click="sidebarOpen = false"
      >
        <UIcon
          :name="item.icon"
          class="w-[18px] h-[18px] shrink-0 transition-colors duration-150"
          :class="isActive(item.to) ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-400'"
        />
        <span>{{ item.label }}</span>
        <div
          v-if="isActive(item.to)"
          class="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400"
        />
      </NuxtLink>
    </nav>

    <!-- Footer -->
    <div class="px-5 py-4 border-t border-white/[0.06] flex justify-center">
      <a href="https://soldemayosoft.com" target="_blank" class="opacity-70 hover:opacity-100 transition-opacity">
        <img src="/img/logo-soldemayosoft.png" alt="SolDeMayoSoft" class="h-8" />
      </a>
    </div>
  </aside>
</template>

<script setup lang="ts">
const sidebarOpen = useSidebarOpen()
const profile = useCurrentProfile()
const route = useRoute()

const isActive = (path: string) => route.path === path

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
    items.push({ to: '/admin/actividad', label: 'Actividad Personal', icon: 'i-heroicons-clock' })
  }
  items.push({ to: '/mi-avatar', label: 'Mi Avatar', icon: 'i-heroicons-user-circle' })
  items.push({ to: '/cambiar-contrasena', label: 'Cambiar Contraseña', icon: 'i-heroicons-key' })
  return items
})
</script>
