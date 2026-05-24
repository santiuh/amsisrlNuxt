<template>
  <div class="space-y-3 md:space-y-4">
    <!-- Acciones primarias (solo desktop — en mobile están en MobileBottomNav) -->
    <div class="hidden md:grid grid-cols-2 gap-4">
      <NuxtLink
        v-for="action in primaryActions"
        :key="action.to"
        :to="action.to"
        class="group flex items-center gap-4 p-5 rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] hover:ring-gray-200 dark:hover:ring-white/[0.1] hover:shadow-md transition-all"
      >
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          :class="colorClasses[action.color]"
        >
          <UIcon :name="action.icon" class="w-6 h-6" />
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-base font-semibold text-gray-800 dark:text-gray-100">{{ action.label }}</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ action.description }}</p>
        </div>
        <UIcon
          name="i-heroicons-arrow-right"
          class="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all"
        />
      </NuxtLink>
    </div>

    <!-- Atajos secundarios — mobile: grid responsive (3 cols si caben, 2 si son más) -->
    <div
      v-if="secondaryActions.length > 0"
      class="md:hidden grid gap-2"
      :class="mobileGridClass"
    >
      <NuxtLink
        v-for="action in secondaryActions"
        :key="`m-${action.to}`"
        :to="action.to"
        class="group relative flex flex-col items-center text-center gap-2 py-3 px-2 rounded-2xl bg-white ring-1 ring-gray-100 active:scale-[0.97] active:bg-gray-50 dark:bg-white/[0.03] dark:ring-white/[0.06] dark:active:bg-white/[0.06] transition-all duration-150"
      >
        <div
          class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ring-1 ring-inset"
          :class="colorTileClasses[action.color]"
        >
          <UIcon :name="action.icon" class="w-5 h-5" :class="colorIconClasses[action.color]" />
        </div>
        <h4 class="text-[11px] font-semibold text-gray-700 dark:text-gray-200 leading-tight truncate w-full">{{ action.label }}</h4>
      </NuxtLink>
    </div>

    <!-- Atajos secundarios — desktop: layout original -->
    <div
      v-if="secondaryActions.length > 0"
      class="hidden md:grid gap-3"
      :class="secondaryGridClass"
    >
      <NuxtLink
        v-for="action in secondaryActions"
        :key="action.to"
        :to="action.to"
        class="group flex flex-col gap-3 p-4 rounded-2xl bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] hover:ring-gray-200 dark:hover:ring-white/[0.1] hover:shadow-md transition-all"
      >
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center"
          :class="colorClasses[action.color]"
        >
          <UIcon :name="action.icon" class="w-5 h-5" />
        </div>
        <div>
          <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ action.label }}</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ action.description }}</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
type ShortcutColor = 'cyan' | 'sky' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate'
type Rol = 'admin' | 'oficinista' | 'vendedor' | 'lider'

interface Shortcut {
  to: string
  label: string
  description: string
  icon: string
  color: ShortcutColor
}

const profile = useCurrentProfile()

const colorClasses: Record<ShortcutColor, string> = {
  cyan:    'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400',
  sky:     'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  violet:  'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  amber:   'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  rose:    'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  slate:   'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400',
}

// Variante con ring para tiles mobile (más definidos contra el fondo)
const colorTileClasses: Record<ShortcutColor, string> = {
  cyan:    'bg-gradient-to-br from-cyan-50 to-cyan-100/60 ring-cyan-200/50 dark:from-cyan-500/15 dark:to-cyan-500/5 dark:ring-cyan-400/20',
  sky:     'bg-gradient-to-br from-sky-50 to-sky-100/60 ring-sky-200/50 dark:from-sky-500/15 dark:to-sky-500/5 dark:ring-sky-400/20',
  emerald: 'bg-gradient-to-br from-emerald-50 to-emerald-100/60 ring-emerald-200/50 dark:from-emerald-500/15 dark:to-emerald-500/5 dark:ring-emerald-400/20',
  violet:  'bg-gradient-to-br from-violet-50 to-violet-100/60 ring-violet-200/50 dark:from-violet-500/15 dark:to-violet-500/5 dark:ring-violet-400/20',
  amber:   'bg-gradient-to-br from-amber-50 to-amber-100/60 ring-amber-200/50 dark:from-amber-500/15 dark:to-amber-500/5 dark:ring-amber-400/20',
  rose:    'bg-gradient-to-br from-rose-50 to-rose-100/60 ring-rose-200/50 dark:from-rose-500/15 dark:to-rose-500/5 dark:ring-rose-400/20',
  slate:   'bg-gradient-to-br from-slate-50 to-slate-100/60 ring-slate-200/50 dark:from-slate-500/15 dark:to-slate-500/5 dark:ring-slate-400/20',
}

