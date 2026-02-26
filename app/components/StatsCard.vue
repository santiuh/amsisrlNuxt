<template>
  <UCard>
    <div class="flex items-center gap-4">
      <div class="p-3 rounded-lg" :class="bgColor">
        <UIcon :name="icon" class="w-6 h-6" :class="iconColor" />
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ label }}</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ value }}</p>
        <p v-if="sub" class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ sub }}</p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  value: string | number
  icon: string
  sub?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'teal'
}>()

const colorMap: Record<string, { bg: string; icon: string }> = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-500/15',   icon: 'text-blue-600 dark:text-blue-300' },
  green:  { bg: 'bg-green-50 dark:bg-green-500/15', icon: 'text-green-600 dark:text-green-300' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-500/15', icon: 'text-yellow-600 dark:text-yellow-300' },
  red:    { bg: 'bg-red-50 dark:bg-red-500/15', icon: 'text-red-600 dark:text-red-300' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-500/15', icon: 'text-purple-600 dark:text-purple-300' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-500/15', icon: 'text-orange-600 dark:text-orange-300' },
  teal:   { bg: 'bg-teal-50 dark:bg-teal-500/15', icon: 'text-teal-600 dark:text-teal-300' },
}

const colors = computed(() => colorMap[props.color ?? 'blue'] ?? colorMap.blue)
const bgColor = computed(() => colors.value.bg)
const iconColor = computed(() => colors.value.icon)
</script>
