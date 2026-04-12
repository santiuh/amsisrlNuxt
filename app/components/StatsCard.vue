<template>
  <div
    class="relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:shadow-card-hover"
    :class="cardBgClass"
  >
    <!-- Subtle gradient accent -->
    <div class="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" :class="gradientClass" />

    <div class="relative">
      <div class="flex items-center justify-between gap-2">
        <p class="text-[11px] font-semibold uppercase tracking-wider truncate" :class="labelClass">{{ label }}</p>
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" :class="iconBgClass">
          <UIcon :name="icon" class="h-4 w-4" />
        </div>
      </div>
      <p class="mt-2 font-bold leading-tight truncate" :class="[valueClass, valueSizeClass]">{{ value }}</p>
      <p v-if="sub" class="mt-1 text-[11px] font-medium truncate" :class="subClass">{{ sub }}</p>
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
  cardBg: string; gradient: string
  label: string; value: string; sub: string; iconBg: string
}> = {
  green: {
    cardBg: 'bg-white shadow-card ring-1 ring-emerald-100 dark:bg-emerald-500/[0.06] dark:ring-emerald-500/15',
    gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
    label: 'text-emerald-600/70 dark:text-emerald-400/70',
    value: 'text-emerald-700 dark:text-emerald-300',
    sub: 'text-emerald-500/50 dark:text-emerald-400/50',
    iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  blue: {
    cardBg: 'bg-white shadow-card ring-1 ring-blue-100 dark:bg-blue-500/[0.06] dark:ring-blue-500/15',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
    label: 'text-blue-600/70 dark:text-blue-400/70',
    value: 'text-blue-700 dark:text-blue-300',
    sub: 'text-blue-500/50 dark:text-blue-400/50',
    iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  },
  purple: {
    cardBg: 'bg-white shadow-card ring-1 ring-purple-100 dark:bg-purple-500/[0.06] dark:ring-purple-500/15',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
    label: 'text-purple-600/70 dark:text-purple-400/70',
    value: 'text-purple-700 dark:text-purple-300',
    sub: 'text-purple-500/50 dark:text-purple-400/50',
    iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400',
  },
  orange: {
    cardBg: 'bg-white shadow-card ring-1 ring-orange-100 dark:bg-orange-500/[0.06] dark:ring-orange-500/15',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-700',
    label: 'text-orange-600/70 dark:text-orange-400/70',
    value: 'text-orange-700 dark:text-orange-300',
    sub: 'text-orange-500/50 dark:text-orange-400/50',
    iconBg: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
  },
  teal: {
    cardBg: 'bg-white shadow-card ring-1 ring-teal-100 dark:bg-teal-500/[0.06] dark:ring-teal-500/15',
    gradient: 'bg-gradient-to-br from-teal-500 to-teal-700',
    label: 'text-teal-600/70 dark:text-teal-400/70',
    value: 'text-teal-700 dark:text-teal-300',
    sub: 'text-teal-500/50 dark:text-teal-400/50',
    iconBg: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
  },
  red: {
    cardBg: 'bg-white shadow-card ring-1 ring-red-100 dark:bg-red-500/[0.06] dark:ring-red-500/15',
    gradient: 'bg-gradient-to-br from-red-500 to-red-700',
    label: 'text-red-600/70 dark:text-red-400/70',
    value: 'text-red-700 dark:text-red-300',
    sub: 'text-red-500/50 dark:text-red-400/50',
    iconBg: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  },
  violet: {
    cardBg: 'bg-white shadow-card ring-1 ring-violet-100 dark:bg-violet-500/[0.06] dark:ring-violet-500/15',
    gradient: 'bg-gradient-to-br from-violet-500 to-violet-700',
    label: 'text-violet-600/70 dark:text-violet-400/70',
    value: 'text-violet-700 dark:text-violet-300',
    sub: 'text-violet-500/50 dark:text-violet-400/50',
    iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  },
  yellow: {
    cardBg: 'bg-white shadow-card ring-1 ring-amber-100 dark:bg-amber-500/[0.06] dark:ring-amber-500/15',
    gradient: 'bg-gradient-to-br from-amber-500 to-amber-700',
    label: 'text-amber-600/70 dark:text-amber-400/70',
    value: 'text-amber-700 dark:text-amber-300',
    sub: 'text-amber-500/50 dark:text-amber-400/50',
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  },
}

const theme = computed(() => colorThemes[props.color ?? 'blue'])
const cardBgClass = computed(() => theme.value.cardBg)
const gradientClass = computed(() => theme.value.gradient)
const labelClass = computed(() => theme.value.label)
const valueClass = computed(() => theme.value.value)
const subClass = computed(() => theme.value.sub)
const iconBgClass = computed(() => theme.value.iconBg)
</script>
