<template>
  <Transition name="scale-y">
    <div v-if="successMsg" class="mb-4">
      <div class="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
        <UIcon name="i-heroicons-check-circle" class="w-5 h-5 shrink-0 text-emerald-500 dark:text-emerald-400" />
        <p class="flex-1 leading-snug">{{ successMsg }}</p>
        <button
          class="p-0.5 rounded-md text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:text-emerald-200 dark:hover:bg-emerald-500/10 transition-colors shrink-0"
          @click="clearSuccess"
        >
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ successMsg: String }>()
const emit = defineEmits(['clearSuccess'])
const clearSuccess = () => emit('clearSuccess')
</script>
