<template>
  <div
    v-if="ciclos.length > 0 || mesData"
    class="relative overflow-hidden rounded-2xl ring-1 transition-colors duration-500 select-none"
    :class="styles.card"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend.passive="onTouchEnd"
  >
    <!-- Orbs decorativos -->
    <div
      class="pointer-events-none absolute -top-20 -left-16 h-52 w-52 rounded-full blur-3xl opacity-40 dark:opacity-50 transition-opacity duration-500"
      :class="styles.orb"
    />
    <div
      class="pointer-events-none absolute -bottom-24 -right-10 h-56 w-56 rounded-full blur-3xl opacity-25 dark:opacity-35"
      :class="styles.orb2"
    />

    <!-- Logo watermark (cambia según vista) -->
    <img
      v-if="logoSrc"
      :src="logoSrc"
      :alt="logoAlt"
      class="pointer-events-none absolute -right-3 -bottom-3 h-32 w-auto object-contain opacity-[0.13] dark:opacity-[0.10] transition-all duration-500 logo-mask"
      :class="vista === 'ciclo' ? styles.logoFilter : ''"
    />

    <div class="relative p-4">
      <!-- Toggle MES / CICLO (solo si hay ambas modalidades disponibles) -->
      <div v-if="showToggle" class="mb-4 flex items-center gap-1 p-1 rounded-full bg-gray-100/70 dark:bg-white/[0.04] ring-1 ring-inset ring-gray-200/40 dark:ring-white/[0.04] w-fit">
        <button
          type="button"
          class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] transition-all duration-300"
          :class="vista === 'mes'
            ? 'bg-white text-cyan-700 shadow-sm ring-1 ring-inset ring-cyan-100 dark:bg-cyan-500/15 dark:text-cyan-200 dark:ring-cyan-400/20'
            : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'"
          @click="setVista('mes')"
        >
          Mes
        </button>
        <button
          type="button"
          class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] transition-all duration-300"
          :class="vista === 'ciclo'
            ? 'bg-white text-cyan-700 shadow-sm ring-1 ring-inset ring-cyan-100 dark:bg-cyan-500/15 dark:text-cyan-200 dark:ring-cyan-400/20'
            : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'"
          @click="setVista('ciclo')"
        >
          Ciclo
        </button>
      </div>

      <!-- =============================================== -->
      <!-- VISTA MES (default): AMSI consolidado          -->
      <!-- =============================================== -->
      <Transition name="hero-fade" mode="out-in">
        <div v-if="vista === 'mes' && mesData" key="mes">
          <!-- Header MES -->
          <div class="flex items-center justify-between gap-3 mb-3">
            <div class="flex items-center gap-2 min-w-0">
              <h3 class="text-[11px] font-bold uppercase tracking-[0.18em] truncate text-cyan-700/80 dark:text-cyan-300/80">
                AMSI · {{ mesData.tipo === 'comisiones' ? 'Comisiones del mes' : 'Ingresos del mes' }}
              </h3>
            </div>
            <span
              class="text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset whitespace-nowrap shrink-0 bg-cyan-50/80 text-cyan-700 ring-cyan-200/60 dark:bg-cyan-500/15 dark:text-cyan-200 dark:ring-cyan-400/20"
            >
              {{ mesActualLabel }}
            </span>
          </div>

          <!-- Big number -->
          <div class="flex items-baseline gap-1.5 flex-wrap">
            <span class="text-[2.5rem] leading-none font-black tracking-tight tabular-nums text-slate-900 dark:text-white">
              +{{ fmtIngreso(mesData.valorPrincipal) }}
            </span>
          </div>
          <p class="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-600/70 dark:text-cyan-300/50">
            {{ mesData.tipo === 'comisiones' ? 'Comisiones estimadas del ciclo' : 'Ingresos del ciclo' }}
          </p>

          <!-- Chips secundarios -->
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <template v-if="mesData.tipo === 'comisiones'">
              <div
                v-if="(mesData.comision ?? 0) > 0"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ring-1 ring-inset bg-cyan-50/70 ring-cyan-200/60 dark:bg-cyan-500/10 dark:ring-cyan-400/20"
              >
                <UIcon name="i-heroicons-banknotes" class="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-300" />
                <span class="text-sm font-bold tabular-nums text-slate-800 dark:text-cyan-100">{{ fmtCompact(mesData.comision ?? 0) }}</span>
                <span class="text-[10px] font-semibold uppercase tracking-wider text-cyan-700/70 dark:text-cyan-300/60">
                  comisión
                </span>
              </div>
              <div
                v-if="(mesData.bonus ?? 0) > 0"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ring-1 ring-inset bg-amber-50/70 ring-amber-200/60 dark:bg-amber-500/10 dark:ring-amber-400/20"
              >
                <UIcon name="i-heroicons-trophy" class="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
                <span class="text-sm font-bold tabular-nums text-slate-800 dark:text-amber-100">{{ fmtCompact(mesData.bonus ?? 0) }}</span>
                <span class="text-[10px] font-semibold uppercase tracking-wider text-amber-700/70 dark:text-amber-300/60">
                  bonus líder
                </span>
              </div>
            </template>
            <template v-else>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ring-1 ring-inset bg-cyan-50/70 ring-cyan-200/60 dark:bg-cyan-500/10 dark:ring-cyan-400/20">
                <UIcon name="i-heroicons-check-circle" class="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-300" />
                <span class="text-sm font-bold tabular-nums text-slate-800 dark:text-cyan-100">{{ mesData.concretadas }}</span>
                <span class="text-[10px] font-semibold uppercase tracking-wider text-cyan-700/70 dark:text-cyan-300/60">
                  concretadas
                </span>
              </div>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ring-1 ring-inset bg-cyan-50/70 ring-cyan-200/60 dark:bg-cyan-500/10 dark:ring-cyan-400/20">
                <UIcon name="i-heroicons-plus-circle" class="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-300" />
                <span class="text-sm font-bold tabular-nums text-slate-800 dark:text-cyan-100">{{ mesData.ventasCreadas }}</span>
                <span class="text-[10px] font-semibold uppercase tracking-wider text-cyan-700/70 dark:text-cyan-300/60">
                  creadas
                </span>
              </div>
            </template>
          </div>

          <!-- Footer breakdown por empresa -->
          <div
            v-if="breakdownEmpresas.length > 0"
            class="mt-4 pt-3 border-t border-cyan-100/60 dark:border-cyan-400/15 flex flex-wrap items-center gap-x-3 gap-y-1.5"
          >
            <span class="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700/60 dark:text-cyan-300/50">
              Desglose
            </span>
            <div
              v-for="(e, i) in breakdownEmpresas"
              :key="e.empresa"
              class="inline-flex items-center gap-1.5 text-[11px]"
            >
              <span class="inline-block h-1.5 w-1.5 rounded-full" :class="EMPRESA_DOTS[e.empresa] ?? 'bg-slate-400'" />
              <span class="font-semibold text-slate-700 dark:text-slate-200">{{ e.label }}</span>
              <span class="tabular-nums font-bold text-slate-900 dark:text-white">{{ fmtCompact(e.monto) }}</span>
              <span v-if="i < breakdownEmpresas.length - 1" class="text-cyan-300/50 dark:text-cyan-400/20">·</span>
            </div>
          </div>
        </div>

        <!-- =============================================== -->
        <!-- VISTA CICLO (secundaria): por empresa          -->
        <!-- =============================================== -->
        <div v-else-if="vista === 'ciclo' && active" key="ciclo">
          <!-- Pills de empresas -->
          <div v-if="ciclos.length > 1" class="flex items-center gap-1.5 mb-4 overflow-x-auto -mx-1 px-1 pb-1">
            <button
              v-for="c in ciclos"
              :key="c.empresa"
              type="button"
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset whitespace-nowrap transition-all active:scale-95"
              :class="c.empresa === active.empresa ? STYLES[c.empresa]?.activePill : 'bg-gray-50 text-gray-500 ring-gray-200 dark:bg-white/[0.04] dark:text-slate-400 dark:ring-white/[0.06]'"
              @click="selectEmpresa(c.empresa)"
            >
              <span class="relative flex h-1.5 w-1.5">
                <span
                  v-if="c.empresa === active.empresa"
                  class="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                  :class="STYLES[c.empresa]?.dotPulse"
                />
                <span class="relative inline-flex h-1.5 w-1.5 rounded-full" :class="STYLES[c.empresa]?.dot" />
              </span>
              {{ c.label }}
            </button>
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between gap-3 mb-3">
            <div class="flex items-center gap-2 min-w-0">
              <h3 class="text-[11px] font-bold uppercase tracking-[0.18em] truncate" :class="cicloStyles.title">
                {{ active.label }} · Ciclo actual
              </h3>
            </div>
            <span
              class="text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset whitespace-nowrap tabular-nums shrink-0"
              :class="cicloStyles.badge"
            >
              {{ fmtFecha(active.fechaInicio) }} → {{ fmtFecha(active.fechaCierre) }}
            </span>
          </div>

          <!-- Big number -->
          <div class="flex items-baseline gap-1.5 flex-wrap">
            <span class="text-[2.5rem] leading-none font-black tracking-tight tabular-nums" :class="cicloStyles.value">
              +{{ fmtIngreso(active.ingresos) }}
            </span>
          </div>
          <p class="mt-1.5 text-[11px] font-semibold uppercase tracking-wider" :class="cicloStyles.sub">
            Ingresos del ciclo
          </p>

          <!-- Chips de stats -->
          <div class="mt-4 flex items-center gap-2">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ring-1 ring-inset" :class="cicloStyles.chip">
              <UIcon name="i-heroicons-check-circle" class="w-3.5 h-3.5" :class="cicloStyles.chipIcon" />
              <span class="text-sm font-bold tabular-nums" :class="cicloStyles.body">{{ active.concretadas }}</span>
              <span class="text-[10px] font-semibold uppercase tracking-wider" :class="cicloStyles.muted">
                concretadas
              </span>
            </div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ring-1 ring-inset" :class="cicloStyles.chip">
              <UIcon name="i-heroicons-plus-circle" class="w-3.5 h-3.5" :class="cicloStyles.chipIcon" />
              <span class="text-sm font-bold tabular-nums" :class="cicloStyles.body">{{ active.ventasCreadas }}</span>
              <span class="text-[10px] font-semibold uppercase tracking-wider" :class="cicloStyles.muted">
                creadas
              </span>
            </div>
          </div>

          <!-- Footer último ciclo -->
          <div
            v-if="active.ultimoCiclo"
            class="mt-4 pt-3 border-t flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]"
            :class="cicloStyles.footer"
          >
            <span class="font-semibold uppercase tracking-wider opacity-70">Último ciclo</span>
            <span class="tabular-nums font-medium">+{{ fmtIngreso(active.ultimoCiclo.ingresos) }}</span>
            <span class="opacity-50">·</span>
            <span class="tabular-nums">{{ active.ultimoCiclo.concretadas }} conc</span>
            <span class="opacity-50">·</span>
            <span class="tabular-nums">{{ active.ultimoCiclo.creadas }} creadas</span>
          </div>

          <!-- Indicador swipe -->
          <div v-if="ciclos.length > 1" class="mt-3 flex items-center justify-center gap-1.5">
            <span
              v-for="c in ciclos"
              :key="`dot-${c.empresa}`"
              class="h-1 rounded-full transition-all duration-300"
              :class="c.empresa === active.empresa
                ? `w-5 ${STYLES[c.empresa]?.dot}`
                : 'w-1 bg-gray-300 dark:bg-white/15'"
            />
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
interface UltimoCiclo {
  ingresos: number
  concretadas: number
  creadas: number
}

