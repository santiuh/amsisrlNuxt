<template>
  <div
    class="group relative overflow-hidden rounded-2xl ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
    :class="styles.card"
  >
    <!-- Radial glow / orb decorativo (esquina superior izquierda) -->
    <div
      class="pointer-events-none absolute -top-20 -left-16 h-52 w-52 rounded-full blur-3xl opacity-40 dark:opacity-50 transition-opacity duration-500 group-hover:opacity-60"
      :class="styles.orb"
    />

    <!-- Gradient mesh secundario (más sutil) -->
    <div
      class="pointer-events-none absolute -bottom-24 -right-10 h-56 w-56 rounded-full blur-3xl opacity-25 dark:opacity-35"
      :class="styles.orb2"
    />

    <!-- Logo empresa watermark: más grande, con mask gradient para desvanecerse -->
    <img
      v-if="logoSrc"
      :src="logoSrc"
      :alt="label"
      class="pointer-events-none absolute -right-3 -bottom-3 h-32 lg:h-36 w-auto object-contain opacity-[0.13] dark:opacity-[0.10] transition-all duration-500 group-hover:scale-[1.08] group-hover:opacity-[0.18] dark:group-hover:opacity-[0.16] logo-mask"
      :class="styles.logoFilter"
    />

    <div class="relative p-5 lg:p-6">
      <!-- Header: pulse + label + badge fechas -->
      <div class="flex items-center justify-between gap-3 mb-5">
        <div class="flex items-center gap-2">
          <span class="relative flex h-2 w-2">
            <span
              class="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
              :class="styles.dotPulse"
            />
            <span class="relative inline-flex h-2 w-2 rounded-full ring-2" :class="styles.dot" />
          </span>
          <h3 class="text-[11px] font-bold uppercase tracking-[0.18em]" :class="styles.title">
            {{ label }}
          </h3>
        </div>
        <span
          class="text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset whitespace-nowrap tabular-nums"
          :class="styles.badge"
        >
          {{ fmtFecha(fechaInicio) }} → {{ fmtFecha(fechaCierre) }}
        </span>
      </div>

      <!-- Stat principal: ingresos del ciclo -->
      <div class="flex items-baseline gap-1.5 flex-wrap">
        <span
          class="text-[2rem] xl:text-[2.5rem] leading-none font-black tracking-tight tabular-nums"
          :class="styles.value"
        >
          +{{ fmtIngreso(ingresos) }}
        </span>
      </div>
      <p class="mt-1.5 text-[11px] font-semibold uppercase tracking-wider" :class="styles.sub">
        Ingresos del ciclo
      </p>

      <!-- Stats secundarios: concretadas / creadas -->
      <div class="mt-5 flex items-center gap-4">
        <div class="flex items-baseline gap-1.5">
          <span class="text-xl font-bold tabular-nums" :class="styles.body">{{ concretadas }}</span>
          <span class="text-[10px] font-semibold uppercase tracking-wider" :class="styles.muted">
            concretadas
          </span>
        </div>
        <div class="h-6 w-px" :class="styles.divider" />
        <div class="flex items-baseline gap-1.5">
          <span class="text-xl font-bold tabular-nums" :class="styles.body">{{ ventasCreadas }}</span>
          <span class="text-[10px] font-semibold uppercase tracking-wider" :class="styles.muted">
            creadas
          </span>
        </div>
      </div>

      <!-- Footer: último ciclo -->
      <div
        v-if="ultimoCiclo"
        class="mt-5 pt-3 border-t flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]"
        :class="styles.footer"
      >
        <span class="font-semibold uppercase tracking-wider opacity-70">Último ciclo</span>
        <span class="tabular-nums font-medium">+{{ fmtIngreso(ultimoCiclo.ingresos) }}</span>
        <span class="opacity-50">·</span>
        <span class="tabular-nums">{{ ultimoCiclo.concretadas }} concretadas</span>
        <span class="opacity-50">·</span>
        <span class="tabular-nums">{{ ultimoCiclo.creadas }} creadas</span>
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
  chipped: '/img/logo-chipped.png',
}

const logoSrc = computed(() => LOGOS[props.empresa])

