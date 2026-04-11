<template>
  <div class="rounded-2xl p-5 ring-1 overflow-hidden relative" :class="styles.card">
    <!-- Gradient accent -->
    <div class="absolute inset-0 opacity-[0.06] dark:opacity-10" :class="styles.gradient" />
    <div class="absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl opacity-10 dark:opacity-20" :class="styles.glow" />

    <!-- Logo empresa -->
    <img
      v-if="logoSrc"
      :src="logoSrc"
      :alt="label"
      class="absolute bottom-3 right-3 h-10 w-auto object-contain opacity-15 dark:opacity-10"
      :class="styles.logoFilter"
    />

    <div class="relative">
      <!-- Header: empresa + dates -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-bold uppercase tracking-widest" :class="styles.title">
          {{ label }}
        </h3>
        <span class="text-[10px] font-semibold px-2.5 py-1 rounded-full" :class="styles.badge">
          {{ fmtFecha(fechaInicio) }} · {{ fmtFecha(fechaCierre) }}
        </span>
      </div>

      <!-- Main stat: income -->
      <div class="flex items-baseline gap-1.5 flex-wrap">
        <span class="text-2xl sm:text-3xl font-extrabold" :class="styles.value">
          +{{ fmtIngreso(ingresos) }}
        </span>
        <span class="text-sm font-medium" :class="styles.sub">este ciclo de</span>
      </div>

      <!-- Concretadas -->
      <p class="text-sm font-semibold mt-1 uppercase tracking-wide" :class="styles.body">
        {{ concretadas }} ventas concretadas
      </p>

      <!-- Creadas -->
      <div class="flex items-center gap-1.5 mt-3" :class="styles.muted">
        <UIcon name="i-heroicons-document-plus" class="w-4 h-4 shrink-0" />
        <span class="text-sm">{{ ventasCreadas }} ventas creadas</span>
      </div>

      <!-- Ultimo ciclo -->
      <div v-if="ultimoCiclo" class="mt-4 pt-3 text-xs" :class="styles.footer">
        Último Ciclo: +{{ fmtIngreso(ultimoCiclo.ingresos) }} /
        {{ ultimoCiclo.concretadas }} concretadas /
        {{ ultimoCiclo.creadas }} creadas
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  empresa: string
  label: string
  fechaInicio: string
  fechaCierre: string
  ingresos: number
  concretadas: number
  ventasCreadas: number
  ultimoCiclo: { ingresos: number; concretadas: number; creadas: number } | null
}>()

const fmtIngreso = (n: number) => {
  const formatted = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n)
  return `$${formatted}`
}

const fmtFecha = (f: string) => {
  if (!f) return ''
  return new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

const LOGOS: Record<string, string> = {
  express: '/img/logo-express.png',
  ultra: '/img/logo-ultra.png',
}

const logoSrc = computed(() => LOGOS[props.empresa])

const STYLES: Record<string, Record<string, string>> = {
  express: {
    card: 'bg-purple-50 ring-purple-200 dark:bg-purple-950/50 dark:ring-purple-500/20',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
    glow: 'bg-purple-500',
    title: 'text-purple-700/70 dark:text-purple-400/80',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
    value: 'text-purple-700 dark:text-purple-200',
    sub: 'text-purple-600/60 dark:text-purple-400/50',
    body: 'text-purple-700/80 dark:text-purple-300/70',
    muted: 'text-purple-600/50 dark:text-purple-400/40',
    footer: 'border-t border-purple-200/30 dark:border-purple-500/10 text-purple-600/40 dark:text-purple-400/30',
    logoFilter: 'purple-logo-filter',
  },
  ultra: {
    card: 'bg-violet-50 ring-violet-200 dark:bg-violet-950/50 dark:ring-violet-500/20',
    gradient: 'bg-gradient-to-br from-violet-500 to-violet-700',
    glow: 'bg-violet-500',
    title: 'text-violet-700/70 dark:text-violet-400/80',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
    value: 'text-violet-700 dark:text-violet-200',
    sub: 'text-violet-600/60 dark:text-violet-400/50',
    body: 'text-violet-700/80 dark:text-violet-300/70',
    muted: 'text-violet-600/50 dark:text-violet-400/40',
    footer: 'border-t border-violet-200/30 dark:border-violet-500/10 text-violet-600/40 dark:text-violet-400/30',
    logoFilter: 'violet-logo-filter',
  },
}

const styles = computed(() => STYLES[props.empresa] ?? STYLES.express)
</script>

<style scoped>
/* Filtros de color para teñir el logo al tono del contenedor */
.purple-logo-filter {
  filter: brightness(0) saturate(100%) sepia(100%) hue-rotate(240deg) saturate(3);
}
.violet-logo-filter {
  filter: brightness(0) saturate(100%) sepia(100%) hue-rotate(260deg) saturate(3);
}
</style>
