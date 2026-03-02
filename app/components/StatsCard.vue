<template>
  <UCard class="shadow-sm ring-1 ring-gray-200 dark:ring-white/10">
    <div class="flex items-center justify-between gap-4">
      <div class="min-w-0">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ label }}</p>
        <p class="text-5xl leading-none mt-1 font-bold text-emerald-600 dark:text-emerald-400">{{ value }}</p>
        <p v-if="sub" class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ sub }}</p>
      </div>
      <div class="h-14 w-14 shrink-0 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
        <UIcon :name="icon" class="w-7 h-7" />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  icon: string
  sub?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'teal'
}>()
</script>