interface CicloMobile {
  empresa: string
  label: string
  fechaInicio: string
  fechaCierre: string
  ingresos: number
  concretadas: number
  ventasCreadas: number
  ultimoCiclo: UltimoCiclo | null
}

interface MesData {
  valorPrincipal: number
  tipo: 'comisiones' | 'ingresos'
  comision?: number
  bonus?: number
  concretadas: number
  ventasCreadas: number
  porEmpresa: Array<{ empresa: string; label: string; monto: number }>
}

const props = defineProps<{
  ciclos: CicloMobile[]
  mesData?: MesData | null
}>()

const STORAGE_EMPRESA = 'dashboard-empresa-mobile'
const STORAGE_VISTA = 'dashboard-hero-vista-mobile'

// ----------- Vista (mes / ciclo) -----------
const vista = ref<'mes' | 'ciclo'>('mes')

const showToggle = computed(() => Boolean(props.mesData) && props.ciclos.length > 0)

onMounted(() => {
  if (!import.meta.client) return
  const savedVista = localStorage.getItem(STORAGE_VISTA)
  if (savedVista === 'mes' || savedVista === 'ciclo') {
    vista.value = savedVista
  } else {
    vista.value = props.mesData ? 'mes' : 'ciclo'
  }

  const savedEmpresa = localStorage.getItem(STORAGE_EMPRESA)
  if (savedEmpresa && props.ciclos.some(c => c.empresa === savedEmpresa)) {
    activeEmpresa.value = savedEmpresa
  } else if (props.ciclos[0]) {
    activeEmpresa.value = props.ciclos[0].empresa
  }
})

