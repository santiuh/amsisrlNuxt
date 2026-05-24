<template>
  <div v-if="profile" class="md:hidden flex items-center gap-3 px-1 pt-2 pb-4">
    <button
      type="button"
      class="flex items-center gap-3 min-w-0 active:opacity-70 transition-opacity group flex-1"
      @click="mobileMenuOpen = true"
    >
      <!-- Avatar con gradient ring sutil -->
      <div class="relative shrink-0">
        <div
          class="absolute -inset-[3px] rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-fuchsia-500 opacity-60 dark:opacity-70 blur-[2px] group-active:opacity-100 transition-opacity duration-300"
          aria-hidden="true"
        />
        <div class="relative w-11 h-11 rounded-full overflow-hidden ring-2 ring-[#f4f6f8] dark:ring-[#080e1a]">
          <UserAvatar :config="profile.avatar_config ?? null" :seed="profile.nombre ?? ''" class="w-full h-full" />
        </div>
      </div>

      <div class="min-w-0 text-left">
        <!-- Línea micro: icon dinámico + saludo -->
        <p class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] leading-none text-gray-400 dark:text-slate-500">
          <UIcon :name="timeMeta.icon" class="w-3 h-3" :class="timeMeta.iconColor" />
          <span>{{ greeting }}</span>
        </p>
        <!-- Nombre principal -->
        <p class="text-[18px] font-extrabold text-gray-900 dark:text-white truncate leading-tight mt-1.5 tracking-tight">
          {{ firstName }}
        </p>
      </div>
    </button>

    <!-- Badge de rol con dot pulse -->
    <div class="shrink-0">
      <span
        class="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] bg-gradient-to-br from-cyan-50 to-sky-50/60 text-cyan-700 ring-1 ring-cyan-200/70 dark:from-cyan-500/15 dark:to-sky-500/5 dark:text-cyan-300 dark:ring-cyan-500/20"
      >
        <span class="relative flex h-1.5 w-1.5">
          <span
            class="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-cyan-400 dark:bg-cyan-300"
            aria-hidden="true"
          />
          <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400" />
        </span>
        {{ rolLabel }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const profile = useCurrentProfile()
const mobileMenuOpen = useMobileMenuOpen()

// Saludo según franja horaria. Se evalúa en cada render (no hay reloj).
const now = computed(() => new Date())

const firstName = computed(() => {
  const n = profile.value?.nombre?.trim() ?? ''
  const first = n.split(/\s+/)[0] ?? n
  if (!first) return ''
  // Normaliza: primera mayúscula, resto minúscula (acepta "VALENTINA" → "Valentina")
  return first.charAt(0).toLocaleUpperCase('es-AR') + first.slice(1).toLocaleLowerCase('es-AR')
})

const rolLabel = computed(() => {
  const labels: Record<string, string> = {
    vendedor: 'Vendedor',
    oficinista: 'Oficinista',
    lider: 'Líder',
    admin: 'Admin',
  }
  return labels[profile.value?.rol ?? ''] ?? ''
})

const greeting = computed(() => {
  const h = now.value.getHours()
  if (h >= 5 && h < 12) return 'Buen día'
  if (h >= 12 && h < 19) return 'Buenas tardes'
  return 'Buenas noches'
})

const timeMeta = computed(() => {
  const h = now.value.getHours()
  // Amanecer (5-9) — sol naciente, naranja cálido
  if (h >= 5 && h < 9) {
    return { icon: 'i-heroicons-sun', iconColor: 'text-amber-500 dark:text-amber-400' }
  }
  // Día (9-17) — sol pleno, dorado/sky
  if (h >= 9 && h < 17) {
    return { icon: 'i-heroicons-sun-solid', iconColor: 'text-amber-400 dark:text-amber-300' }
  }
  // Atardecer (17-20) — sol cayendo, naranja
  if (h >= 17 && h < 20) {
    return { icon: 'i-heroicons-sun', iconColor: 'text-orange-500 dark:text-orange-400' }
  }
  // Noche (20-5) — luna, índigo
  return { icon: 'i-heroicons-moon', iconColor: 'text-indigo-400 dark:text-indigo-300' }
})
</script>
