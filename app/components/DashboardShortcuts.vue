<template>
  <div class="space-y-4">
    <!-- Acciones primarias -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

    <!-- Atajos secundarios -->
    <div
      v-if="secondaryActions.length > 0"
      class="grid gap-3"
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
  { to: '/mi-avatar',         label: 'Mi Avatar',     description: 'Personalizar perfil',  icon: 'i-heroicons-user-circle',   color: 'violet'  },
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
</script>
