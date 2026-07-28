<template>
  <Teleport to="body">
    <div class="md:hidden">
      <!-- Backdrop (no cubre la bottom nav: deja el botón Menú accesible para cerrar) -->
      <Transition name="fade">
        <div
          v-if="open"
          class="fixed top-0 inset-x-0 z-40 bg-black/45 backdrop-blur-sm"
          :style="{ bottom: 'calc(116px + env(safe-area-inset-bottom))' }"
          aria-hidden="true"
          @click="open = false"
        />
      </Transition>

      <!-- Panel -->
      <Transition name="slide-right">
        <aside
          v-if="open"
          class="fixed top-0 right-0 z-50 w-[86%] max-w-[360px] flex flex-col bg-white dark:bg-[#0b1220] shadow-[-16px_0_48px_-12px_rgba(0,0,0,0.18)] dark:shadow-[-16px_0_48px_-12px_rgba(0,0,0,0.6)]"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          :style="{ paddingTop: 'env(safe-area-inset-top)', bottom: 'calc(116px + env(safe-area-inset-bottom))' }"
        >
          <!-- Top bar -->
          <div class="h-12 px-4 flex items-center shrink-0 border-b border-gray-100 dark:border-white/[0.06]">
            <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-slate-500">
              Menú
            </p>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-4 py-5 space-y-6">
            <!-- Navegación -->
            <section>
              <p class="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-slate-500">
                Navegación
              </p>
              <div class="rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] ring-1 ring-gray-100 dark:ring-white/[0.04] overflow-hidden">
                <NuxtLink
                  v-for="(item, idx) in navItems"
                  :key="item.to"
                  :to="item.to"
                  class="flex items-center gap-3 px-3 py-2.5 active:bg-gray-100/70 dark:active:bg-white/[0.04] transition-colors"
                  :class="[
                    idx > 0 ? 'border-t border-gray-100 dark:border-white/[0.04]' : '',
                    isActive(item.to) ? 'bg-cyan-50/60 dark:bg-cyan-500/[0.08]' : ''
                  ]"
                  @click="open = false"
                >
                  <span
                    class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    :class="isActive(item.to)
                      ? 'bg-gradient-to-br from-cyan-400 to-sky-500 text-white shadow-[0_4px_10px_-2px_rgba(8,145,178,0.45)]'
                      : 'bg-cyan-100/70 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300'"
                  >
                    <UIcon :name="item.icon" class="w-[18px] h-[18px]" />
                  </span>
                  <span
                    class="flex-1 text-[14px] font-semibold leading-none"
                    :class="isActive(item.to)
                      ? 'text-cyan-700 dark:text-cyan-300'
                      : 'text-gray-800 dark:text-slate-200'"
                  >
                    {{ item.label }}
                  </span>
                  <UIcon
                    name="i-heroicons-chevron-right"
                    class="w-4 h-4 text-gray-300 dark:text-slate-600"
                  />
                </NuxtLink>
              </div>
            </section>

            <!-- Cuenta -->
            <section v-if="profile">
              <p class="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-slate-500">
                Cuenta
              </p>
              <div class="rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] ring-1 ring-gray-100 dark:ring-white/[0.04] overflow-hidden">
                <NuxtLink
                  :to="`/perfil/${profile.id}`"
                  class="flex items-center gap-3 px-3 py-2.5 active:bg-gray-100/70 dark:active:bg-white/[0.04] transition-colors"
                  :class="isPerfilActive ? 'bg-sky-50/60 dark:bg-sky-500/[0.08]' : ''"
                  @click="open = false"
                >
                  <span
                    class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-sky-100/70 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"
                  >
                    <UIcon name="i-heroicons-user-circle" class="w-[18px] h-[18px]" />
                  </span>
                  <span class="flex-1 text-[14px] font-semibold leading-none text-gray-800 dark:text-slate-200">
                    Mi Perfil
                  </span>
                  <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-gray-300 dark:text-slate-600" />
                </NuxtLink>
              </div>
            </section>

            <!-- Ajustes -->
            <section>
              <p class="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-slate-500">
                Ajustes
              </p>
              <div class="rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] ring-1 ring-gray-100 dark:ring-white/[0.04] overflow-hidden">
                <NuxtLink
                  to="/cambiar-contrasena"
                  class="flex items-center gap-3 px-3 py-2.5 active:bg-gray-100/70 dark:active:bg-white/[0.04] transition-colors"
                  @click="open = false"
                >
                  <span class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300">
                    <UIcon name="i-heroicons-key" class="w-[18px] h-[18px]" />
                  </span>
                  <span class="flex-1 text-[14px] font-semibold leading-none text-gray-800 dark:text-slate-200">
                    Cambiar contraseña
                  </span>
                  <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-gray-300 dark:text-slate-600" />
                </NuxtLink>

                <div class="flex items-center gap-3 px-3 py-2.5 border-t border-gray-100 dark:border-white/[0.04]">
                  <span
                    class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                    :class="isDark
                      ? 'bg-indigo-500/15 text-indigo-300'
                      : 'bg-amber-100 text-amber-600'"
                  >
                    <UIcon :name="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'" class="w-[18px] h-[18px]" />
                  </span>
                  <span class="flex-1 text-[14px] font-semibold leading-none text-gray-800 dark:text-slate-200">
                    Modo oscuro
                  </span>
                  <UToggle v-model="isDark" />
                </div>
              </div>
            </section>
          </div>

          <!-- Footer -->
          <div class="px-4 pt-3 pb-4 shrink-0 border-t border-gray-100 dark:border-white/[0.06] space-y-3">
            <button
              type="button"
              class="w-full flex items-center gap-3 px-3 py-3 rounded-2xl bg-rose-50 text-rose-600 active:bg-rose-100 transition-colors dark:bg-rose-500/10 dark:text-rose-300 dark:active:bg-rose-500/15"
              :disabled="loggingOut"
              @click="logout"
            >
              <span class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                <UIcon
                  :name="loggingOut ? 'i-heroicons-arrow-path' : 'i-heroicons-arrow-right-on-rectangle'"
                  class="w-[18px] h-[18px]"
                  :class="loggingOut ? 'animate-spin' : ''"
                />
              </span>
              <span class="flex-1 text-left text-[14px] font-bold leading-none">
                {{ loggingOut ? 'Saliendo…' : 'Cerrar Sesión' }}
              </span>
            </button>

            <div class="flex justify-center pt-1">
              <a
                href="https://soldemayosoft.com"
                target="_blank"
                rel="noopener"
                class="opacity-50 hover:opacity-80 transition-opacity"
              >
                <img src="/img/logo-soldemayosoft.png" alt="SolDeMayoSoft" class="h-6 dark:invert-0" />
              </a>
            </div>
          </div>
        </aside>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const open = useMobileMenuOpen()
