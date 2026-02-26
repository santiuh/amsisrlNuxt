<template>
  <UCard>
    <div class="flex items-center gap-4">
      <div class="p-3 rounded-lg" :class="bgColor">
        <UIcon :name="icon" class="w-6 h-6" :class="iconColor" />
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500">{{ label }}</p>
        <p class="text-2xl font-bold text-gray-900">{{ value }}</p>
        <p v-if="sub" class="text-xs text-gray-400 mt-0.5">{{ sub }}</p>
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
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}>()

const colorMap: Record<string, { bg: string; icon: string }> = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600' },
  yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
}

const colors = computed(() => colorMap[props.color ?? 'blue'])
const bgColor = computed(() => colors.value.bg)
const iconColor = computed(() => colors.value.icon)
</script>
