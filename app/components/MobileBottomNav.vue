<template>
  <nav
    class="md:hidden fixed bottom-0 inset-x-0 z-30"
    style="padding-bottom: env(safe-area-inset-bottom);"
  >
    <!-- Background con notch (SVG curvado en el centro para el FAB) -->
    <svg
      viewBox="0 0 400 88"
      preserveAspectRatio="none"
      class="absolute inset-0 w-full h-full text-white dark:text-[#0b1220] drop-shadow-[0_-6px_20px_rgba(0,0,0,0.06)] dark:drop-shadow-[0_-6px_20px_rgba(0,0,0,0.5)]"
      aria-hidden="true"
    >
      <!-- Path con notch semicircular en el centro -->
      <path
        d="M 0 14 L 148 14 C 166 14 172 44 200 44 C 228 44 234 14 252 14 L 400 14 L 400 88 L 0 88 Z"
        fill="currentColor"
        class="stroke-gray-200/70 dark:stroke-white/[0.06]"
        stroke-width="1"
      />
    </svg>

    <div class="relative grid grid-cols-5 items-end h-[68px] px-1">
      <!-- Inicio -->
      <NuxtLink
        to="/dashboard"
        class="flex flex-col items-center justify-end gap-1 h-full pb-2 group"
      >
        <UIcon
          name="i-heroicons-home"
          class="w-[22px] h-[22px] transition-all duration-200"
          :class="isActive('/dashboard')
            ? 'text-cyan-600 dark:text-cyan-400 scale-110'
            : 'text-gray-400 dark:text-slate-500 group-active:text-gray-600'"
        />
        <span
          class="text-[10px] font-semibold transition-colors duration-200 leading-none"
          :class="isActive('/dashboard') ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-slate-500'"
        >
          Inicio
        </span>
      </NuxtLink>

      <!-- Mis Ventas -->
      <NuxtLink
        :to="ventasPath"
        class="flex flex-col items-center justify-end gap-1 h-full pb-2 group"
      >
        <UIcon
          name="i-heroicons-table-cells"
          class="w-[22px] h-[22px] transition-all duration-200"
          :class="isVentasActive
            ? 'text-cyan-600 dark:text-cyan-400 scale-110'
            : 'text-gray-400 dark:text-slate-500 group-active:text-gray-600'"
        />
        <span
          class="text-[10px] font-semibold transition-colors duration-200 leading-none"
          :class="isVentasActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-slate-500'"
        >
          {{ ventasLabel }}
        </span>
      </NuxtLink>

      <!-- FAB Nueva Venta (sobresale por el notch) -->
      <div class="flex justify-center">
        <NuxtLink
          to="/ventas/nueva"
          class="fab-link relative -mt-7 w-16 h-16 rounded-full flex items-center justify-center active:scale-95 transition-transform duration-200"
          aria-label="Nueva Venta"
        >
          <!-- Halo animado (pulse glow) -->
          <span
            class="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 opacity-40 blur-md animate-pulse-glow"
            aria-hidden="true"
          />
          <!-- Botón principal -->
          <span
            class="relative w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-400 via-sky-500 to-fuchsia-600 text-white shadow-[0_8px_24px_-4px_rgba(8,145,178,0.5),inset_0_-2px_4px_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.3)] ring-[3px] ring-white dark:ring-[#0b1220]"
          >
            <UIcon name="i-heroicons-plus" class="w-8 h-8 drop-shadow-sm" />
          </span>
        </NuxtLink>
      </div>

      <!-- Comisiones -->
      <NuxtLink
        to="/comisiones"
        class="flex flex-col items-center justify-end gap-1 h-full pb-2 group"
      >
        <UIcon
          name="i-heroicons-banknotes"
          class="w-[22px] h-[22px] transition-all duration-200"
          :class="isActive('/comisiones')
            ? 'text-cyan-600 dark:text-cyan-400 scale-110'
            : 'text-gray-400 dark:text-slate-500 group-active:text-gray-600'"
        />
        <span
          class="text-[10px] font-semibold transition-colors duration-200 leading-none"
          :class="isActive('/comisiones') ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-slate-500'"
        >
          Comisiones
        </span>
      </NuxtLink>

      <!-- Menú (toggle) -->
      <button
        type="button"
        class="flex flex-col items-center justify-end gap-1 h-full pb-2 group active:opacity-70"
        :aria-expanded="mobileMenuOpen"
        aria-controls="mobile-menu-panel"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <UIcon
          :name="mobileMenuOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'"
          class="w-[22px] h-[22px] transition-all duration-200"
          :class="mobileMenuOpen
            ? 'text-cyan-600 dark:text-cyan-400 scale-110'
            : 'text-gray-400 dark:text-slate-500 group-active:text-gray-600'"
        />
        <span
          class="text-[10px] font-semibold transition-colors duration-200 leading-none"
          :class="mobileMenuOpen ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-slate-500'"
        >
          {{ mobileMenuOpen ? 'Cerrar' : 'Menú' }}
        </span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
const profile = useCurrentProfile()
const mobileMenuOpen = useMobileMenuOpen()

const isActive = (path: string) => route.path === path || route.path.startsWith(`${path}/`)

const ventasPath = '/ventas'
const isVentasActive = computed(() =>
  route.path === ventasPath || route.path.startsWith(`${ventasPath}/`),
)

const ventasLabel = computed(() => {
  const rol = profile.value?.rol
  return rol === 'vendedor' || rol === 'lider' ? 'Mis Ventas' : 'Ventas'
})
</script>

<style scoped>
@keyframes pulse-glow {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(1.1); }
}
.animate-pulse-glow {
  animation: pulse-glow 2.6s ease-in-out infinite;
}
</style>
