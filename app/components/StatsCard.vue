<template>
  <div class="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" :class="cardBgClass">
    <!-- Gradient accent -->
    <div class="absolute inset-0 opacity-10" :class="gradientClass" />
    <!-- Glow effect -->
    <div class="absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl opacity-20" :class="glowClass" />

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
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'teal'
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
    cardBg: 'bg-emerald-950/40 ring-1 ring-emerald-500/20',
    gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
    glow: 'bg-emerald-500',
    label: 'text-emerald-400/80',
    value: 'text-emerald-300',
    sub: 'text-emerald-400/60',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
  },
  blue: {
    cardBg: 'bg-blue-950/40 ring-1 ring-blue-500/20',
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
    glow: 'bg-blue-500',
    label: 'text-blue-400/80',
    value: 'text-blue-300',
    sub: 'text-blue-400/60',
    iconBg: 'bg-blue-500/20 text-blue-400',
  },
  purple: {
    cardBg: 'bg-purple-950/40 ring-1 ring-purple-500/20',
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
    glow: 'bg-purple-500',
    label: 'text-purple-400/80',
    value: 'text-purple-300',
    sub: 'text-purple-400/60',
    iconBg: 'bg-purple-500/20 text-purple-400',
  },
  orange: {
    cardBg: 'bg-orange-950/40 ring-1 ring-orange-500/20',
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-700',
    glow: 'bg-orange-500',
    label: 'text-orange-400/80',
    value: 'text-orange-300',
    sub: 'text-orange-400/60',
    iconBg: 'bg-orange-500/20 text-orange-400',
  },
  teal: {
    cardBg: 'bg-teal-950/40 ring-1 ring-teal-500/20',
    gradient: 'bg-gradient-to-br from-teal-500 to-teal-700',
    glow: 'bg-teal-500',
    label: 'text-teal-400/80',
    value: 'text-teal-300',
    sub: 'text-teal-400/60',
    iconBg: 'bg-teal-500/20 text-teal-400',
  },
  red: {
    cardBg: 'bg-red-950/40 ring-1 ring-red-500/20',
    gradient: 'bg-gradient-to-br from-red-500 to-red-700',
    glow: 'bg-red-500',
    label: 'text-red-400/80',
    value: 'text-red-300',
    sub: 'text-red-400/60',
    iconBg: 'bg-red-500/20 text-red-400',
  },
  yellow: {
    cardBg: 'bg-yellow-950/40 ring-1 ring-yellow-500/20',
    gradient: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
    glow: 'bg-yellow-500',
    label: 'text-yellow-400/80',
    value: 'text-yellow-300',
    sub: 'text-yellow-400/60',
    iconBg: 'bg-yellow-500/20 text-yellow-400',
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
