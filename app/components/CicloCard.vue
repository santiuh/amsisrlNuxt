<template>
  <div class="rounded-2xl p-5 ring-1 overflow-hidden relative transition-all duration-200 hover:shadow-card-hover" :class="styles.card">
    <!-- Gradient accent -->
    <div class="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" :class="styles.gradient" />

    <!-- Logo empresa watermark -->
    <img
      v-if="logoSrc"
      :src="logoSrc"
      :alt="label"
      class="absolute bottom-3 right-3 h-10 w-auto object-contain opacity-[0.08] dark:opacity-[0.06]"
      :class="styles.logoFilter"
    />

    <div class="relative">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-[11px] font-bold uppercase tracking-widest" :class="styles.title">
          {{ label }}
        </h3>
        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" :class="styles.badge">
          {{ fmtFecha(fechaInicio) }} · {{ fmtFecha(fechaCierre) }}
        </span>
      </div>

      <!-- Main stat -->
      <div class="flex items-baseline gap-1.5 flex-wrap">
        <span class="text-2xl sm:text-3xl font-extrabold tracking-tight" :class="styles.value">
          +{{ fmtIngreso(ingresos) }}
        </span>
        <span class="text-xs font-medium" :class="styles.sub">este ciclo de</span>
      </div>

      <p class="text-sm font-semibold mt-1 uppercase tracking-wide" :class="styles.body">
        {{ concretadas }} ventas concretadas
      </p>

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
  const date = f.length === 10 ? new Date(`${f}T12:00:00`) : new Date(f)
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric' })
}

const LOGOS: Record<string, string> = {
  express: '/img/logo-express.png',
  ultra: '/img/logo-ultra.png',
}

const logoSrc = computed(() => LOGOS[props.empresa])

const STYLES: Record<string, Record<string, string>> = {
  express: {
    card: 'bg-white shadow-card ring-purple-100 dark:bg-purple-500/[0.06] dark:ring-purple-500/15',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
    title: 'text-purple-600/70 dark:text-purple-400/70',
    badge: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
    value: 'text-purple-700 dark:text-purple-200',
    sub: 'text-purple-500/50 dark:text-purple-400/50',
    body: 'text-purple-700/70 dark:text-purple-300/60',
    muted: 'text-purple-500/40 dark:text-purple-400/40',
    footer: 'border-t border-purple-100/50 dark:border-purple-500/10 text-purple-500/40 dark:text-purple-400/30',
    logoFilter: 'purple-logo-filter',
  },
  ultra: {
    card: 'bg-white shadow-card ring-violet-100 dark:bg-violet-500/[0.06] dark:ring-violet-500/15',
    gradient: 'bg-gradient-to-br from-violet-500 to-violet-700',
    title: 'text-violet-600/70 dark:text-violet-400/70',
    badge: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    value: 'text-violet-700 dark:text-violet-200',
    sub: 'text-violet-500/50 dark:text-violet-400/50',
    body: 'text-violet-700/70 dark:text-violet-300/60',
    muted: 'text-violet-500/40 dark:text-violet-400/40',
    footer: 'border-t border-violet-100/50 dark:border-violet-500/10 text-violet-500/40 dark:text-violet-400/30',
    logoFilter: 'violet-logo-filter',
  },
}

const styles = computed(() => STYLES[props.empresa] ?? STYLES.express)
</script>

<style scoped>
.purple-logo-filter {
  filter: brightness(0) saturate(100%) sepia(100%) hue-rotate(240deg) saturate(3);
}
.violet-logo-filter {
  filter: brightness(0) saturate(100%) sepia(100%) hue-rotate(260deg) saturate(3);
}
</style>