const colorIconClasses: Record<ShortcutColor, string> = {
  cyan:    'text-cyan-600 dark:text-cyan-300',
  sky:     'text-sky-600 dark:text-sky-300',
  emerald: 'text-emerald-600 dark:text-emerald-300',
  violet:  'text-violet-600 dark:text-violet-300',
  amber:   'text-amber-600 dark:text-amber-300',
  rose:    'text-rose-600 dark:text-rose-300',
  slate:   'text-slate-600 dark:text-slate-300',
}

const NUEVA_VENTA: Shortcut = {
  to: '/ventas/nueva',
  label: 'Nueva Venta',
  description: 'Cargar una venta nueva',
  icon: 'i-heroicons-plus-circle',
  color: 'cyan',
}

const MIS_VENTAS: Shortcut = {
  to: '/ventas',
  label: 'Mis Ventas',
  description: 'Buscar, filtrar y exportar',
  icon: 'i-heroicons-table-cells',
  color: 'sky',
}

const TODAS_VENTAS: Shortcut = {
  to: '/ventas',
  label: 'Todas las Ventas',
  description: 'Buscar, filtrar y exportar',
  icon: 'i-heroicons-table-cells',
  color: 'sky',
}

const adminPrimary: Shortcut[] = [NUEVA_VENTA, TODAS_VENTAS]

const adminSecondary: Shortcut[] = [
  { to: '/admin/comisiones', label: 'Comisiones', description: 'Ciclos y estimaciones', icon: 'i-heroicons-calculator', color: 'emerald' },
  { to: '/admin/usuarios',   label: 'Usuarios',   description: 'Crear y administrar',   icon: 'i-heroicons-users',      color: 'violet'  },
  { to: '/admin/grupos',     label: 'Grupos',     description: 'Líderes y equipos',     icon: 'i-heroicons-user-group', color: 'amber'   },
  { to: '/admin/catalogo',   label: 'Catálogo',   description: 'Paquetes y extras',     icon: 'i-heroicons-tag',        color: 'rose'    },
  { to: '/admin/actividad',  label: 'Actividad',  description: 'Monitor de personal',   icon: 'i-heroicons-clock',      color: 'slate'   },
]

const vendedorLiderPrimary: Shortcut[] = [NUEVA_VENTA, MIS_VENTAS]

const vendedorLiderSecondary: Shortcut[] = [
  { to: '/ventas/borradores', label: 'Borradores',    description: 'Ventas sin terminar',  icon: 'i-heroicons-document-text', color: 'amber'   },
  { to: '/comisiones',        label: 'Mis Comisiones', description: 'Ciclo actual e historial', icon: 'i-heroicons-banknotes', color: 'emerald' },
  { to: '/ventas',            label: 'Mis Ventas',    description: 'Buscar, filtrar y exportar', icon: 'i-heroicons-table-cells', color: 'sky'  },
]

const rol = computed<Rol | undefined>(() => profile.value?.rol as Rol | undefined)

const primaryActions = computed<Shortcut[]>(() => {
  if (rol.value === 'admin') return adminPrimary
  if (rol.value === 'vendedor' || rol.value === 'lider') return vendedorLiderPrimary
  return []
})

const secondaryActions = computed<Shortcut[]>(() => {
  if (rol.value === 'admin') return adminSecondary
  if (rol.value === 'vendedor' || rol.value === 'lider') return vendedorLiderSecondary
  return []
})

// 5 cols para admin, 3 cols para vendedor/lider — mantiene tiles de tamaño parejo
const secondaryGridClass = computed(() =>
  secondaryActions.value.length >= 5
    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
)

// Mobile: si son 3 (vendedor/lider) usa 3 cols; si son más (admin) usa 2 cols
const mobileGridClass = computed(() =>
  secondaryActions.value.length === 3
    ? 'grid-cols-3'
    : secondaryActions.value.length === 4
      ? 'grid-cols-4'
      : 'grid-cols-2',
)
</script>