const setVista = (v: 'mes' | 'ciclo') => {
  if (v === 'mes' && !props.mesData) return
  if (v === 'ciclo' && props.ciclos.length === 0) return
  vista.value = v
  if (import.meta.client) localStorage.setItem(STORAGE_VISTA, v)
}

// ----------- Empresa activa (vista ciclo) -----------
const activeEmpresa = ref<string>(props.ciclos[0]?.empresa ?? 'express')

watch(
  () => props.ciclos.map(c => c.empresa).join(','),
  () => {
    if (!props.ciclos.some(c => c.empresa === activeEmpresa.value) && props.ciclos[0]) {
      activeEmpresa.value = props.ciclos[0].empresa
    }
  },
)

const active = computed<CicloMobile | undefined>(() =>
  props.ciclos.find(c => c.empresa === activeEmpresa.value) ?? props.ciclos[0],
)

const selectEmpresa = (empresa: string) => {
  activeEmpresa.value = empresa
  if (import.meta.client) localStorage.setItem(STORAGE_EMPRESA, empresa)
}

// ----------- Swipe (solo vista ciclo) -----------
let touchStartX = 0
let touchEndX = 0
const onTouchStart = (e: TouchEvent) => {
  touchStartX = e.changedTouches[0]?.screenX ?? 0
  touchEndX = touchStartX
}
const onTouchMove = (e: TouchEvent) => {
  touchEndX = e.changedTouches[0]?.screenX ?? touchEndX
}
const onTouchEnd = () => {
  if (vista.value !== 'ciclo') return
  const delta = touchEndX - touchStartX
  if (Math.abs(delta) < 50 || props.ciclos.length < 2) return
  const idx = props.ciclos.findIndex(c => c.empresa === activeEmpresa.value)
  if (idx === -1) return
  const next = delta < 0
    ? Math.min(idx + 1, props.ciclos.length - 1)
    : Math.max(idx - 1, 0)
  if (next !== idx) selectEmpresa(props.ciclos[next]!.empresa)
}