const profile = useCurrentProfile()
const client = useSupabaseClient()
const route = useRoute()
const colorMode = useColorMode()

const loggingOut = ref(false)

const isActive = (path: string) => route.path === path || route.path.startsWith(`${path}/`)
const isPerfilActive = computed(() => {
  if (!profile.value?.id) return false
  return route.path === `/perfil/${profile.value.id}`
})

const navItems = computed(() => {
  const rol = profile.value?.rol
  const items: { to: string; label: string; icon: string }[] = [
    { to: '/dashboard', label: 'Inicio', icon: 'i-heroicons-home' },
    { to: '/ventas/nueva', label: 'Nueva Venta', icon: 'i-heroicons-plus-circle' },
    {
      to: '/ventas',
      label: rol === 'vendedor' || rol === 'lider' ? 'Mis Ventas' : 'Todas las Ventas',
      icon: 'i-heroicons-table-cells',
    },
  ]
  if (rol !== 'admin') {
    items.push({ to: '/comisiones', label: 'Mis Comisiones', icon: 'i-heroicons-banknotes' })
  }
  if (rol === 'admin') {
    items.push({ to: '/admin/asistente', label: 'Asistente IA', icon: 'i-heroicons-sparkles' })
    if (profile.value?.id === AUDITOR_PROFILE_ID) {
      items.push({ to: '/admin/asistente-historial', label: 'Historial IA', icon: 'i-heroicons-eye' })
    }
    items.push({ to: '/mapa', label: 'Mapa de Clientes', icon: 'i-heroicons-map' })
    items.push({ to: '/admin/usuarios', label: 'Usuarios', icon: 'i-heroicons-users' })
    items.push({ to: '/admin/grupos', label: 'Grupos', icon: 'i-heroicons-user-group' })
    items.push({ to: '/admin/catalogo', label: 'Catálogo', icon: 'i-heroicons-tag' })
    items.push({ to: '/admin/comisiones', label: 'Comisiones', icon: 'i-heroicons-calculator' })
    items.push({ to: '/admin/actividad', label: 'Actividad Personal', icon: 'i-heroicons-clock' })
  }
  return items
})

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (val: boolean) => {
    colorMode.preference = val ? 'dark' : 'light'
  },
})

const logout = async () => {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    profile.value = null
    await client.auth.signOut()
    open.value = false
    await navigateTo('/login')
  } finally {
    loggingOut.value = false
  }
}

// Bloquea scroll del body cuando el panel está abierto
watch(open, (isOpen) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

// Cierra el panel automáticamente al cambiar de ruta (e.g. tap en bottom nav)
watch(() => route.fullPath, () => {
  if (open.value) open.value = false
})

// ESC cierra el panel
const handleKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && open.value) open.value = false
}

onMounted(() => {
  window.addEventListener('keydown', handleKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey)
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 280ms cubic-bezier(0.32, 0.72, 0, 1);
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}
</style>
