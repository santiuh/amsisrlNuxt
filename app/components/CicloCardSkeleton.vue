<template>
  <div
    class="relative overflow-hidden rounded-2xl ring-1 transition-colors"
    :class="styles.card"
  >
    <!-- Orbs decorativos (mismos del CicloCard real) -->
    <div
      class="pointer-events-none absolute -top-20 -left-16 h-52 w-52 rounded-full blur-3xl opacity-30 dark:opacity-40"
      :class="styles.orb"
    />
    <div
      class="pointer-events-none absolute -bottom-24 -right-10 h-56 w-56 rounded-full blur-3xl opacity-20 dark:opacity-30"
      :class="styles.orb2"
    />

    <div class="relative p-5 lg:p-6">
      <!-- Header: dot + título + badge fechas -->
      <div class="flex items-center justify-between gap-3 mb-5">
        <div class="flex items-center gap-2">
          <SkeletonBox variant="circle" tone="neutral" width="8" height="8" />
          <SkeletonBox variant="text" tone="neutral" width="88" height="11" />
        </div>
        <SkeletonBox variant="pill" tone="neutral" width="120" height="18" />
      </div>

      <!-- Stat principal -->
      <SkeletonBox variant="rect" tone="neutral" width="62%" height="40" rounded="rounded-lg" />
      <SkeletonBox variant="text" tone="neutral" width="120" height="11" class="mt-3" />

      <!-- Stats secundarios -->
      <div class="mt-6 flex items-center gap-4">
        <div class="flex items-baseline gap-1.5">
          <SkeletonBox variant="text" tone="neutral" width="28" height="22" />
          <SkeletonBox variant="text" tone="neutral" width="74" height="10" />
        </div>
        <div class="h-6 w-px" :class="styles.divider" />
        <div class="flex items-baseline gap-1.5">
          <SkeletonBox variant="text" tone="neutral" width="28" height="22" />
          <SkeletonBox variant="text" tone="neutral" width="58" height="10" />
        </div>
      </div>

      <!-- Footer último ciclo -->
      <div
        class="mt-5 pt-3 border-t flex flex-wrap items-center gap-x-2 gap-y-1"
        :class="styles.footer"
      >
        <SkeletonBox variant="text" tone="neutral" width="84" height="10" />
        <SkeletonBox variant="text" tone="neutral" width="56" height="11" />
        <SkeletonBox variant="text" tone="neutral" width="72" height="11" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Empresa = 'express' | 'ultra' | 'chipped' | 'fibertec'

const props = withDefaults(defineProps<{
  empresa?: Empresa
}>(), {
  empresa: 'express',
})

const TONE_MAP: Record<Empresa, 'purple' | 'green' | 'red' | 'sky'> = {
  express: 'purple',
  ultra: 'green',
  chipped: 'red',
  fibertec: 'sky',
}

const tone = computed(() => TONE_MAP[props.empresa])

const STYLES: Record<Empresa, Record<string, string>> = {
  express: {
    card: 'bg-white shadow-card ring-purple-100 dark:bg-purple-500/[0.06] dark:ring-purple-500/15',
    orb: 'bg-gradient-to-br from-purple-300 via-fuchsia-200 to-transparent dark:from-purple-500/40 dark:via-fuchsia-500/20',
    orb2: 'bg-gradient-to-tr from-purple-400 to-pink-300 dark:from-purple-500/30 dark:to-pink-500/20',
    divider: 'bg-purple-200/70 dark:bg-purple-400/20',
    footer: 'border-purple-100 dark:border-purple-400/15',
  },
  ultra: {
    card: 'bg-white shadow-card ring-green-100 dark:bg-green-500/[0.06] dark:ring-green-500/15',
    orb: 'bg-gradient-to-br from-green-300 via-emerald-200 to-transparent dark:from-green-500/40 dark:via-emerald-500/20',
    orb2: 'bg-gradient-to-tr from-green-400 to-teal-300 dark:from-green-500/30 dark:to-teal-500/20',
    divider: 'bg-green-200/70 dark:bg-green-400/20',
    footer: 'border-green-100 dark:border-green-400/15',
  },
  chipped: {
    card: 'bg-white shadow-card ring-red-100 dark:bg-red-500/[0.06] dark:ring-red-500/15',
    orb: 'bg-gradient-to-br from-red-300 via-rose-200 to-transparent dark:from-red-500/40 dark:via-rose-500/20',
    orb2: 'bg-gradient-to-tr from-red-400 to-orange-300 dark:from-red-500/30 dark:to-orange-500/20',
    divider: 'bg-red-200/70 dark:bg-red-400/20',
    footer: 'border-red-100 dark:border-red-400/15',
  },
  fibertec: {
    card: 'bg-white shadow-card ring-sky-100 dark:bg-sky-500/[0.06] dark:ring-sky-500/15',
    orb: 'bg-gradient-to-br from-sky-300 via-cyan-200 to-transparent dark:from-sky-500/40 dark:via-cyan-500/20',
    orb2: 'bg-gradient-to-tr from-sky-400 to-blue-300 dark:from-sky-500/30 dark:to-blue-500/20',
    divider: 'bg-sky-200/70 dark:bg-sky-400/20',
    footer: 'border-sky-100 dark:border-sky-400/15',
  },
}

const styles = computed(() => STYLES[props.empresa])
</script>