const STYLES: Record<string, Record<string, string>> = {
  express: {
    card: 'bg-white shadow-card ring-purple-100 dark:bg-purple-500/[0.06] dark:ring-purple-500/15',
    orb: 'bg-gradient-to-br from-purple-300 via-fuchsia-200 to-transparent dark:from-purple-500/40 dark:via-fuchsia-500/20',
    orb2: 'bg-gradient-to-tr from-purple-400 to-pink-300 dark:from-purple-500/30 dark:to-pink-500/20',
    title: 'text-purple-600/80 dark:text-purple-300/80',
    dot: 'bg-purple-500 ring-purple-500/20 dark:bg-purple-300 dark:ring-purple-300/30',
    dotPulse: 'bg-purple-400 dark:bg-purple-300',
    badge: 'bg-purple-50/80 text-purple-700 ring-purple-200/60 dark:bg-purple-500/15 dark:text-purple-200 dark:ring-purple-400/20',
    value: 'text-purple-800 dark:text-white',
    sub: 'text-purple-500/70 dark:text-purple-300/50',
    body: 'text-purple-900 dark:text-purple-100',
    muted: 'text-purple-500/60 dark:text-purple-300/50',
    divider: 'bg-purple-200/70 dark:bg-purple-400/20',
    footer: 'border-purple-100 dark:border-purple-400/15 text-purple-600/70 dark:text-purple-300/50',
    logoFilter: 'purple-logo-filter',
  },
  ultra: {
    card: 'bg-white shadow-card ring-violet-100 dark:bg-violet-500/[0.06] dark:ring-violet-500/15',
    orb: 'bg-gradient-to-br from-violet-300 via-indigo-200 to-transparent dark:from-violet-500/40 dark:via-indigo-500/20',
    orb2: 'bg-gradient-to-tr from-violet-400 to-sky-300 dark:from-violet-500/30 dark:to-sky-500/20',
    title: 'text-violet-600/80 dark:text-violet-300/80',
    dot: 'bg-violet-500 ring-violet-500/20 dark:bg-violet-300 dark:ring-violet-300/30',
    dotPulse: 'bg-violet-400 dark:bg-violet-300',
    badge: 'bg-violet-50/80 text-violet-700 ring-violet-200/60 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-400/20',
    value: 'text-violet-800 dark:text-white',
    sub: 'text-violet-500/70 dark:text-violet-300/50',
    body: 'text-violet-900 dark:text-violet-100',
    muted: 'text-violet-500/60 dark:text-violet-300/50',
    divider: 'bg-violet-200/70 dark:bg-violet-400/20',
    footer: 'border-violet-100 dark:border-violet-400/15 text-violet-600/70 dark:text-violet-300/50',
    logoFilter: 'violet-logo-filter',
  },
  chipped: {
    card: 'bg-white shadow-card ring-emerald-100 dark:bg-emerald-500/[0.06] dark:ring-emerald-500/15',
    orb: 'bg-gradient-to-br from-emerald-300 via-teal-200 to-transparent dark:from-emerald-500/40 dark:via-teal-500/20',
    orb2: 'bg-gradient-to-tr from-emerald-400 to-lime-300 dark:from-emerald-500/30 dark:to-lime-500/20',
    title: 'text-emerald-600/80 dark:text-emerald-300/80',
    dot: 'bg-emerald-500 ring-emerald-500/20 dark:bg-emerald-300 dark:ring-emerald-300/30',
    dotPulse: 'bg-emerald-400 dark:bg-emerald-300',
    badge: 'bg-emerald-50/80 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/20',
    value: 'text-emerald-800 dark:text-white',
    sub: 'text-emerald-500/70 dark:text-emerald-300/50',
    body: 'text-emerald-900 dark:text-emerald-100',
    muted: 'text-emerald-500/60 dark:text-emerald-300/50',
    divider: 'bg-emerald-200/70 dark:bg-emerald-400/20',
    footer: 'border-emerald-100 dark:border-emerald-400/15 text-emerald-600/70 dark:text-emerald-300/50',
    logoFilter: 'emerald-logo-filter',
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
.emerald-logo-filter {
  filter: brightness(0) saturate(100%) sepia(100%) hue-rotate(110deg) saturate(3);
}

/* Mask gradient para que el logo se desvanezca elegantemente y no moleste */
.logo-mask {
  -webkit-mask-image: linear-gradient(to top left, black 25%, transparent 85%);
  mask-image: linear-gradient(to top left, black 25%, transparent 85%);
}
</style>
