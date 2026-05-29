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
  fibertec: '/img/logo-fibertec.png',
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
    card: 'bg-white shadow-card ring-green-100 dark:bg-green-500/[0.06] dark:ring-green-500/15',
    orb: 'bg-gradient-to-br from-green-300 via-emerald-200 to-transparent dark:from-green-500/40 dark:via-emerald-500/20',
    orb2: 'bg-gradient-to-tr from-green-400 to-teal-300 dark:from-green-500/30 dark:to-teal-500/20',
    title: 'text-green-600/80 dark:text-green-300/80',
    dot: 'bg-green-500 ring-green-500/20 dark:bg-green-300 dark:ring-green-300/30',
    dotPulse: 'bg-green-400 dark:bg-green-300',
    badge: 'bg-green-50/80 text-green-700 ring-green-200/60 dark:bg-green-500/15 dark:text-green-200 dark:ring-green-400/20',
    value: 'text-green-800 dark:text-white',
    sub: 'text-green-500/70 dark:text-green-300/50',
    body: 'text-green-900 dark:text-green-100',
    muted: 'text-green-500/60 dark:text-green-300/50',
    divider: 'bg-green-200/70 dark:bg-green-400/20',
    footer: 'border-green-100 dark:border-green-400/15 text-green-600/70 dark:text-green-300/50',
    logoFilter: 'green-logo-filter',
  },
  chipped: {
    card: 'bg-white shadow-card ring-red-100 dark:bg-red-500/[0.06] dark:ring-red-500/15',
    orb: 'bg-gradient-to-br from-red-300 via-rose-200 to-transparent dark:from-red-500/40 dark:via-rose-500/20',
    orb2: 'bg-gradient-to-tr from-red-400 to-orange-300 dark:from-red-500/30 dark:to-orange-500/20',
    title: 'text-red-600/80 dark:text-red-300/80',
    dot: 'bg-red-500 ring-red-500/20 dark:bg-red-300 dark:ring-red-300/30',
    dotPulse: 'bg-red-400 dark:bg-red-300',
    badge: 'bg-red-50/80 text-red-700 ring-red-200/60 dark:bg-red-500/15 dark:text-red-200 dark:ring-red-400/20',
    value: 'text-red-800 dark:text-white',
    sub: 'text-red-500/70 dark:text-red-300/50',
    body: 'text-red-900 dark:text-red-100',
    muted: 'text-red-500/60 dark:text-red-300/50',
    divider: 'bg-red-200/70 dark:bg-red-400/20',
    footer: 'border-red-100 dark:border-red-400/15 text-red-600/70 dark:text-red-300/50',
    logoFilter: 'red-logo-filter',
  },
  fibertec: {
    card: 'bg-white shadow-card ring-sky-100 dark:bg-sky-500/[0.06] dark:ring-sky-500/15',
    orb: 'bg-gradient-to-br from-sky-300 via-cyan-200 to-transparent dark:from-sky-500/40 dark:via-cyan-500/20',
    orb2: 'bg-gradient-to-tr from-sky-400 to-blue-300 dark:from-sky-500/30 dark:to-blue-500/20',
    title: 'text-sky-600/80 dark:text-sky-300/80',
    dot: 'bg-sky-500 ring-sky-500/20 dark:bg-sky-300 dark:ring-sky-300/30',
    dotPulse: 'bg-sky-400 dark:bg-sky-300',
    badge: 'bg-sky-50/80 text-sky-700 ring-sky-200/60 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-400/20',
    value: 'text-sky-800 dark:text-white',
    sub: 'text-sky-500/70 dark:text-sky-300/50',
    body: 'text-sky-900 dark:text-sky-100',
    muted: 'text-sky-500/60 dark:text-sky-300/50',
    divider: 'bg-sky-200/70 dark:bg-sky-400/20',
    footer: 'border-sky-100 dark:border-sky-400/15 text-sky-600/70 dark:text-sky-300/50',
    logoFilter: 'sky-logo-filter',
  },
}

const styles = computed(() => STYLES[props.empresa] ?? STYLES.express)
</script>

<style scoped>
.purple-logo-filter {
  filter: brightness(0) saturate(100%) sepia(100%) hue-rotate(240deg) saturate(3);
}
.green-logo-filter {
  filter: brightness(0) saturate(100%) sepia(100%) hue-rotate(90deg) saturate(3);
}
.red-logo-filter {
  filter: brightness(0) saturate(100%) sepia(100%) hue-rotate(320deg) saturate(4);
}
.sky-logo-filter {
  filter: brightness(0) saturate(100%) sepia(100%) hue-rotate(160deg) saturate(3);
}

/* Mask gradient para que el logo se desvanezca elegantemente y no moleste */
.logo-mask {
  -webkit-mask-image: linear-gradient(to top left, black 25%, transparent 85%);
  mask-image: linear-gradient(to top left, black 25%, transparent 85%);
}
</style>
