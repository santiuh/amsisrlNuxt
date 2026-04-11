<template>
  <div class="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" :class="cardBgClass">
    <!-- Gradient accent -->
    <div class="absolute inset-0 opacity-[0.06] dark:opacity-10" :class="gradientClass" />
    <!-- Glow effect -->
    <div class="absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl opacity-10 dark:opacity-20" :class="glowClass" />

    <div class="relative">
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs font-semibold uppercase tracking-wider truncate" :class="labelClass">{{ label }}</p>
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" :class="iconBgClass">
          <UIcon :name="icon" class="h-4 w-4" />
        </div>
      </div>
      <p class="mt-2 font-extrabold leading-tight truncate" :class="[valueClass, valueSizeClass]">{{ value }}</p>
      <p v-if="sub" class="mt-1 text-xs font-medium truncate" :class="subClass">{{ sub }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  value: string | number
  icon: string
  sub?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'violet' | 'orange' | 'teal'
}>()

const valueSizeClass = computed(() => {
  const len = String(props.value).length
  if (len > 14) return 'text-lg sm:text-xl'
  if (len > 10) return 'text-xl sm:text-2xl'
  return 'text-2xl sm:text-3xl'
})

const colorThemes: Record<string, {
  cardBg: string; gradient: string; glow: string
  label: string; value: string; sub: string; iconBg: string
}> = {
  green: {
    cardBg: 'bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-500/20',
    gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
    glow: 'bg-emerald-500',
    label: 'text-emerald-700/70 dark:text-emerald-400/80',
    value: 'text-emerald-700 dark:text-emerald-300',
    sub: 'text-emerald-600/60 dark:text-emerald-400/60',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  },
  blue: {
    cardBg: 'bg-blue-50 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:ring-blue-500/20',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
    glow: 'bg-blue-500',
    label: 'text-blue-700/70 dark:text-blue-400/80',
    value: 'text-blue-700 dark:text-blue-300',
    sub: 'text-blue-600/60 dark:text-blue-400/60',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  },
  purple: {
    cardBg: 'bg-purple-50 ring-1 ring-purple-200 dark:bg-purple-950/40 dark:ring-purple-500/20',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
    glow: 'bg-purple-500',
    label: 'text-purple-700/70 dark:text-purple-400/80',
    value: 'text-purple-700 dark:text-purple-300',
    sub: 'text-purple-600/60 dark:text-purple-400/60',
    iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
  },
  orange: {
    cardBg: 'bg-orange-50 ring-1 ring-orange-200 dark:bg-orange-950/40 dark:ring-orange-500/20',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-700',
    glow: 'bg-orange-500',
    label: 'text-orange-700/70 dark:text-orange-400/80',
    value: 'text-orange-700 dark:text-orange-300',
    sub: 'text-orange-600/60 dark:text-orange-400/60',
    iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
  },
  teal: {
    cardBg: 'bg-teal-50 ring-1 ring-teal-200 dark:bg-teal-950/40 dark:ring-teal-500/20',
    gradient: 'bg-gradient-to-br from-teal-500 to-teal-700',
    glow: 'bg-teal-500',
    label: 'text-teal-700/70 dark:text-teal-400/80',
    value: 'text-teal-700 dark:text-teal-300',
    sub: 'text-teal-600/60 dark:text-teal-400/60',
    iconBg: 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
  },
  red: {
    cardBg: 'bg-red-50 ring-1 ring-red-200 dark:bg-red-950/40 dark:ring-red-500/20',
    gradient: 'bg-gradient-to-br from-red-500 to-red-700',
    glow: 'bg-red-500',
    label: 'text-red-700/70 dark:text-red-400/80',
    value: 'text-red-700 dark:text-red-300',
    sub: 'text-red-600/60 dark:text-red-400/60',
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
  },
  violet: {
    cardBg: 'bg-violet-50 ring-1 ring-violet-200 dark:bg-violet-950/40 dark:ring-violet-500/20',
    gradient: 'bg-gradient-to-br from-violet-500 to-violet-700',
    glow: 'bg-violet-500',
    label: 'text-violet-700/70 dark:text-violet-400/80',
    value: 'text-violet-700 dark:text-violet-300',
    sub: 'text-violet-600/60 dark:text-violet-400/60',
    iconBg: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
  },
  yellow: {
    cardBg: 'bg-yellow-50 ring-1 ring-yellow-200 dark:bg-yellow-950/40 dark:ring-yellow-500/20',
    gradient: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
    glow: 'bg-yellow-500',
    label: 'text-yellow-700/70 dark:text-yellow-400/80',
    value: 'text-yellow-700 dark:text-yellow-300',
    sub: 'text-yellow-600/60 dark:text-yellow-400/60',
    iconBg: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400',
  },
}

const theme = computed(() => colorThemes[props.color ?? 'blue'])
const cardBgClass = computed(() => theme.value.cardBg)
const gradientClass = computed(() => theme.value.gradient)
const glowClass = computed(() => theme.value.glow)
const labelClass = computed(() => theme.value.label)
const valueClass = computed(() => theme.value.value)
const subClass = computed(() => theme.value.sub)
const iconBgClass = computed(() => theme.value.iconBg)
</script>