// ----------- Formatters -----------
const fmtIngreso = (n: number) =>
  `$${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n)}`

const fmtCompact = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `$${Math.round(n / 1_000)}k`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  return `$${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n)}`
}

const fmtFecha = (f: string) => {
  if (!f) return ''
  const date = f.length === 10 ? new Date(`${f}T12:00:00`) : new Date(f)
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric' })
}

const mesActualLabel = computed(() => {
  const d = new Date()
  const s = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
})

const breakdownEmpresas = computed(() =>
  (props.mesData?.porEmpresa ?? []).filter(e => e.monto > 0),
)

// ----------- Logos -----------
const LOGOS_EMPRESA: Record<string, string> = {
  express: '/img/logo-express.png',
  ultra: '/img/logo-ultra.png',
  chipped: '/img/logo-chipped.png',
}
const LOGO_AMSI = '/img/logo.png'

const logoSrc = computed(() => {
  if (vista.value === 'mes') return LOGO_AMSI
  return active.value ? LOGOS_EMPRESA[active.value.empresa] : undefined
})

const logoAlt = computed(() => {
  if (vista.value === 'mes') return 'AMSI'
  return active.value?.label ?? ''
})

// ----------- Estilos -----------
const EMPRESA_DOTS: Record<string, string> = {
  express: 'bg-purple-500',
  ultra: 'bg-violet-500',
  chipped: 'bg-emerald-500',
}

const STYLES_MES = {
  card: 'bg-white shadow-card ring-cyan-100 dark:bg-cyan-500/[0.05] dark:ring-cyan-500/15',
  orb: 'bg-gradient-to-br from-cyan-300 via-sky-200 to-transparent dark:from-cyan-500/40 dark:via-sky-500/20',
  orb2: 'bg-gradient-to-tr from-sky-400 to-cyan-300 dark:from-sky-500/30 dark:to-cyan-500/20',
}

