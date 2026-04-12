<template>
  <Transition name="scale-y">
    <div v-if="errorMsg" class="mb-4">
      <div class="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium bg-red-50 text-red-700 ring-1 ring-red-200/60 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20">
        <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 shrink-0 text-red-500 dark:text-red-400" />
        <p class="flex-1 leading-snug">{{ errorMsg }}</p>
        <button
          class="p-0.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-200 dark:hover:bg-red-500/10 transition-colors shrink-0"
          @click="clearError"
        >
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ errorMsg: String }>()
const emit = defineEmits(['clearError'])
const clearError = () => emit('clearError')
</script>