const STYLES: Record<string, Record<string, string>> = {
  express: {
    card: 'bg-white shadow-card ring-purple-100 dark:bg-purple-500/[0.06] dark:ring-purple-500/15',
    orb: 'bg-gradient-to-br from-purple-300 via-fuchsia-200 to-transparent dark:from-purple-500/40 dark:via-fuchsia-500/20',
    orb2: 'bg-gradient-to-tr from-purple-400 to-pink-300 dark:from-purple-500/30 dark:to-pink-500/20',
    title: 'text-purple-600/80 dark:text-purple-300/80',
    dot: 'bg-purple-500 dark:bg-purple-300',
    dotPulse: 'bg-purple-400 dark:bg-purple-300',
    badge: 'bg-purple-50/80 text-purple-700 ring-purple-200/60 dark:bg-purple-500/15 dark:text-purple-200 dark:ring-purple-400/20',
    activePill: 'bg-purple-100/90 text-purple-700 ring-purple-300/70 dark:bg-purple-500/20 dark:text-purple-200 dark:ring-purple-400/30',
    value: 'text-purple-800 dark:text-white',
    sub: 'text-purple-500/70 dark:text-purple-300/50',
    body: 'text-purple-900 dark:text-purple-100',
    muted: 'text-purple-500/70 dark:text-purple-300/60',
    chip: 'bg-purple-50/70 ring-purple-200/60 dark:bg-purple-500/10 dark:ring-purple-400/20',
    chipIcon: 'text-purple-600 dark:text-purple-300',
    footer: 'border-purple-100 dark:border-purple-400/15 text-purple-600/70 dark:text-purple-300/50',
    logoFilter: 'purple-logo-filter',
  },
  ultra: {
    card: 'bg-white shadow-card ring-violet-100 dark:bg-violet-500/[0.06] dark:ring-violet-500/15',
    orb: 'bg-gradient-to-br from-violet-300 via-indigo-200 to-transparent dark:from-violet-500/40 dark:via-indigo-500/20',
    orb2: 'bg-gradient-to-tr from-violet-400 to-sky-300 dark:from-violet-500/30 dark:to-sky-500/20',
    title: 'text-violet-600/80 dark:text-violet-300/80',
    dot: 'bg-violet-500 dark:bg-violet-300',
    dotPulse: 'bg-violet-400 dark:bg-violet-300',
    badge: 'bg-violet-50/80 text-violet-700 ring-violet-200/60 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-400/20',
    activePill: 'bg-violet-100/90 text-violet-700 ring-violet-300/70 dark:bg-violet-500/20 dark:text-violet-200 dark:ring-violet-400/30',
    value: 'text-violet-800 dark:text-white',
    sub: 'text-violet-500/70 dark:text-violet-300/50',
    body: 'text-violet-900 dark:text-violet-100',
    muted: 'text-violet-500/70 dark:text-violet-300/60',
    chip: 'bg-violet-50/70 ring-violet-200/60 dark:bg-violet-500/10 dark:ring-violet-400/20',
    chipIcon: 'text-violet-600 dark:text-violet-300',
    footer: 'border-violet-100 dark:border-violet-400/15 text-violet-600/70 dark:text-violet-300/50',
    logoFilter: 'violet-logo-filter',
  },
  chipped: {
    card: 'bg-white shadow-card ring-emerald-100 dark:bg-emerald-500/[0.06] dark:ring-emerald-500/15',
    orb: 'bg-gradient-to-br from-emerald-300 via-teal-200 to-transparent dark:from-emerald-500/40 dark:via-teal-500/20',
    orb2: 'bg-gradient-to-tr from-emerald-400 to-lime-300 dark:from-emerald-500/30 dark:to-lime-500/20',
    title: 'text-emerald-600/80 dark:text-emerald-300/80',
    dot: 'bg-emerald-500 dark:bg-emerald-300',
    dotPulse: 'bg-emerald-400 dark:bg-emerald-300',
    badge: 'bg-emerald-50/80 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/20',
    activePill: 'bg-emerald-100/90 text-emerald-700 ring-emerald-300/70 dark:bg-emerald-500/20 dark:text-emerald-200 dark:ring-emerald-400/30',
    value: 'text-emerald-800 dark:text-white',
    sub: 'text-emerald-500/70 dark:text-emerald-300/50',
    body: 'text-emerald-900 dark:text-emerald-100',
    muted: 'text-emerald-500/70 dark:text-emerald-300/60',
    chip: 'bg-emerald-50/70 ring-emerald-200/60 dark:bg-emerald-500/10 dark:ring-emerald-400/20',
    chipIcon: 'text-emerald-600 dark:text-emerald-300',
    footer: 'border-emerald-100 dark:border-emerald-400/15 text-emerald-600/70 dark:text-emerald-300/50',
    logoFilter: 'emerald-logo-filter',
  },
}

const cicloStyles = computed(() =>
  active.value ? (STYLES[active.value.empresa] ?? STYLES.express!) : STYLES.express!,
)

// Card+orbs aplicados al contenedor: cambian según vista
const styles = computed(() => {
  if (vista.value === 'mes') return STYLES_MES
  return cicloStyles.value
})
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
.logo-mask {
  -webkit-mask-image: linear-gradient(to top left, black 25%, transparent 85%);
  mask-image: linear-gradient(to top left, black 25%, transparent 85%);
}

.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}
.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
